"""Lamatic.ai orchestration service for social prompting engine."""

import hashlib
import logging
import time
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
from uuid import uuid4

import httpx
from google import genai
from google.genai import types

from app.config import settings
from app.models.social import (
    LamaticFlowRequest,
    LamaticFlowResponse,
    NetworkSpark,
    SocialSignal,
    PrivacyLevel,
)

logger = logging.getLogger(__name__)


class LamaticService:
    """Service for orchestrating social prompting flows via Lamatic.ai."""

    # Lamatic API endpoints
    LAMATIC_API_BASE = "https://api.lamatic.ai/v1"
    FLOW_TRIGGER_ENDPOINT = "/flows/trigger"
    FLOW_STATUS_ENDPOINT = "/flows/status"

    # Flow IDs (created in Lamatic dashboard)
    SOCIAL_INSPIRE_FLOW_ID = "social-inspire-flow"
    
    def __init__(self):
        """Initialize Lamatic service."""
        self._api_key = settings.lamatic_api_key
        self._http_client: Optional[httpx.AsyncClient] = None
        self._gemini_client: Optional[genai.Client] = None

    @property
    def http_client(self) -> httpx.AsyncClient:
        """Get or create HTTP client."""
        if self._http_client is None:
            self._http_client = httpx.AsyncClient(
                base_url=self.LAMATIC_API_BASE,
                headers={
                    "Authorization": f"Bearer {self._api_key}",
                    "Content-Type": "application/json",
                },
                timeout=30.0,
            )
        return self._http_client

    @property
    def gemini_client(self) -> genai.Client:
        """Get or create Gemini client for summarization."""
        if self._gemini_client is None:
            if not settings.gemini_api_key:
                raise ValueError("GEMINI_API_KEY not configured")
            self._gemini_client = genai.Client(api_key=settings.gemini_api_key)
        return self._gemini_client

    async def trigger_flow(
        self,
        flow_request: LamaticFlowRequest,
        signals: List[SocialSignal],
    ) -> LamaticFlowResponse:
        """
        Trigger Lamatic flow for processing social signals.
        
        Flow steps:
        1. Filter signals by relevance
        2. Anonymize authors
        3. Generate embeddings
        4. Match against user's Qdrant memories
        5. Generate PKM prompts
        6. Return NetworkSparks
        
        Args:
            flow_request: Configuration for the flow
            signals: Raw social signals to process
            
        Returns:
            LamaticFlowResponse with generated sparks
        """
        start_time = time.time()
        
        try:
            # Prepare flow payload
            payload = {
                "flow_id": self.SOCIAL_INSPIRE_FLOW_ID,
                "execution_id": str(uuid4()),
                "inputs": {
                    "user_id": flow_request.user_id,
                    "signals": [s.model_dump(mode="json") for s in signals],
                    "config": {
                        "max_signals": flow_request.max_signals,
                        "relevance_threshold": flow_request.relevance_threshold,
                        "privacy_level": flow_request.privacy_level,
                        "include_topics": flow_request.include_topics,
                        "exclude_topics": flow_request.exclude_topics,
                    },
                },
            }

            # For demo/development: process locally if Lamatic not configured
            if not self._api_key or self._api_key == "demo":
                logger.info("Running local flow processing (Lamatic not configured)")
                return await self._process_flow_locally(flow_request, signals)

            # Trigger remote Lamatic flow
            response = await self.http_client.post(
                self.FLOW_TRIGGER_ENDPOINT,
                json=payload,
            )
            response.raise_for_status()
            
            result = response.json()
            
            # Parse sparks from response
            sparks = [
                NetworkSpark(**spark_data)
                for spark_data in result.get("outputs", {}).get("sparks", [])
            ]
            
            processing_time = int((time.time() - start_time) * 1000)
            
            return LamaticFlowResponse(
                flow_id=self.SOCIAL_INSPIRE_FLOW_ID,
                execution_id=result.get("execution_id", str(uuid4())),
                status=result.get("status", "success"),
                sparks_generated=len(sparks),
                sparks=sparks,
                processing_time_ms=processing_time,
                errors=result.get("errors", []),
            )

        except httpx.HTTPError as e:
            logger.error(f"Lamatic API error: {e}")
            # Fallback to local processing
            return await self._process_flow_locally(flow_request, signals)
        except Exception as e:
            logger.error(f"Flow trigger failed: {e}")
            raise

    async def _process_flow_locally(
        self,
        flow_request: LamaticFlowRequest,
        signals: List[SocialSignal],
    ) -> LamaticFlowResponse:
        """
        Local implementation of the Lamatic flow for development/demo.
        Mimics: Filter → Anonymize → Embed → Match → Generate → Return
        """
        start_time = time.time()
        sparks: List[NetworkSpark] = []
        errors: List[str] = []

        try:
            # Step 1: Filter by topic relevance (basic keyword matching)
            filtered_signals = self._filter_signals(signals, flow_request)
            logger.info(f"Filtered {len(filtered_signals)}/{len(signals)} signals")

            # Step 2: Process each signal
            for signal in filtered_signals[:flow_request.max_signals]:
                try:
                    # Step 3: Anonymize author
                    anonymized_author = self._anonymize_author(
                        signal.author_handle,
                        signal.platform,
                    )

                    # Step 4: Distill content (summarize if needed)
                    distilled_content = await self._distill_content(signal.content)

                    # Step 5: Extract topics
                    topics = self._extract_topics(distilled_content, flow_request)

                    # Step 6: Calculate relevance score
                    relevance = self._calculate_relevance(
                        signal,
                        flow_request.include_topics,
                    )

                    if relevance < flow_request.relevance_threshold:
                        continue

                    # Step 7: Generate PKM prompt
                    prompt = await self._generate_pkm_prompt(distilled_content, topics)

                    # Step 8: Create NetworkSpark
                    spark = NetworkSpark(
                        content=distilled_content,
                        original_excerpt=signal.content[:280],
                        source=anonymized_author,
                        platform=signal.platform,
                        relevance_score=relevance,
                        topic_tags=topics,
                        generated_prompt=prompt,
                        privacy_level=flow_request.privacy_level,
                        embedding_metadata={
                            "posted_at": signal.posted_at.isoformat(),
                            "engagement_score": signal.engagement_score,
                        },
                    )
                    sparks.append(spark)

                except Exception as e:
                    logger.warning(f"Failed to process signal: {e}")
                    errors.append(str(e))

            # Sort by relevance
            sparks.sort(key=lambda s: s.relevance_score, reverse=True)

            processing_time = int((time.time() - start_time) * 1000)

            return LamaticFlowResponse(
                flow_id=self.SOCIAL_INSPIRE_FLOW_ID,
                execution_id=str(uuid4()),
                status="success" if sparks else "partial",
                sparks_generated=len(sparks),
                sparks=sparks,
                processing_time_ms=processing_time,
                errors=errors,
            )

        except Exception as e:
            logger.error(f"Local flow processing failed: {e}")
            return LamaticFlowResponse(
                flow_id=self.SOCIAL_INSPIRE_FLOW_ID,
                execution_id=str(uuid4()),
                status="failed",
                sparks_generated=0,
                sparks=[],
                processing_time_ms=int((time.time() - start_time) * 1000),
                errors=[str(e)],
            )

    def _filter_signals(
        self,
        signals: List[SocialSignal],
        flow_request: LamaticFlowRequest,
    ) -> List[SocialSignal]:
        """Filter signals by time window and topic relevance."""
        cutoff_time = datetime.utcnow() - timedelta(hours=flow_request.time_window_hours)
        
        filtered = []
        for signal in signals:
            # Time filter
            if signal.posted_at < cutoff_time:
                continue
                
            # Exclude topics
            content_lower = signal.content.lower()
            if any(topic.lower() in content_lower for topic in flow_request.exclude_topics):
                continue
                
            filtered.append(signal)
        
        return filtered

    def _anonymize_author(self, handle: str, platform) -> Any:
        """Anonymize author handle using hash."""
        from app.models.social import AnonymizedAuthor
        
        # Create stable hash
        hash_input = f"{platform}:{handle}".encode("utf-8")
        anonymized_id = hashlib.sha256(hash_input).hexdigest()[:16]
        
        # Generate friendly label
        label_num = int(anonymized_id[:8], 16) % 1000
        display_label = f"Network Node #{label_num}"
        
        return AnonymizedAuthor(
            anonymized_id=anonymized_id,
            display_label=display_label,
            platform=platform,
            trust_score=0.7,  # Could be enhanced with connection strength
        )

    async def _distill_content(self, content: str) -> str:
        """Distill/summarize content if too long."""
        if len(content) <= 500:
            return content
        
        try:
            # Use Gemini to summarize
            prompt = f"""Distill this social post into a concise, insight-focused summary (max 300 chars):

{content}

Summary:"""
            
            response = self.gemini_client.models.generate_content(
                model="gemini-2.0-flash",
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=0.3,
                    max_output_tokens=100,
                ),
            )
            return response.text.strip()
        except Exception as e:
            logger.warning(f"Distillation failed: {e}")
            return content[:500]

    def _extract_topics(self, content: str, flow_request: LamaticFlowRequest) -> List[str]:
        """Extract topic tags from content."""
        topics = []
        content_lower = content.lower()
        
        # Check for included topics
        for topic in flow_request.include_topics:
            if topic.lower() in content_lower:
                topics.append(topic)
        
        # Basic keyword extraction (simplified)
        keywords = ["AI", "machine learning", "productivity", "negotiation", 
                   "leadership", "design", "coding", "startup", "research"]
        for keyword in keywords:
            if keyword.lower() in content_lower and keyword not in topics:
                topics.append(keyword)
        
        return topics[:5]  # Max 5 topics

    def _calculate_relevance(
        self,
        signal: SocialSignal,
        include_topics: List[str],
    ) -> float:
        """Calculate relevance score (0-1)."""
        score = 0.5  # Base score
        
        # Boost for topic matches
        content_lower = signal.content.lower()
        matches = sum(1 for topic in include_topics if topic.lower() in content_lower)
        score += min(matches * 0.1, 0.3)
        
        # Boost for engagement
        if signal.engagement_score > 100:
            score += 0.1
        elif signal.engagement_score > 1000:
            score += 0.2
        
        return min(score, 1.0)

    async def _generate_pkm_prompt(self, content: str, topics: List[str]) -> str:
        """Generate a PKM (Personal Knowledge Management) prompt."""
        try:
            topics_str = ", ".join(topics) if topics else "general insights"
            
            prompt = f"""Based on this network insight about {topics_str}:

"{content}"

Generate a thought-provoking PKM prompt that encourages personal reflection and knowledge building (1 sentence):"""

            response = self.gemini_client.models.generate_content(
                model="gemini-2.0-flash",
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=0.7,
                    max_output_tokens=100,
                ),
            )
            return response.text.strip()
        except Exception as e:
            logger.warning(f"Prompt generation failed: {e}")
            return f"How might this insight about {topics[0] if topics else 'this topic'} apply to your current projects?"

    async def check_flow_status(self, execution_id: str) -> Dict[str, Any]:
        """Check status of a running flow."""
        try:
            response = await self.http_client.get(
                f"{self.FLOW_STATUS_ENDPOINT}/{execution_id}"
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Status check failed: {e}")
            return {"status": "unknown", "error": str(e)}

    async def close(self):
        """Clean up resources."""
        if self._http_client:
            await self._http_client.aclose()


# Global instance
lamatic_service = LamaticService()
