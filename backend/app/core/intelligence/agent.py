"""AI Memory Agent - Conversational AI that reasons over user's memories."""

import asyncio
import logging
import re
from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID, uuid4
import json

from google import genai
from google.genai import types

from app.config import settings
from app.core.retrieval import search_service
from app.models.search import SearchQuery, SearchMode

logger = logging.getLogger(__name__)


class ConversationMessage:
    """Represents a message in the conversation."""
    
    def __init__(
        self,
        role: str,  # "user" or "assistant"
        content: str,
        memory_refs: Optional[List[UUID]] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ):
        self.id = uuid4()
        self.role = role
        self.content = content
        self.memory_refs = memory_refs or []
        self.metadata = metadata or {}
        self.timestamp = datetime.utcnow()

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": str(self.id),
            "role": self.role,
            "content": self.content,
            "memory_refs": [str(ref) for ref in self.memory_refs],
            "metadata": self.metadata,
            "timestamp": self.timestamp.isoformat(),
        }


class Conversation:
    """Represents a conversation session."""
    
    def __init__(self, user_id: Optional[str] = None):
        self.id = uuid4()
        self.user_id = user_id
        self.messages: List[ConversationMessage] = []
        self.created_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()
        self.context_memory_ids: List[UUID] = []

    def add_message(self, message: ConversationMessage):
        self.messages.append(message)
        self.updated_at = datetime.utcnow()

    def get_history(self, last_n: int = 10) -> List[Dict[str, str]]:
        """Get conversation history for context."""
        return [
            {"role": m.role, "content": m.content}
            for m in self.messages[-last_n:]
        ]


class MemoryAgent:
    """AI agent that can reason over user's memories."""

    # Retry configuration
    MAX_RETRIES = 3
    BASE_RETRY_DELAY = 2.0  # seconds
    # Use stable model first (higher free tier), then experimental as fallback
    PRIMARY_MODEL = "gemini-2.0-flash"
    FALLBACK_MODEL = "gemini-2.0-flash"


    SYSTEM_PROMPT = """You are Memora, an AI assistant that helps users explore and understand their personal knowledge base. You have access to the user's memories, notes, ideas, and documents.

Your capabilities:
1. Answer questions by searching and synthesizing information from the user's memories
2. Find connections between different pieces of knowledge
3. Summarize and explain complex topics based on stored information
4. Help users recall and build upon their past ideas
5. Suggest related memories and follow-up explorations

Guidelines:
- Always cite specific memories when providing information
- If you can't find relevant information, say so honestly
- Ask clarifying questions when the query is ambiguous
- Provide concise but comprehensive answers
- Highlight unexpected connections or insights
- Be conversational and helpful

When referencing memories, use this format: [Memory: "title or brief content"]"""

    def __init__(self):
        self._gemini_client: Optional[genai.Client] = None
        self._use_gemini = bool(settings.gemini_api_key)
        self._conversations: Dict[UUID, Conversation] = {}

    @property
    def gemini_client(self) -> genai.Client:
        """Get or create Gemini client."""
        if self._gemini_client is None:
            if not settings.gemini_api_key:
                raise ValueError("GEMINI_API_KEY not configured")
            self._gemini_client = genai.Client(api_key=settings.gemini_api_key)
        return self._gemini_client

    async def _call_gemini_with_retry(
        self,
        prompt: str,
        temperature: float = 0.7,
        max_tokens: int = 500,
        use_fallback: bool = True,
    ) -> Optional[str]:
        """Call Gemini API with retry logic and exponential backoff."""
        models_to_try = [self.PRIMARY_MODEL]
        if use_fallback:
            models_to_try.append(self.FALLBACK_MODEL)
        
        last_error = None
        
        for model in models_to_try:
            for attempt in range(self.MAX_RETRIES):
                try:
                    response = self.gemini_client.models.generate_content(
                        model=model,
                        contents=prompt,
                        config=types.GenerateContentConfig(
                            temperature=temperature,
                            max_output_tokens=max_tokens,
                        ),
                    )
                    return response.text
                    
                except Exception as e:
                    last_error = e
                    error_str = str(e).lower()
                    
                    # Check for rate limit errors
                    if "429" in str(e) or "resource_exhausted" in error_str or "quota" in error_str:
                        # Extract retry delay from error message if present
                        retry_delay = self.BASE_RETRY_DELAY * (2 ** attempt)
                        
                        # Try to parse the suggested delay from error message
                        if "retry" in error_str:
                            import re
                            match = re.search(r'(\d+\.?\d*)\s*s', error_str)
                            if match:
                                suggested_delay = float(match.group(1))
                                retry_delay = max(retry_delay, suggested_delay + 1)
                        
                        logger.warning(
                            f"Rate limit hit for {model} (attempt {attempt + 1}/{self.MAX_RETRIES}). "
                            f"Retrying in {retry_delay:.1f}s..."
                        )
                        
                        if attempt < self.MAX_RETRIES - 1:
                            await asyncio.sleep(retry_delay)
                            continue
                        else:
                            logger.warning(f"Max retries exceeded for {model}, trying fallback...")
                            break  # Try next model
                    else:
                        # Non-rate-limit error, don't retry
                        logger.error(f"Gemini API error (not rate limit): {e}")
                        raise
        
        # All models and retries exhausted
        logger.error(f"All Gemini API calls failed. Last error: {last_error}")
        return None

    def create_conversation(self, user_id: Optional[str] = None) -> Conversation:
        """Create a new conversation session."""
        conversation = Conversation(user_id=user_id)
        self._conversations[conversation.id] = conversation
        return conversation

    def get_conversation(self, conversation_id: UUID) -> Optional[Conversation]:
        """Get an existing conversation."""
        return self._conversations.get(conversation_id)

    async def chat(
        self,
        message: str,
        conversation_id: Optional[UUID] = None,
        user_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Process a user message and generate a response.
        
        Steps:
        1. Analyze the query to understand intent
        2. Search memories for relevant context
        3. Generate response using retrieved context
        4. Update conversation history
        """
        # Get or create conversation
        if conversation_id and conversation_id in self._conversations:
            conversation = self._conversations[conversation_id]
        else:
            conversation = self.create_conversation(user_id)
        
        # Add user message
        user_msg = ConversationMessage(role="user", content=message)
        conversation.add_message(user_msg)
        
        if not self._use_gemini:
            return self._fallback_response(message, conversation)
        
        try:
            # Step 1: Analyze query intent
            intent = await self._analyze_intent(message)
            
            # Step 2: Search for relevant memories
            search_queries = await self._generate_search_queries(message, intent)
            relevant_memories = await self._search_memories(search_queries)
            
            # Step 3: Generate response
            response = await self._generate_response(
                message,
                relevant_memories,
                conversation.get_history(last_n=6),
                intent,
            )
            
            # Step 4: Create assistant message
            memory_refs = [UUID(m["id"]) for m in relevant_memories if "id" in m]
            assistant_msg = ConversationMessage(
                role="assistant",
                content=response["content"],
                memory_refs=memory_refs,
                metadata={
                    "intent": intent,
                    "memory_count": len(relevant_memories),
                },
            )
            conversation.add_message(assistant_msg)
            
            return {
                "conversation_id": str(conversation.id),
                "message_id": str(assistant_msg.id),
                "content": response["content"],
                "memories_used": [
                    {
                        "id": m.get("id"),
                        "title": m.get("payload", {}).get("title"),
                        "snippet": m.get("payload", {}).get("content", "")[:150],
                    }
                    for m in relevant_memories[:5]
                ],
                "follow_up_questions": response.get("follow_ups", []),
                "confidence": response.get("confidence", 0.8),
            }
            
        except Exception as e:
            logger.error(f"Agent chat failed: {e}")
            return self._fallback_response(message, conversation)

    async def _analyze_intent(self, message: str) -> Dict[str, Any]:
        """Analyze the user's intent."""
        try:
            prompt = f"""Analyze this user query and determine:
1. The type of request (question, search, summary, action, exploration)
2. Key topics or entities mentioned
3. Time scope if any (today, this week, last month, etc.)
4. Whether it requires memory search

Query: {message}

Return a JSON object:
{{
    "type": "question|search|summary|action|exploration",
    "topics": ["topic1", "topic2"],
    "time_scope": "recent|all|specific",
    "needs_search": true,
    "specificity": "high|medium|low"
}}"""

            response_text = await self._call_gemini_with_retry(
                prompt=prompt,
                temperature=0.3,
                max_tokens=200,
            )
            
            if response_text:
                return json.loads(
                    response_text.strip().replace("```json", "").replace("```", "")
                )
            
        except Exception as e:
            logger.error(f"Intent analysis failed: {e}")
            return {
                "type": "question",
                "topics": [],
                "time_scope": "all",
                "needs_search": True,
                "specificity": "medium",
            }

    async def _generate_search_queries(
        self,
        message: str,
        intent: Dict[str, Any],
    ) -> List[str]:
        """Generate optimized search queries for memory retrieval."""
        queries = [message]  # Always include original
        
        # Add topic-based queries
        for topic in intent.get("topics", [])[:3]:
            queries.append(topic)
        
        # Generate semantic variations
        if self._use_gemini:
            try:
                prompt = f"""Generate 2 alternative search queries to find relevant memories for:
"{message}"

Return a JSON array of strings: ["query1", "query2"]"""

                response_text = await self._call_gemini_with_retry(
                    prompt=prompt,
                    temperature=0.5,
                    max_tokens=100,
                )
                
                if response_text:
                    variations = json.loads(
                        response_text.strip().replace("```json", "").replace("```", "")
                    )
                    queries.extend(variations)
                
            except Exception as e:
                logger.warning(f"Query expansion failed: {e}")
        
        return queries[:5]

    async def _search_memories(
        self,
        queries: List[str],
        limit_per_query: int = 5,
    ) -> List[Dict[str, Any]]:
        """Search memories using multiple queries and deduplicate."""
        all_memories = {}  # id -> memory
        
        for query in queries:
            try:
                search_query = SearchQuery(
                    query=query,
                    limit=limit_per_query,
                    mode=SearchMode.HYBRID,
                    rerank=True,
                )
                results = await search_service.search(search_query)
                
                for result in results.results:
                    mem_id = str(result.memory.id)
                    if mem_id not in all_memories:
                        all_memories[mem_id] = {
                            "id": mem_id,
                            "payload": {
                                "title": result.memory.title,
                                "content": result.memory.content,
                                "memory_type": result.memory.memory_type.value,
                            },
                            "score": result.score,
                        }
                    else:
                        # Boost score for memories found by multiple queries
                        all_memories[mem_id]["score"] += result.score * 0.5
                        
            except Exception as e:
                logger.error(f"Search failed for query '{query}': {e}")
        
        # Sort by score
        sorted_memories = sorted(
            all_memories.values(),
            key=lambda x: x["score"],
            reverse=True,
        )
        
        return sorted_memories[:15]

    async def _generate_response(
        self,
        message: str,
        memories: List[Dict[str, Any]],
        conversation_history: List[Dict[str, str]],
        intent: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Generate a response using retrieved memories."""
        try:
            # Format memories for context
            memory_context = ""
            for i, mem in enumerate(memories[:10], 1):
                payload = mem.get("payload", {})
                memory_context += f"""
Memory {i}: "{payload.get('title', 'Untitled')}"
Type: {payload.get('memory_type', 'note')}
Content: {payload.get('content', '')[:500]}
---"""

            # Format conversation history
            history_text = ""
            for msg in conversation_history[-4:]:
                history_text += f"\n{msg['role'].capitalize()}: {msg['content']}"

            prompt = f"""{self.SYSTEM_PROMPT}

CONVERSATION HISTORY:
{history_text}

RELEVANT MEMORIES:
{memory_context if memory_context else "No directly relevant memories found."}

USER MESSAGE: {message}

Based on the memories above (if relevant), provide a helpful response. If the memories don't contain relevant information, say so and offer to help in other ways.

After your response, suggest 2-3 follow-up questions the user might want to explore.

Format your response as JSON:
{{
    "content": "Your response here",
    "follow_ups": ["Question 1?", "Question 2?"],
    "confidence": 0.8,
    "memory_relevance": "high|medium|low|none"
}}"""

            response_text = await self._call_gemini_with_retry(
                prompt=prompt,
                temperature=0.7,
                max_tokens=1000,
            )
            
            if response_text:
                return json.loads(
                    response_text.strip().replace("```json", "").replace("```", "")
                )
            else:
                # Rate limit exhausted, provide helpful message
                return {
                    "content": "I'm currently experiencing high demand and need a moment to recover. Your question has been noted - please try again in about 30 seconds. In the meantime, you can use the search feature to find memories directly.",
                    "follow_ups": ["Try your question again", "Search memories directly"],
                    "confidence": 0.3,
                    "rate_limited": True,
                }
            
        except Exception as e:
            error_str = str(e).lower()
            logger.error(f"Response generation failed: {e}")
            
            # Provide specific error message for rate limits
            if "429" in str(e) or "resource_exhausted" in error_str or "quota" in error_str:
                return {
                    "content": "🔄 **Rate Limit Reached**\n\nI'm currently experiencing high demand on my AI services. Please wait about 30 seconds and try again.\n\n**While you wait, you can:**\n- Use the Search feature to find memories directly\n- Browse your memories in the library\n- Create new notes or ideas",
                    "follow_ups": ["Try again in 30 seconds"],
                    "confidence": 0.0,
                    "rate_limited": True,
                }
            
            return {
                "content": "I encountered an issue while processing your request. Could you try rephrasing your question?",
                "follow_ups": [],
                "confidence": 0.5,
            }

    def _fallback_response(
        self,
        message: str,
        conversation: Conversation,
    ) -> Dict[str, Any]:
        """Fallback response when AI is not available."""
        fallback_msg = ConversationMessage(
            role="assistant",
            content="I'm currently operating in limited mode. Please try again later or use the search feature to find memories directly.",
        )
        conversation.add_message(fallback_msg)
        
        return {
            "conversation_id": str(conversation.id),
            "message_id": str(fallback_msg.id),
            "content": fallback_msg.content,
            "memories_used": [],
            "follow_up_questions": [],
            "confidence": 0.3,
        }

    async def suggest_questions(
        self,
        context: Optional[str] = None,
    ) -> List[str]:
        """Suggest questions the user might want to ask."""
        if not self._use_gemini:
            return [
                "What did I learn this week?",
                "Find connections in my notes",
                "Summarize my recent ideas",
            ]
        
        try:
            prompt = """Suggest 5 interesting questions a user might ask their personal knowledge base.
Make them specific and actionable, covering:
- Reflection and learning
- Finding connections
- Summarizing knowledge
- Identifying patterns
- Planning and action

Return a JSON array: ["question1", "question2", ...]"""

            response_text = await self._call_gemini_with_retry(
                prompt=prompt,
                temperature=0.8,
                max_tokens=200,
            )
            
            if response_text:
                return json.loads(
                    response_text.strip().replace("```json", "").replace("```", "")
                )
            else:
                # Rate limited, return defaults
                return [
                    "What are my key insights from this month?",
                    "Find patterns in my notes",
                    "What should I focus on next?",
                ]
            
        except Exception as e:
            logger.error(f"Question suggestion failed: {e}")
            return [
                "What are my key insights from this month?",
                "Find patterns in my notes",
                "What should I focus on next?",
            ]

    async def generate_memory_summary(
        self,
        memory_ids: List[UUID],
    ) -> str:
        """Generate a summary of multiple memories."""
        from app.db.qdrant import qdrant_service
        
        # Fetch memories
        contents = []
        for mid in memory_ids[:10]:
            memory = await qdrant_service.get_memory(mid)
            if memory:
                payload = memory.get("payload", {})
                contents.append({
                    "title": payload.get("title"),
                    "content": payload.get("content", "")[:300],
                })
        
        if not contents:
            return "No memories found to summarize."
        
        if not self._use_gemini:
            return f"Summary of {len(contents)} memories. Enable AI for detailed summaries."
        
        try:
            prompt = f"""Summarize these related memories into a coherent overview:

{json.dumps(contents, indent=2)}

Provide a 2-3 paragraph summary that:
1. Identifies the main themes
2. Highlights key insights
3. Notes any patterns or connections"""

            response = self.gemini_client.models.generate_content(
                model="gemini-2.0-flash-exp",
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=0.6,
                    max_output_tokens=500,
                ),
            )
            
            return response.text.strip()
            
        except Exception as e:
            logger.error(f"Summary generation failed: {e}")
            return f"Generated summary for {len(contents)} memories."


# Global service instance
memory_agent = MemoryAgent()
