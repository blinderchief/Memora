# Memora - Collaborative Memory OS for Professional Teams

> The memory layer of professional work — enabling teams to remember *together*, reason *over time*, and retrieve *contextually*.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Python](https://img.shields.io/badge/python-3.11+-blue.svg)](https://python.org)
[![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org)

## 🚀 Features

- **Multi-Modal Memory Units**: Parse PDFs, documents, slides → multi-vector embeddings
- **Hybrid Search**: Dense + Sparse (BM25) + Temporal boosting via Qdrant
- **Memory Timeline**: Visual chronological view of your knowledge
- **Role-Aware Access**: ABAC-based permissions for teams
- **AI Reasoning**: Auto-tag, summarize, suggest connections
- **Authentication**: Clerk-based auth with user sync

## 🏗️ Architecture

```
memora/
├── backend/          # FastAPI + Python 3.11
│   ├── app/
│   │   ├── api/      # REST endpoints
│   │   ├── core/     # Business logic
│   │   │   ├── ingestion/   # Document parsing
│   │   │   ├── embedding/   # Vector generation
│   │   │   ├── retrieval/   # Search & ranking
│   │   │   └── auth.py      # Authentication
│   │   ├── db/       # Qdrant client & user storage
│   │   └── models/   # Pydantic schemas
│   └── tests/
├── frontend/         # Next.js 14 + TypeScript
│   ├── src/
│   │   ├── app/      # App router
│   │   │   ├── api/webhooks/  # Clerk webhooks
│   │   │   ├── sign-in/       # Auth pages
│   │   │   └── sign-up/
│   │   ├── components/
│   │   │   └── auth/  # Auth components
│   │   └── lib/      # API client, utils
│   └── public/
└── docker-compose.yml
```

## 🛠️ Tech Stack

| Component | Technology |
|-----------|------------|
| Backend | FastAPI, Python 3.11, UV |
| Vector DB | Qdrant (Cloud/Local) |
| Embeddings | E5-base, Gemini 2.0 Flash |
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| UI Components | shadcn/ui, Radix UI |
| Authentication | Clerk |
| Visualization | D3.js, Recharts |

## 🚦 Quick Start

### Prerequisites

- Python 3.11+
- Node.js 20+
- UV (`pip install uv`)
- Docker (optional, for local Qdrant)
- Clerk account (for authentication)

### 1. Clone and Setup Environment

```bash
git clone <repo-url>
cd memora
cp .env.example .env
```

### 2. Clerk Setup

1. Create a Clerk account at [clerk.com](https://clerk.com)
2. Create a new application
3. Get your API keys from the Clerk Dashboard:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
4. Set up a webhook endpoint:
   - URL: `https://your-domain.com/api/webhooks/clerk`
   - Events: `user.created`, `user.updated`, `user.deleted`
   - Get the `CLERK_WEBHOOK_SECRET`

### 3. Backend Setup

```bash
cd backend
uv sync
cp .env.example .env
# Add your GEMINI_API_KEY, QDRANT_URL, and CLERK_SECRET_KEY to .env
uv run uvicorn app.main:app --reload
```

### 4. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env.local
# Add your Clerk keys to .env.local
npm run dev
```

### With Docker

```bash
docker-compose up -d
```

## 📖 API Documentation

Once running, visit:
- Backend API: http://localhost:8000/docs
- Frontend: http://localhost:3000

## 🔑 Environment Variables

### Backend (.env)
```
GEMINI_API_KEY=your_gemini_api_key
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=optional_for_cloud
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
```

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🤝 Contributing

Contributions welcome! Please read our contributing guidelines first.
