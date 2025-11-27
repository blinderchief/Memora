"""Embedding service for generating dense and sparse vectors."""

import logging
import re
from collections import Counter
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
from google import genai
from google.genai import types

from app.config import settings

logger = logging.getLogger(__name__)


class EmbeddingService:
    """Service for generating embeddings using Gemini or local models."""

    def __init__(self):
        """Initialize the embedding service."""
        self._gemini_client: Optional[genai.Client] = None
        self._local_model = None
        self._use_gemini = bool(settings.gemini_api_key)
        
        # BM25 parameters for sparse vectors
        self._k1 = 1.5
        self._b = 0.75
        self._avg_doc_length = 500  # Will be updated dynamically
        
    @property
    def gemini_client(self) -> genai.Client:
        """Get or create Gemini client."""
        if self._gemini_client is None:
            if not settings.gemini_api_key:
                raise ValueError("GEMINI_API_KEY not configured")
            self._gemini_client = genai.Client(api_key=settings.gemini_api_key)
            logger.info("Initialized Gemini client")
        return self._gemini_client

    async def initialize(self) -> None:
        """Initialize the embedding service."""
        if self._use_gemini:
            try:
                # Test the connection
                _ = self.gemini_client
                logger.info("Gemini embedding service ready")
            except Exception as e:
                logger.warning(f"Gemini not available, falling back to local: {e}")
                self._use_gemini = False
                await self._init_local_model()
        else:
            await self._init_local_model()

    async def _init_local_model(self) -> None:
        """Initialize local sentence-transformers model."""
        try:
            from sentence_transformers import SentenceTransformer
            
            model_name = settings.embedding_model
            logger.info(f"Loading local model: {model_name}")
            self._local_model = SentenceTransformer(model_name)
            logger.info(f"Local embedding model loaded: {model_name}")
        except Exception as e:
            logger.error(f"Failed to load local model: {e}")
            raise

    async def embed_text(self, text: str) -> List[float]:
        """
        Generate dense embedding for a single text.
        
        Args:
            text: Text to embed
            
        Returns:
            Dense embedding vector
        """
        if not text or not text.strip():
            return [0.0] * settings.embedding_dimension
            
        if self._use_gemini:
            return await self._embed_with_gemini(text)
        else:
            return await self._embed_with_local(text)

    async def embed_batch(self, texts: List[str]) -> List[List[float]]:
        """
        Generate dense embeddings for multiple texts.
        
        Args:
            texts: List of texts to embed
            
        Returns:
            List of dense embedding vectors
        """
        if not texts:
            return []
            
        # Filter empty texts and track indices
        valid_texts = []
        valid_indices = []
        for i, text in enumerate(texts):
            if text and text.strip():
                valid_texts.append(text)
                valid_indices.append(i)
        
        if not valid_texts:
            return [[0.0] * settings.embedding_dimension for _ in texts]
        
        if self._use_gemini:
            valid_embeddings = await self._embed_batch_with_gemini(valid_texts)
        else:
            valid_embeddings = await self._embed_batch_with_local(valid_texts)
        
        # Reconstruct full list with zeros for empty texts
        result = [[0.0] * settings.embedding_dimension for _ in texts]
        for idx, embedding in zip(valid_indices, valid_embeddings):
            result[idx] = embedding
            
        return result

    async def _embed_with_gemini(self, text: str) -> List[float]:
        """Embed text using Gemini API."""
        try:
            result = self.gemini_client.models.embed_content(
                model="models/text-embedding-004",
                contents=text,
                config=types.EmbedContentConfig(
                    task_type="RETRIEVAL_DOCUMENT",
                    output_dimensionality=settings.embedding_dimension,
                ),
            )
            return list(result.embeddings[0].values)
        except Exception as e:
            logger.error(f"Gemini embedding failed: {e}")
            # Fall back to local
            return await self._embed_with_local(text)

    async def _embed_batch_with_gemini(self, texts: List[str]) -> List[List[float]]:
        """Embed batch of texts using Gemini API."""
        import asyncio

        try:
            results = []
            # Gemini API supports batching - send multiple texts at once
            batch_size = 100  # Gemini batch limit

            for i in range(0, len(texts), batch_size):
                batch = texts[i:i + batch_size]

                # Use batch_embed_contents for true batching
                try:
                    # Try batch embedding first (more efficient)
                    batch_results = self.gemini_client.models.batch_embed_contents(
                        model="models/text-embedding-004",
                        requests=[
                            types.EmbedContentRequest(
                                content=text,
                                task_type="RETRIEVAL_DOCUMENT",
                                output_dimensionality=settings.embedding_dimension,
                            )
                            for text in batch
                        ],
                    )
                    for emb in batch_results.embeddings:
                        results.append(list(emb.values))
                except Exception as batch_error:
                    # Fallback to concurrent individual requests
                    logger.warning(
                        f"Batch embed failed, using concurrent requests: {batch_error}")

                    async def embed_single(text: str) -> List[float]:
                        result = self.gemini_client.models.embed_content(
                            model="models/text-embedding-004",
                            contents=text,
                            config=types.EmbedContentConfig(
                                task_type="RETRIEVAL_DOCUMENT",
                                output_dimensionality=settings.embedding_dimension,
                            ),
                        )
                        return list(result.embeddings[0].values)

                    # Run concurrently with semaphore to avoid rate limits
                    # Max 10 concurrent requests
                    semaphore = asyncio.Semaphore(10)

                    async def embed_with_limit(text: str) -> List[float]:
                        async with semaphore:
                            return await embed_single(text)

                    batch_embeddings = await asyncio.gather(*[embed_with_limit(t) for t in batch])
                    results.extend(batch_embeddings)

            return results
        except Exception as e:
            logger.error(f"Gemini batch embedding failed: {e}")
            return await self._embed_batch_with_local(texts)

    async def _embed_with_local(self, text: str) -> List[float]:
        """Embed text using local model."""
        if self._local_model is None:
            await self._init_local_model()
        
        # Add E5 prefix for better performance
        prefixed_text = f"passage: {text}"
        embedding = self._local_model.encode(prefixed_text, normalize_embeddings=True)
        return embedding.tolist()

    async def _embed_batch_with_local(self, texts: List[str]) -> List[List[float]]:
        """Embed batch of texts using local model."""
        if self._local_model is None:
            await self._init_local_model()
        
        # Add E5 prefix for better performance
        prefixed_texts = [f"passage: {text}" for text in texts]
        embeddings = self._local_model.encode(prefixed_texts, normalize_embeddings=True)
        return embeddings.tolist()

    async def embed_query(self, query: str) -> List[float]:
        """
        Generate embedding optimized for query/search.
        
        Args:
            query: Query text
            
        Returns:
            Dense embedding vector
        """
        if not query or not query.strip():
            return [0.0] * settings.embedding_dimension
            
        if self._use_gemini:
            try:
                result = self.gemini_client.models.embed_content(
                    model="models/text-embedding-004",
                    contents=query,
                    config=types.EmbedContentConfig(
                        task_type="RETRIEVAL_QUERY",
                        output_dimensionality=settings.embedding_dimension,
                    ),
                )
                return list(result.embeddings[0].values)
            except Exception as e:
                logger.error(f"Gemini query embedding failed: {e}")
        
        # Local model fallback
        if self._local_model is None:
            await self._init_local_model()
        
        # E5 uses "query:" prefix for queries
        prefixed_query = f"query: {query}"
        embedding = self._local_model.encode(prefixed_query, normalize_embeddings=True)
        return embedding.tolist()

    def generate_sparse_vector(self, text: str) -> Dict[str, Any]:
        """
        Generate sparse vector for BM25-style matching.
        
        Args:
            text: Text to process
            
        Returns:
            Dict with 'indices' and 'values' for sparse vector
        """
        if not text or not text.strip():
            return {"indices": [], "values": []}
        
        # Tokenize
        tokens = self._tokenize(text)
        if not tokens:
            return {"indices": [], "values": []}
        
        # Count term frequencies
        tf = Counter(tokens)
        doc_length = len(tokens)
        
        # Calculate BM25-style weights - use dict to handle hash collisions
        index_values: Dict[int, float] = {}
        
        for term, freq in tf.items():
            # Simple hash to index (in practice, use vocabulary)
            term_idx = abs(hash(term) % 30000)  # Sparse vector dimension
            
            # BM25 term frequency component
            tf_component = (freq * (self._k1 + 1)) / (
                freq + self._k1 * (1 - self._b + self._b * doc_length / self._avg_doc_length)
            )
            
            # Aggregate values for same index (handle hash collisions)
            if term_idx in index_values:
                index_values[term_idx] += float(tf_component)
            else:
                index_values[term_idx] = float(tf_component)

        # Convert to sorted lists (Qdrant prefers sorted indices)
        sorted_items = sorted(index_values.items())
        indices = [idx for idx, _ in sorted_items]
        values = [val for _, val in sorted_items]
        
        return {"indices": indices, "values": values}

    def _tokenize(self, text: str) -> List[str]:
        """Simple tokenization for sparse vectors."""
        # Lowercase and extract words
        text = text.lower()
        tokens = re.findall(r'\b[a-z]+\b', text)
        
        # Remove common stopwords
        stopwords = {
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
            'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during',
            'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
            'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might',
            'this', 'that', 'these', 'those', 'it', 'its', 'as', 'if', 'then',
        }
        
        return [t for t in tokens if t not in stopwords and len(t) > 2]

    def compute_similarity(
        self, 
        vec1: List[float], 
        vec2: List[float]
    ) -> float:
        """Compute cosine similarity between two vectors."""
        v1 = np.array(vec1)
        v2 = np.array(vec2)
        
        dot_product = np.dot(v1, v2)
        norm1 = np.linalg.norm(v1)
        norm2 = np.linalg.norm(v2)
        
        if norm1 == 0 or norm2 == 0:
            return 0.0
            
        return float(dot_product / (norm1 * norm2))


# Global service instance
embedding_service = EmbeddingService()
