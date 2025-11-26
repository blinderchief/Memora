"""Ingestion module for document processing."""

from app.core.ingestion.parser import DocumentParser, document_parser
from app.core.ingestion.chunker import TextChunker

__all__ = ["DocumentParser", "document_parser", "TextChunker"]
