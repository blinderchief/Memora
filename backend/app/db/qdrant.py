"""Qdrant vector database service for Memora."""

import logging
from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

from qdrant_client import QdrantClient
from qdrant_client.http import models as qmodels
from qdrant_client.http.exceptions import UnexpectedResponse

from app.config import settings

logger = logging.getLogger(__name__)


class QdrantService:
    """Service for interacting with Qdrant vector database."""

    def __init__(self):
        """Initialize Qdrant client."""
        self._client: Optional[QdrantClient] = None
        self._collection_name = settings.qdrant_collection
        self._vector_size = settings.embedding_dimension

    @property
    def client(self) -> QdrantClient:
        """Get or create Qdrant client."""
        if self._client is None:
            if settings.qdrant_api_key:
                self._client = QdrantClient(
                    url=settings.qdrant_url,
                    api_key=settings.qdrant_api_key,
                )
            else:
                self._client = QdrantClient(url=settings.qdrant_url)
            logger.info(f"Connected to Qdrant at {settings.qdrant_url}")
        return self._client

    async def initialize(self) -> None:
        """Initialize Qdrant collection with proper schema."""
        try:
            collections = self.client.get_collections()
            collection_names = [c.name for c in collections.collections]

            if self._collection_name not in collection_names:
                logger.info(f"Creating collection: {self._collection_name}")
                self.client.create_collection(
                    collection_name=self._collection_name,
                    vectors_config={
                        # Dense vector for semantic search
                        "dense": qmodels.VectorParams(
                            size=self._vector_size,
                            distance=qmodels.Distance.COSINE,
                            on_disk=True,
                        ),
                    },
                    # Sparse vector config for BM25-style keyword search
                    sparse_vectors_config={
                        "sparse": qmodels.SparseVectorParams(
                            modifier=qmodels.Modifier.IDF,
                        ),
                    },
                    # Optimizations
                    optimizers_config=qmodels.OptimizersConfigDiff(
                        indexing_threshold=20000,
                        memmap_threshold=50000,
                    ),
                    # HNSW index for fast search
                    hnsw_config=qmodels.HnswConfigDiff(
                        m=16,
                        ef_construct=100,
                        full_scan_threshold=10000,
                    ),
                )

                # Create payload indexes for filtering
                self._create_payload_indexes()
                logger.info(f"Collection {self._collection_name} created successfully")
            else:
                logger.info(f"Collection {self._collection_name} already exists")

        except UnexpectedResponse as e:
            logger.error(f"Failed to initialize Qdrant: {e}")
            raise

    def _create_payload_indexes(self) -> None:
        """Create payload indexes for efficient filtering."""
        indexes = [
            ("memory_type", qmodels.PayloadSchemaType.KEYWORD),
            ("modality", qmodels.PayloadSchemaType.KEYWORD),
            ("author", qmodels.PayloadSchemaType.KEYWORD),
            ("project", qmodels.PayloadSchemaType.KEYWORD),
            ("tags", qmodels.PayloadSchemaType.KEYWORD),
            ("created_at", qmodels.PayloadSchemaType.DATETIME),
            ("updated_at", qmodels.PayloadSchemaType.DATETIME),
        ]

        for field_name, schema_type in indexes:
            try:
                self.client.create_payload_index(
                    collection_name=self._collection_name,
                    field_name=field_name,
                    field_schema=schema_type,
                )
            except Exception as e:
                logger.warning(f"Could not create index for {field_name}: {e}")

    async def upsert_memory(
        self,
        memory_id: UUID,
        dense_vector: List[float],
        sparse_vector: Optional[Dict[str, Any]],
        payload: Dict[str, Any],
    ) -> bool:
        """
        Upsert a memory with its vectors and payload.
        
        Args:
            memory_id: Unique ID for the memory
            dense_vector: Dense embedding vector
            sparse_vector: Sparse vector (indices and values for BM25)
            payload: Memory metadata and content
            
        Returns:
            True if successful
        """
        try:
            vectors = {"dense": dense_vector}
            
            # Add sparse vector if provided
            if sparse_vector:
                vectors["sparse"] = qmodels.SparseVector(
                    indices=sparse_vector["indices"],
                    values=sparse_vector["values"],
                )

            self.client.upsert(
                collection_name=self._collection_name,
                points=[
                    qmodels.PointStruct(
                        id=str(memory_id),
                        vector=vectors,
                        payload=payload,
                    )
                ],
            )
            return True
        except Exception as e:
            logger.error(f"Failed to upsert memory {memory_id}: {e}")
            raise

    async def upsert_memories_batch(
        self,
        memories: List[Dict[str, Any]],
    ) -> int:
        """
        Batch upsert multiple memories at once for better performance.
        
        Args:
            memories: List of dicts with memory_id, dense_vector, sparse_vector, payload
            
        Returns:
            Number of memories successfully upserted
        """
        if not memories:
            return 0

        try:
            points = []
            for mem in memories:
                vectors = {"dense": mem["dense_vector"]}

                # Add sparse vector if provided
                if mem.get("sparse_vector"):
                    sparse = mem["sparse_vector"]
                    if sparse.get("indices") and sparse.get("values"):
                        vectors["sparse"] = qmodels.SparseVector(
                            indices=sparse["indices"],
                            values=sparse["values"],
                        )

                points.append(
                    qmodels.PointStruct(
                        id=str(mem["memory_id"]),
                        vector=vectors,
                        payload=mem["payload"],
                    )
                )

            # Batch upsert all points at once
            self.client.upsert(
                collection_name=self._collection_name,
                points=points,
                wait=True,
            )
            return len(points)
        except Exception as e:
            logger.error(
                f"Failed to batch upsert {len(memories)} memories: {e}")
            raise

    async def hybrid_search(
        self,
        dense_vector: List[float],
        sparse_vector: Optional[Dict[str, Any]] = None,
        limit: int = 10,
        offset: int = 0,
        filters: Optional[qmodels.Filter] = None,
        score_threshold: Optional[float] = None,
    ) -> List[Dict[str, Any]]:
        """
        Perform hybrid search combining dense and sparse vectors.
        
        Args:
            dense_vector: Query dense embedding
            sparse_vector: Query sparse vector (optional)
            limit: Number of results
            offset: Pagination offset
            filters: Qdrant filter conditions
            score_threshold: Minimum score threshold
            
        Returns:
            List of search results with scores
        """
        try:
            # If we have both dense and sparse, use hybrid
            if sparse_vector:
                # Use query with prefetch for hybrid search
                results = self.client.query_points(
                    collection_name=self._collection_name,
                    prefetch=[
                        qmodels.Prefetch(
                            query=dense_vector,
                            using="dense",
                            limit=limit * 2,
                        ),
                        qmodels.Prefetch(
                            query=qmodels.SparseVector(
                                indices=sparse_vector["indices"],
                                values=sparse_vector["values"],
                            ),
                            using="sparse",
                            limit=limit * 2,
                        ),
                    ],
                    query=qmodels.FusionQuery(fusion=qmodels.Fusion.RRF),
                    limit=limit,
                    offset=offset,
                    with_payload=True,
                    query_filter=filters,
                    score_threshold=score_threshold,
                )
            else:
                # Dense-only search
                results = self.client.query_points(
                    collection_name=self._collection_name,
                    query=dense_vector,
                    using="dense",
                    limit=limit,
                    offset=offset,
                    with_payload=True,
                    query_filter=filters,
                    score_threshold=score_threshold,
                )

            return [
                {
                    "id": point.id,
                    "score": point.score,
                    "payload": point.payload,
                }
                for point in results.points
            ]

        except Exception as e:
            logger.error(f"Hybrid search failed: {e}")
            raise

    async def get_memory(self, memory_id: UUID) -> Optional[Dict[str, Any]]:
        """Get a single memory by ID."""
        try:
            results = self.client.retrieve(
                collection_name=self._collection_name,
                ids=[str(memory_id)],
                with_payload=True,
                with_vectors=False,
            )
            if results:
                return {
                    "id": results[0].id,
                    "payload": results[0].payload,
                }
            return None
        except Exception as e:
            logger.error(f"Failed to get memory {memory_id}: {e}")
            raise

    async def delete_memory(self, memory_id: UUID) -> bool:
        """Delete a memory by ID."""
        try:
            self.client.delete(
                collection_name=self._collection_name,
                points_selector=qmodels.PointIdsList(
                    points=[str(memory_id)],
                ),
            )
            return True
        except Exception as e:
            logger.error(f"Failed to delete memory {memory_id}: {e}")
            raise

    async def list_memories(
        self,
        limit: int = 20,
        offset: int = 0,
        filters: Optional[qmodels.Filter] = None,
    ) -> List[Dict[str, Any]]:
        """List memories with optional filtering."""
        try:
            results, _ = self.client.scroll(
                collection_name=self._collection_name,
                limit=limit,
                offset=offset,
                with_payload=True,
                with_vectors=False,
                scroll_filter=filters,
            )
            return [
                {
                    "id": point.id,
                    "payload": point.payload,
                }
                for point in results
            ]
        except Exception as e:
            logger.error(f"Failed to list memories: {e}")
            raise

    async def get_collection_info(self) -> Dict[str, Any]:
        """Get collection statistics and info."""
        try:
            info = self.client.get_collection(self._collection_name)
            # Handle different Qdrant versions - vectors_count may be in different places
            vectors_count = getattr(info, 'vectors_count', None)
            if vectors_count is None and hasattr(info, 'points_count'):
                vectors_count = info.points_count
            
            return {
                "name": self._collection_name,
                "vectors_count": vectors_count or 0,
                "points_count": getattr(info, 'points_count', 0),
                "status": info.status.value if hasattr(info.status, 'value') else str(info.status),
            }
        except Exception as e:
            logger.error(f"Failed to get collection info: {e}")
            raise

    def build_filter(
        self,
        memory_types: Optional[List[str]] = None,
        modalities: Optional[List[str]] = None,
        authors: Optional[List[str]] = None,
        projects: Optional[List[str]] = None,
        tags: Optional[List[str]] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
    ) -> Optional[qmodels.Filter]:
        """Build Qdrant filter from parameters."""
        conditions = []

        if memory_types:
            conditions.append(
                qmodels.FieldCondition(
                    key="memory_type",
                    match=qmodels.MatchAny(any=memory_types),
                )
            )

        if modalities:
            conditions.append(
                qmodels.FieldCondition(
                    key="modality",
                    match=qmodels.MatchAny(any=modalities),
                )
            )

        if authors:
            conditions.append(
                qmodels.FieldCondition(
                    key="author",
                    match=qmodels.MatchAny(any=authors),
                )
            )

        if projects:
            conditions.append(
                qmodels.FieldCondition(
                    key="project",
                    match=qmodels.MatchAny(any=projects),
                )
            )

        if tags:
            conditions.append(
                qmodels.FieldCondition(
                    key="tags",
                    match=qmodels.MatchAny(any=tags),
                )
            )

        if date_from:
            conditions.append(
                qmodels.FieldCondition(
                    key="created_at",
                    range=qmodels.DatetimeRange(gte=date_from),
                )
            )

        if date_to:
            conditions.append(
                qmodels.FieldCondition(
                    key="created_at",
                    range=qmodels.DatetimeRange(lte=date_to),
                )
            )

        if not conditions:
            return None

        return qmodels.Filter(must=conditions)

    async def upsert_network_spark(
        self,
        spark_id: UUID,
        content: str,
        dense_vector: List[float],
        sparse_vector: Optional[Dict[str, Any]],
        metadata: Dict[str, Any],
    ) -> bool:
        """
        Upsert a network spark to Qdrant with privacy-first metadata.
        
        Args:
            spark_id: Unique spark ID
            content: Distilled content (no PII)
            dense_vector: Semantic embedding
            sparse_vector: Keyword vector
            metadata: Privacy-safe metadata
            
        Returns:
            Success status
        """
        try:
            vector_dict = {"dense": dense_vector}
            if sparse_vector:
                vector_dict["sparse"] = qmodels.SparseVector(
                    indices=sparse_vector["indices"],
                    values=sparse_vector["values"],
                )

            point = qmodels.PointStruct(
                id=str(spark_id),
                vector=vector_dict,
                payload={
                    "content": content,
                    "memory_type": "network_spark",
                    "modality": "text",
                    **metadata,
                    "created_at": datetime.utcnow().isoformat(),
                },
            )

            self.client.upsert(
                collection_name=self._collection_name,
                points=[point],
            )

            logger.info(f"Network spark {spark_id} upserted successfully")
            return True

        except Exception as e:
            logger.error(f"Failed to upsert network spark {spark_id}: {e}")
            return False

    async def search_network_sparks(
        self,
        user_id: str,
        dense_vector: List[float],
        limit: int = 20,
        relevance_threshold: float = 0.5,
    ) -> List[Dict[str, Any]]:
        """
        Search for network sparks relevant to user's interests.
        
        Args:
            user_id: User identifier
            dense_vector: Query embedding
            limit: Max results
            relevance_threshold: Minimum relevance score
            
        Returns:
            List of matching sparks
        """
        try:
            # Filter for network sparks
            filters = qmodels.Filter(
                must=[
                    qmodels.FieldCondition(
                        key="memory_type",
                        match=qmodels.MatchValue(value="network_spark"),
                    ),
                ]
            )

            results = await self.hybrid_search(
                dense_vector=dense_vector,
                limit=limit,
                filters=filters,
                score_threshold=relevance_threshold,
            )

            return results

        except Exception as e:
            logger.error(f"Network spark search failed: {e}")
            return []


# Global service instance
qdrant_service = QdrantService()


def get_qdrant_client() -> QdrantClient:
    """Get the Qdrant client instance."""
    return qdrant_service.client
