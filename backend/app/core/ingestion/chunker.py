"""Text chunking utilities for Memora."""

import re
from typing import List, Tuple

from app.models.ingest import ChunkingStrategy, DocumentChunk


class TextChunker:
    """Utility class for chunking text into smaller pieces."""

    def __init__(
        self,
        chunk_size: int = 512,
        chunk_overlap: int = 50,
        strategy: ChunkingStrategy = ChunkingStrategy.SEMANTIC,
    ):
        """
        Initialize the text chunker.
        
        Args:
            chunk_size: Target chunk size in characters
            chunk_overlap: Overlap between consecutive chunks
            strategy: Chunking strategy to use
        """
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.strategy = strategy

    def chunk_text(self, text: str, metadata: dict = None) -> List[DocumentChunk]:
        """
        Split text into chunks based on the configured strategy.
        
        Args:
            text: Text to chunk
            metadata: Additional metadata to include in chunks
            
        Returns:
            List of DocumentChunk objects
        """
        if not text or not text.strip():
            return []

        if self.strategy == ChunkingStrategy.FIXED:
            raw_chunks = self._fixed_chunks(text)
        elif self.strategy == ChunkingStrategy.SEMANTIC:
            raw_chunks = self._semantic_chunks(text)
        elif self.strategy == ChunkingStrategy.SECTION:
            raw_chunks = self._section_chunks(text)
        else:
            raw_chunks = self._semantic_chunks(text)

        # Convert to DocumentChunk objects
        chunks = []
        total = len(raw_chunks)
        
        for idx, (content, start_char, end_char) in enumerate(raw_chunks):
            chunk = DocumentChunk(
                content=content,
                chunk_index=idx,
                total_chunks=total,
                start_char=start_char,
                end_char=end_char,
                is_table=self._detect_table(content),
                is_code=self._detect_code(content),
                is_header=self._detect_header(content),
                metadata=metadata or {},
            )
            chunks.append(chunk)

        return chunks

    def _fixed_chunks(self, text: str) -> List[Tuple[str, int, int]]:
        """Split text into fixed-size chunks with overlap."""
        chunks = []
        start = 0
        text_len = len(text)

        while start < text_len:
            end = min(start + self.chunk_size, text_len)
            
            # Try to break at word boundary
            if end < text_len:
                last_space = text.rfind(' ', start, end)
                if last_space > start:
                    end = last_space

            chunk_text = text[start:end].strip()
            if chunk_text:
                chunks.append((chunk_text, start, end))

            # Move start with overlap
            start = end - self.chunk_overlap if end < text_len else text_len

        return chunks

    def _semantic_chunks(self, text: str) -> List[Tuple[str, int, int]]:
        """Split text at semantic boundaries (sentences, paragraphs)."""
        # Split into paragraphs first
        paragraphs = re.split(r'\n\s*\n', text)
        
        chunks = []
        current_chunk = ""
        current_start = 0
        char_pos = 0

        for para in paragraphs:
            para = para.strip()
            if not para:
                char_pos += 2  # Account for paragraph separator
                continue

            # Split paragraph into sentences
            sentences = re.split(r'(?<=[.!?])\s+', para)
            
            for sentence in sentences:
                sentence = sentence.strip()
                if not sentence:
                    continue

                # If adding this sentence exceeds chunk size, save current chunk
                if current_chunk and len(current_chunk) + len(sentence) + 1 > self.chunk_size:
                    chunks.append((current_chunk.strip(), current_start, char_pos))
                    
                    # Start new chunk with overlap from previous
                    overlap_text = self._get_overlap_text(current_chunk)
                    current_chunk = overlap_text + " " + sentence if overlap_text else sentence
                    current_start = char_pos - len(overlap_text) if overlap_text else char_pos
                else:
                    if current_chunk:
                        current_chunk += " " + sentence
                    else:
                        current_chunk = sentence
                        current_start = char_pos

                char_pos += len(sentence) + 1

            char_pos += 2  # Account for paragraph separator

        # Don't forget the last chunk
        if current_chunk.strip():
            chunks.append((current_chunk.strip(), current_start, char_pos))

        return chunks

    def _section_chunks(self, text: str) -> List[Tuple[str, int, int]]:
        """Split text at section headers (markdown-style)."""
        # Find section headers
        header_pattern = r'^(#{1,6}\s+.+|[A-Z][A-Z\s]+:?)$'
        lines = text.split('\n')
        
        sections = []
        current_section = ""
        current_start = 0
        char_pos = 0

        for line in lines:
            if re.match(header_pattern, line.strip(), re.MULTILINE):
                # Save previous section if exists
                if current_section.strip():
                    sections.append((current_section.strip(), current_start, char_pos))
                current_section = line
                current_start = char_pos
            else:
                current_section += "\n" + line

            char_pos += len(line) + 1

        # Don't forget the last section
        if current_section.strip():
            sections.append((current_section.strip(), current_start, char_pos))

        # If sections are too large, apply semantic chunking within each
        final_chunks = []
        for section_text, start, end in sections:
            if len(section_text) > self.chunk_size:
                sub_chunks = self._semantic_chunks(section_text)
                for sub_text, sub_start, sub_end in sub_chunks:
                    final_chunks.append((sub_text, start + sub_start, start + sub_end))
            else:
                final_chunks.append((section_text, start, end))

        return final_chunks if final_chunks else self._semantic_chunks(text)

    def _get_overlap_text(self, text: str) -> str:
        """Get the last N characters for overlap, breaking at word boundary."""
        if len(text) <= self.chunk_overlap:
            return text
        
        overlap_start = len(text) - self.chunk_overlap
        # Find word boundary
        space_pos = text.find(' ', overlap_start)
        if space_pos != -1:
            return text[space_pos + 1:]
        return text[overlap_start:]

    def _detect_table(self, text: str) -> bool:
        """Detect if chunk contains a table."""
        # Check for markdown table patterns
        if '|' in text and '-|-' in text:
            return True
        # Check for tab-separated values
        lines = text.split('\n')
        tab_lines = sum(1 for line in lines if '\t' in line)
        return tab_lines >= 2

    def _detect_code(self, text: str) -> bool:
        """Detect if chunk contains code."""
        code_indicators = [
            '```',
            'def ',
            'class ',
            'function ',
            'import ',
            'const ',
            'let ',
            'var ',
            '=>',
            '<?php',
            '#!/',
        ]
        return any(indicator in text for indicator in code_indicators)

    def _detect_header(self, text: str) -> bool:
        """Detect if chunk is primarily a header."""
        lines = text.strip().split('\n')
        if len(lines) <= 2:
            first_line = lines[0].strip()
            return (
                first_line.startswith('#') or
                first_line.isupper() or
                first_line.endswith(':')
            )
        return False
