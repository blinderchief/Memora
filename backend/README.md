# Memora Backend

FastAPI backend for Memora - Collaborative Memory OS for Professional Teams.

## Features

- **Document Ingestion**: Parse PDFs, documents, and text files
- **Hybrid Search**: Dense + Sparse vector search with Qdrant
- **Gemini Embeddings**: AI-powered text embeddings
- **User Authentication**: Clerk-based auth with user sync

## Setup

```bash
# Install dependencies
uv sync

# Copy environment file
cp .env.example .env
# Add your API keys to .env

# Run the server
uv run uvicorn app.main:app --reload
```

## API Documentation

Once running, visit: http://localhost:8000/docs

## Environment Variables

```
GEMINI_API_KEY=your_gemini_api_key
QDRANT_URL=http://localhost:6333
CLERK_SECRET_KEY=your_clerk_secret_key
```
