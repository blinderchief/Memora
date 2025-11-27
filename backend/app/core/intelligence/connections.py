"""Memory Connections Service - Entity extraction, relationship mapping, and knowledge graph."""

import logging
import re
from datetime import datetime
from typing import Any, Dict, List, Optional, Set, Tuple
from uuid import UUID, uuid4
import json

from google import genai
from google.genai import types

from app.config import settings
from app.db.qdrant import qdrant_service
from app.core.embedding import embedding_service

logger = logging.getLogger(__name__)


class EntityType:
    """Types of entities that can be extracted."""
    PERSON = "person"
    ORGANIZATION = "organization"
    PROJECT = "project"
    CONCEPT = "concept"
    LOCATION = "location"
    EVENT = "event"
    SKILL = "skill"
    TOOL = "tool"
    DOCUMENT = "document"


class RelationType:
    """Types of relationships between entities."""
    MENTIONS = "mentions"
    RELATES_TO = "relates_to"
    BELONGS_TO = "belongs_to"
    CREATED_BY = "created_by"
    WORKS_WITH = "works_with"
    DEPENDS_ON = "depends_on"
    FOLLOWS = "follows"
    CONTRADICTS = "contradicts"
    SUPPORTS = "supports"
    EVOLVED_FROM = "evolved_from"


class Entity:
    """Represents an extracted entity."""
    
    def __init__(
        self,
        name: str,
        entity_type: str,
        aliases: Optional[List[str]] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ):
        self.id = uuid4()
        self.name = name
        self.entity_type = entity_type
        self.aliases = aliases or []
        self.metadata = metadata or {}
        self.mention_count = 1
        self.memory_ids: Set[UUID] = set()
        self.first_seen = datetime.utcnow()
        self.last_seen = datetime.utcnow()

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": str(self.id),
            "name": self.name,
            "entity_type": self.entity_type,
            "aliases": self.aliases,
            "metadata": self.metadata,
            "mention_count": self.mention_count,
            "memory_ids": [str(mid) for mid in self.memory_ids],
            "first_seen": self.first_seen.isoformat(),
            "last_seen": self.last_seen.isoformat(),
        }


class Relationship:
    """Represents a relationship between entities."""
    
    def __init__(
        self,
        source_entity: Entity,
        target_entity: Entity,
        relation_type: str,
        strength: float = 1.0,
        context: Optional[str] = None,
    ):
        self.id = uuid4()
        self.source = source_entity
        self.target = target_entity
        self.relation_type = relation_type
        self.strength = strength
        self.context = context
        self.memory_ids: Set[UUID] = set()
        self.created_at = datetime.utcnow()

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": str(self.id),
            "source": self.source.to_dict(),
            "target": self.target.to_dict(),
            "relation_type": self.relation_type,
            "strength": self.strength,
            "context": self.context,
            "memory_ids": [str(mid) for mid in self.memory_ids],
            "created_at": self.created_at.isoformat(),
        }


class KnowledgeGraph:
    """In-memory knowledge graph for memory connections."""
    
    def __init__(self):
        self.entities: Dict[str, Entity] = {}  # name -> Entity
        self.relationships: List[Relationship] = []
        self.entity_embeddings: Dict[str, List[float]] = {}  # entity_id -> embedding

    def add_entity(self, entity: Entity) -> Entity:
        """Add or merge an entity into the graph."""
        key = entity.name.lower()
        
        # Check for existing entity
        if key in self.entities:
            existing = self.entities[key]
            existing.mention_count += 1
            existing.memory_ids.update(entity.memory_ids)
            existing.last_seen = datetime.utcnow()
            return existing
        
        # Check aliases
        for alias in entity.aliases:
            if alias.lower() in self.entities:
                existing = self.entities[alias.lower()]
                existing.mention_count += 1
                existing.memory_ids.update(entity.memory_ids)
                existing.last_seen = datetime.utcnow()
                if key not in existing.aliases:
                    existing.aliases.append(entity.name)
                return existing
        
        self.entities[key] = entity
        return entity

    def add_relationship(self, relationship: Relationship):
        """Add a relationship to the graph."""
        # Check for existing relationship
        for existing in self.relationships:
            if (existing.source.name.lower() == relationship.source.name.lower() and
                existing.target.name.lower() == relationship.target.name.lower() and
                existing.relation_type == relationship.relation_type):
                existing.strength = min(1.0, existing.strength + 0.1)
                existing.memory_ids.update(relationship.memory_ids)
                return
        
        self.relationships.append(relationship)

    def get_entity(self, name: str) -> Optional[Entity]:
        """Get an entity by name or alias."""
        key = name.lower()
        if key in self.entities:
            return self.entities[key]
        
        # Check aliases
        for entity in self.entities.values():
            if key in [a.lower() for a in entity.aliases]:
                return entity
        
        return None

    def get_related_entities(
        self,
        entity_name: str,
        max_depth: int = 2,
    ) -> List[Tuple[Entity, str, int]]:
        """Get entities related to a given entity up to max_depth."""
        entity = self.get_entity(entity_name)
        if not entity:
            return []
        
        related = []
        visited = {entity.name.lower()}
        queue = [(entity, 0)]
        
        while queue:
            current, depth = queue.pop(0)
            if depth >= max_depth:
                continue
            
            for rel in self.relationships:
                if rel.source.name.lower() == current.name.lower():
                    target_key = rel.target.name.lower()
                    if target_key not in visited:
                        visited.add(target_key)
                        related.append((rel.target, rel.relation_type, depth + 1))
                        queue.append((rel.target, depth + 1))
                        
                elif rel.target.name.lower() == current.name.lower():
                    source_key = rel.source.name.lower()
                    if source_key not in visited:
                        visited.add(source_key)
                        related.append((rel.source, rel.relation_type, depth + 1))
                        queue.append((rel.source, depth + 1))
        
        return related

    def to_dict(self) -> Dict[str, Any]:
        """Export graph to dictionary."""
        return {
            "entities": [e.to_dict() for e in self.entities.values()],
            "relationships": [r.to_dict() for r in self.relationships],
            "stats": {
                "entity_count": len(self.entities),
                "relationship_count": len(self.relationships),
            },
        }


class ConnectionsService:
    """Service for extracting entities and building knowledge graph."""

    def __init__(self):
        self._gemini_client: Optional[genai.Client] = None
        self._use_gemini = bool(settings.gemini_api_key)
        self._graph = KnowledgeGraph()

    @property
    def gemini_client(self) -> genai.Client:
        """Get or create Gemini client."""
        if self._gemini_client is None:
            if not settings.gemini_api_key:
                raise ValueError("GEMINI_API_KEY not configured")
            self._gemini_client = genai.Client(api_key=settings.gemini_api_key)
        return self._gemini_client

    async def extract_entities(
        self,
        text: str,
        memory_id: Optional[UUID] = None,
    ) -> List[Entity]:
        """Extract entities from text using AI."""
        if not self._use_gemini:
            return self._extract_entities_simple(text, memory_id)
        
        try:
            prompt = f"""Extract key entities from this text. Focus on people, organizations, projects, concepts, skills, and tools.

Text:
{text[:2000]}

Return a JSON array of entities:
[
    {{
        "name": "Entity name",
        "type": "person|organization|project|concept|skill|tool|location|event",
        "aliases": ["alternative names"],
        "context": "Brief context about the entity"
    }}
]

Only include clearly identifiable entities. Maximum 10 entities."""

            response = self.gemini_client.models.generate_content(
                model="gemini-2.0-flash-exp",
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=0.3,
                    max_output_tokens=500,
                ),
            )
            
            entities_data = json.loads(
                response.text.strip().replace("```json", "").replace("```", "")
            )
            
            entities = []
            for e in entities_data:
                entity = Entity(
                    name=e.get("name", ""),
                    entity_type=e.get("type", EntityType.CONCEPT),
                    aliases=e.get("aliases", []),
                    metadata={"context": e.get("context", "")},
                )
                if memory_id:
                    entity.memory_ids.add(memory_id)
                entities.append(entity)
                
                # Add to graph
                self._graph.add_entity(entity)
            
            return entities
            
        except Exception as e:
            logger.error(f"Entity extraction failed: {e}")
            return self._extract_entities_simple(text, memory_id)

    def _extract_entities_simple(
        self,
        text: str,
        memory_id: Optional[UUID] = None,
    ) -> List[Entity]:
        """Simple regex-based entity extraction fallback."""
        entities = []
        
        # Extract capitalized phrases (potential names/organizations)
        name_pattern = r'\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b'
        names = re.findall(name_pattern, text)
        
        for name in set(names[:5]):
            entity = Entity(
                name=name,
                entity_type=EntityType.CONCEPT,
            )
            if memory_id:
                entity.memory_ids.add(memory_id)
            entities.append(entity)
            self._graph.add_entity(entity)
        
        # Extract hashtags as concepts
        hashtags = re.findall(r'#(\w+)', text)
        for tag in set(hashtags[:5]):
            entity = Entity(
                name=tag,
                entity_type=EntityType.CONCEPT,
            )
            if memory_id:
                entity.memory_ids.add(memory_id)
            entities.append(entity)
            self._graph.add_entity(entity)
        
        return entities

    async def extract_relationships(
        self,
        text: str,
        entities: List[Entity],
        memory_id: Optional[UUID] = None,
    ) -> List[Relationship]:
        """Extract relationships between entities."""
        if not self._use_gemini or len(entities) < 2:
            return []
        
        try:
            entity_names = [e.name for e in entities[:10]]
            
            prompt = f"""Given these entities and the text, identify relationships between them.

Entities: {json.dumps(entity_names)}

Text:
{text[:1500]}

Return a JSON array of relationships:
[
    {{
        "source": "Entity name",
        "target": "Entity name",
        "relation": "mentions|relates_to|belongs_to|works_with|depends_on|supports",
        "context": "Brief context"
    }}
]

Only include clear relationships. Maximum 5 relationships."""

            response = self.gemini_client.models.generate_content(
                model="gemini-2.0-flash-exp",
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=0.3,
                    max_output_tokens=400,
                ),
            )
            
            rels_data = json.loads(
                response.text.strip().replace("```json", "").replace("```", "")
            )
            
            relationships = []
            entity_map = {e.name.lower(): e for e in entities}
            
            for r in rels_data:
                source = entity_map.get(r.get("source", "").lower())
                target = entity_map.get(r.get("target", "").lower())
                
                if source and target:
                    rel = Relationship(
                        source_entity=source,
                        target_entity=target,
                        relation_type=r.get("relation", RelationType.RELATES_TO),
                        context=r.get("context"),
                    )
                    if memory_id:
                        rel.memory_ids.add(memory_id)
                    relationships.append(rel)
                    self._graph.add_relationship(rel)
            
            return relationships
            
        except Exception as e:
            logger.error(f"Relationship extraction failed: {e}")
            return []

    async def process_memory(
        self,
        memory_id: UUID,
        content: str,
        title: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Process a memory to extract entities and relationships."""
        full_text = f"{title or ''}\n{content}"
        
        # Extract entities
        entities = await self.extract_entities(full_text, memory_id)
        
        # Extract relationships
        relationships = await self.extract_relationships(full_text, entities, memory_id)
        
        return {
            "memory_id": str(memory_id),
            "entities": [e.to_dict() for e in entities],
            "relationships": [r.to_dict() for r in relationships],
        }

    async def get_connected_memories(
        self,
        memory_id: UUID,
        limit: int = 10,
    ) -> List[Dict[str, Any]]:
        """Get memories connected to a given memory through entities."""
        # Get the memory
        memory = await qdrant_service.get_memory(memory_id)
        if not memory:
            return []
        
        content = memory["payload"].get("content", "")
        title = memory["payload"].get("title", "")
        
        # Extract entities from this memory
        entities = await self.extract_entities(f"{title}\n{content}", memory_id)
        
        if not entities:
            return []
        
        # Find other memories with same entities
        connected_memory_ids: Dict[UUID, int] = {}  # memory_id -> connection_count
        
        for entity in entities:
            graph_entity = self._graph.get_entity(entity.name)
            if graph_entity:
                for mid in graph_entity.memory_ids:
                    if mid != memory_id:
                        connected_memory_ids[mid] = connected_memory_ids.get(mid, 0) + 1
        
        # Sort by connection count
        sorted_ids = sorted(
            connected_memory_ids.items(),
            key=lambda x: x[1],
            reverse=True,
        )[:limit]
        
        # Fetch memories
        connected = []
        for mid, count in sorted_ids:
            mem = await qdrant_service.get_memory(mid)
            if mem:
                connected.append({
                    "memory": mem,
                    "connection_strength": count,
                    "shared_entities": count,
                })
        
        return connected

    async def get_entity_network(
        self,
        entity_name: str,
        max_depth: int = 2,
    ) -> Dict[str, Any]:
        """Get the network of entities related to a given entity."""
        entity = self._graph.get_entity(entity_name)
        if not entity:
            return {"error": "Entity not found"}
        
        related = self._graph.get_related_entities(entity_name, max_depth)
        
        # Build network visualization data
        nodes = [{"id": entity.name, "type": entity.entity_type, "size": entity.mention_count}]
        edges = []
        
        for rel_entity, rel_type, depth in related:
            nodes.append({
                "id": rel_entity.name,
                "type": rel_entity.entity_type,
                "size": rel_entity.mention_count,
                "depth": depth,
            })
            edges.append({
                "source": entity.name if depth == 1 else "",
                "target": rel_entity.name,
                "relation": rel_type,
            })
        
        return {
            "center": entity.to_dict(),
            "nodes": nodes,
            "edges": edges,
            "total_related": len(related),
        }

    async def find_similar_entities(
        self,
        entity_name: str,
        limit: int = 5,
    ) -> List[Entity]:
        """Find entities similar to a given entity based on embeddings."""
        entity = self._graph.get_entity(entity_name)
        if not entity:
            return []
        
        # Get or compute entity embedding
        if str(entity.id) not in self._graph.entity_embeddings:
            embedding = await embedding_service.embed_text(entity.name)
            self._graph.entity_embeddings[str(entity.id)] = embedding
        
        query_embedding = self._graph.entity_embeddings[str(entity.id)]
        
        # Compute similarity with all other entities
        similarities = []
        for other in self._graph.entities.values():
            if other.id == entity.id:
                continue
            
            if str(other.id) not in self._graph.entity_embeddings:
                embedding = await embedding_service.embed_text(other.name)
                self._graph.entity_embeddings[str(other.id)] = embedding
            
            other_embedding = self._graph.entity_embeddings[str(other.id)]
            similarity = embedding_service.compute_similarity(query_embedding, other_embedding)
            similarities.append((other, similarity))
        
        # Sort by similarity
        similarities.sort(key=lambda x: x[1], reverse=True)
        
        return [entity for entity, _ in similarities[:limit]]

    def get_graph_stats(self) -> Dict[str, Any]:
        """Get statistics about the knowledge graph."""
        type_counts = {}
        for entity in self._graph.entities.values():
            type_counts[entity.entity_type] = type_counts.get(entity.entity_type, 0) + 1
        
        return {
            "total_entities": len(self._graph.entities),
            "total_relationships": len(self._graph.relationships),
            "entity_types": type_counts,
            "top_entities": sorted(
                [(e.name, e.mention_count) for e in self._graph.entities.values()],
                key=lambda x: x[1],
                reverse=True,
            )[:10],
        }

    def export_graph(self) -> Dict[str, Any]:
        """Export the full knowledge graph."""
        return self._graph.to_dict()


# Global service instance
connections_service = ConnectionsService()
