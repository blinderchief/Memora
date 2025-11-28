<p align="center">
  <img src="https://img.shields.io/badge/🧠-Memora-8B5CF6?style=for-the-badge&labelColor=1a1a2e&color=8B5CF6" alt="Memora" height="60" />
</p>

<h1 align="center">Memora</h1>

<p align="center">
  <strong>🧠 The Collaborative Memory OS for Professional Teams</strong>
</p>

<p align="center">
  <em>The memory layer of professional work — enabling teams to remember <strong>together</strong>, reason <strong>over time</strong>, and retrieve <strong>contextually</strong>.</em>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#demo">Demo</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#api">API</a> •
  <a href="#contributing">Contributing</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python" />
  <img src="https://img.shields.io/badge/Next.js-15-000000?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/Qdrant-FF6B6B?style=for-the-badge&logo=qdrant&logoColor=white" alt="Qdrant" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
</p>

---

## 🎯 What is Memora?

Memora is an **AI-powered second brain** designed for professionals and teams. Unlike traditional note-taking apps that treat documents as isolated files, Memora understands your content deeply — it parses, embeds, connects, and reasons over your knowledge base.

### The Problem We Solve

| Problem | Traditional Tools | Memora |
|---------|-------------------|--------|
| **Memory Fragmentation** | Notes, chats, files are siloed | Unified semantic memory layer |
| **No Temporal Reasoning** | Can't answer "What did we decide before X?" | Full temporal context & evolution tracking |
| **Weak Collaboration** | Shared folders, no intelligence | Role-aware, team memory with provenance |
| **Static Search** | Keyword matching | Hybrid AI search with understanding |

---

## ✨ Features

### 🔍 **Intelligent Search**
- **Hybrid Search Engine**: Combines dense vectors (semantic understanding) + sparse vectors (BM25 keyword matching)
- **Multi-stage Retrieval**: Query → Hybrid Search → Reranking → Context Fusion
- **Temporal Boosting**: Recent content weighted higher, with historical query support
- **Filter by**: Author, date range, document type, tags, projects

### 📄 **Smart Document Ingestion**
- **Multi-format Support**: PDF, DOCX, TXT, Markdown, and more
- **Intelligent Chunking**: Preserves document structure and context
- **Auto-extraction**: Titles, summaries, key entities, and metadata
- **Batch Processing**: Upload and process multiple documents at once

### 💬 **AI Memory Agent**
- **Contextual Chat**: Ask questions about your entire knowledge base
- **Source Citations**: Every answer linked to source documents
- **Follow-up Suggestions**: AI suggests related questions
- **Chat History**: All conversations saved and searchable

### 📊 **Dashboard & Analytics**
- **Activity Overview**: Track searches, uploads, and engagement
- **Weekly Trends**: Visualize usage patterns
- **AI Insights**: Automatic recommendations based on your data
- **Team Analytics**: See who's contributing and how

### 🧠 **Intelligence Features**

| Feature | Description |
|---------|-------------|
| **🔮 Insights** | AI-generated connections and patterns in your data |
| **❤️ Memory Health** | Track knowledge freshness and review schedules |
| **🎯 Focus Mode** | Pomodoro-style sessions with spaced repetition |
| **🕸️ Knowledge Graph** | Visual network of connected concepts |
| **📈 Evolution** | Track how your knowledge grows over time |

### 👥 **Team Collaboration**
- **Project Workspaces**: Organize memories by project
- **Team Management**: Invite members, assign roles
- **Role-based Access**: Control who sees what
- **Activity Feed**: See team contributions in real-time

### ⚙️ **Developer Features**
- **REST API**: Full API access for integrations
- **Webhooks**: Real-time event notifications
- **API Keys**: Secure programmatic access
- **Documentation**: Comprehensive API docs

---

## 🖼️ Screenshots

<details>
<summary>📊 Dashboard</summary>
<p>Real-time overview of your memory system with activity stats, recent memories, and AI insights.</p>
</details>

<details>
<summary>🔍 Search</summary>
<p>Powerful hybrid search with filters, semantic understanding, and instant results.</p>
</details>

<details>
<summary>💬 AI Chat</summary>
<p>Chat with your knowledge base. Get answers with source citations.</p>
</details>

<details>
<summary>🕸️ Knowledge Graph</summary>
<p>Visualize connections between concepts, documents, and ideas.</p>
</details>

---

## 🚀 Quick Start

### Prerequisites

| Requirement | Version | Purpose |
|-------------|---------|---------|
| Python | 3.11+ | Backend runtime |
| Node.js | 20+ | Frontend runtime |
| UV | Latest | Python package manager |
| Docker | Optional | Local Qdrant instance |

### Step 1: Clone the Repository

```bash
git clone https://github.com/blinderchief/Memora.git
cd Memora
```

### Step 2: Set Up External Services

#### 🔐 Clerk (Authentication)

1. Create account at [clerk.com](https://clerk.com)
2. Create a new application
3. Get your API keys:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
4. Set up webhook (optional for user sync):
   - URL: `https://your-domain.com/api/webhooks/clerk`
   - Events: `user.created`, `user.updated`, `user.deleted`

#### 🗄️ Qdrant (Vector Database)

**Option A: Qdrant Cloud (Recommended)**
1. Create account at [cloud.qdrant.io](https://cloud.qdrant.io)
2. Create a free cluster
3. Get your `QDRANT_URL` and `QDRANT_API_KEY`

**Option B: Local Docker**
```bash
docker run -p 6333:6333 qdrant/qdrant
```

#### 🤖 Google Gemini (AI/Embeddings)

1. Get API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Save as `GEMINI_API_KEY`

#### 💾 Neon PostgreSQL (Optional - for Chat History)

1. Create account at [neon.tech](https://neon.tech)
2. Create a new project
3. Copy connection string as `DATABASE_URL`

### Step 3: Backend Setup

```bash
cd backend

# Create virtual environment and install dependencies
uv sync

# Create environment file
cp .env.example .env

# Edit .env with your keys:
# GEMINI_API_KEY=your_key
# QDRANT_URL=https://xxx.cloud.qdrant.io
# QDRANT_API_KEY=your_key
# DATABASE_URL=postgresql://... (optional)

# Start the server
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Step 4: Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

# Edit .env.local with your keys:
# NEXT_PUBLIC_API_URL=http://localhost:8000
# NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
# CLERK_SECRET_KEY=sk_test_...

# Start development server
npm run dev
```

### Step 5: Access the Application

- **Frontend**: http://localhost:3000
- **API Docs**: http://localhost:8000/docs
- **API ReDoc**: http://localhost:8000/redoc

---

## 🐳 Docker Deployment

```bash
# Build and run all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js 15)                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │
│  │Dashboard │ │  Search  │ │ AI Chat  │ │ Upload   │ │Settings│ │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └────────┘ │
│                              │                                    │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              Clerk Authentication (SSO/OAuth)               │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                               │ REST API
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Backend (FastAPI)                          │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────────┐ │
│  │   Ingestion  │ │  Embedding   │ │      Retrieval           │ │
│  │   Pipeline   │ │   Service    │ │   (Hybrid Search)        │ │
│  │              │ │  (Gemini)    │ │                          │ │
│  │ PDF Parser   │ │              │ │ Dense + Sparse + Rerank  │ │
│  │ Chunker      │ │ Batch/Async  │ │ Temporal Boosting        │ │
│  └──────────────┘ └──────────────┘ └──────────────────────────┘ │
│                                                                   │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────────┐ │
│  │  AI Agent    │ │   Activity   │ │     Chat Service         │ │
│  │  (Gemini)    │ │   Logging    │ │   (Sessions/Messages)    │ │
│  └──────────────┘ └──────────────┘ └──────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
          │                    │                      │
          ▼                    ▼                      ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│   Qdrant Cloud   │  │  Neon PostgreSQL │  │   Google Gemini  │
│   Vector Store   │  │   User Data      │  │   LLM + Embed    │
│                  │  │   Chat History   │  │                  │
│  • Dense Vectors │  │   Activities     │  │  • gemini-2.0    │
│  • Sparse (BM25) │  │                  │  │  • Embeddings    │
│  • Hybrid Search │  │                  │  │                  │
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

### Directory Structure

```
memora/
├── 📁 backend/                 # Python FastAPI Backend
│   ├── app/
│   │   ├── api/               # REST API endpoints
│   │   │   └── routes/        # Route handlers
│   │   │       ├── health.py  # Health checks
│   │   │       ├── ingest.py  # Document upload
│   │   │       ├── search.py  # Hybrid search
│   │   │       ├── memory.py  # Memory CRUD
│   │   │       ├── chat.py    # AI chat sessions
│   │   │       └── users.py   # User management
│   │   ├── core/              # Business logic
│   │   │   ├── ingestion/     # Document parsing
│   │   │   ├── embedding/     # Vector generation
│   │   │   └── retrieval/     # Search algorithms
│   │   ├── db/                # Database clients
│   │   │   ├── qdrant.py      # Vector store
│   │   │   └── database.py    # PostgreSQL (Neon)
│   │   ├── models/            # Pydantic schemas
│   │   ├── services/          # Service layer
│   │   └── config.py          # Configuration
│   ├── pyproject.toml         # Dependencies
│   └── Dockerfile
│
├── 📁 frontend/                # Next.js 15 Frontend
│   ├── src/
│   │   ├── app/               # App Router pages
│   │   │   ├── (dashboard)/   # Protected pages
│   │   │   │   ├── dashboard/ # Main dashboard
│   │   │   │   ├── search/    # Search interface
│   │   │   │   ├── chat/      # AI chat
│   │   │   │   ├── upload/    # Document upload
│   │   │   │   ├── timeline/  # Memory timeline
│   │   │   │   ├── insights/  # AI insights
│   │   │   │   ├── focus/     # Focus mode
│   │   │   │   ├── graph/     # Knowledge graph
│   │   │   │   ├── analytics/ # Usage analytics
│   │   │   │   ├── settings/  # User settings
│   │   │   │   └── ...
│   │   │   ├── sign-in/       # Auth pages
│   │   │   └── sign-up/
│   │   ├── components/        # React components
│   │   │   ├── ui/            # shadcn/ui components
│   │   │   ├── search/        # Search components
│   │   │   ├── memory/        # Memory cards
│   │   │   └── ingest/        # Upload components
│   │   └── lib/               # Utilities
│   ├── package.json
│   └── Dockerfile
│
├── docker-compose.yml          # Docker orchestration
└── README.md
```

---

## 🔌 API Reference

### Base URL
```
http://localhost:8000/api
```

### Authentication
Include user ID in headers:
```
X-User-Id: user_xxx
```

### Endpoints

#### 📄 Document Ingestion

```http
POST /api/ingest
Content-Type: multipart/form-data

file: <document>
user_id: string
```

**Response:**
```json
{
  "id": "mem_abc123",
  "title": "Document Title",
  "chunks_created": 5,
  "status": "completed"
}
```

#### 🔍 Search

```http
POST /api/search
Content-Type: application/json

{
  "query": "machine learning concepts",
  "user_id": "user_xxx",
  "limit": 10,
  "filters": {
    "date_from": "2024-01-01",
    "tags": ["ai", "tech"]
  }
}
```

**Response:**
```json
{
  "results": [
    {
      "id": "mem_abc123",
      "title": "ML Fundamentals",
      "content": "...",
      "score": 0.95,
      "highlights": ["<mark>machine learning</mark>..."]
    }
  ],
  "total": 42,
  "query_time_ms": 45
}
```

#### 💬 AI Chat

```http
POST /api/agent/chat
Content-Type: application/json

{
  "query": "What have I learned about neural networks?",
  "user_id": "user_xxx",
  "session_id": "sess_xxx"
}
```

**Response:**
```json
{
  "content": "Based on your memories, you've studied...",
  "memories_used": [...],
  "confidence": 0.89,
  "follow_up_questions": [...]
}
```

#### 📝 Memory CRUD

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/memories` | List all memories |
| GET | `/api/memories/{id}` | Get single memory |
| PATCH | `/api/memories/{id}` | Update memory |
| DELETE | `/api/memories/{id}` | Delete memory |

For complete API documentation, visit `/docs` when running the backend.

---

## 🔧 Configuration

### Backend Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | ✅ | Google AI API key for embeddings & chat |
| `QDRANT_URL` | ✅ | Qdrant server URL |
| `QDRANT_API_KEY` | ⚠️ | Required for Qdrant Cloud |
| `DATABASE_URL` | ❌ | Neon PostgreSQL for chat history |
| `CLERK_SECRET_KEY` | ❌ | For user sync webhooks |
| `DEBUG` | ❌ | Enable debug logging |

### Frontend Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | ✅ | Backend API URL |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | ✅ | Clerk public key |
| `CLERK_SECRET_KEY` | ✅ | Clerk secret key |
| `CLERK_WEBHOOK_SECRET` | ❌ | For user sync |

---

## 🛠️ Tech Stack

### Backend
| Technology | Purpose |
|------------|---------|
| **FastAPI** | High-performance async API framework |
| **Python 3.11+** | Runtime with modern features |
| **UV** | Fast Python package manager |
| **Qdrant** | Vector database for semantic search |
| **SQLAlchemy** | Async ORM for PostgreSQL |
| **Pydantic** | Data validation and settings |

### Frontend
| Technology | Purpose |
|------------|---------|
| **Next.js 15** | React framework with App Router |
| **TypeScript** | Type-safe JavaScript |
| **Tailwind CSS** | Utility-first styling |
| **shadcn/ui** | Beautiful UI components |
| **Framer Motion** | Smooth animations |
| **Clerk** | Authentication & user management |

### AI/ML
| Technology | Purpose |
|------------|---------|
| **Google Gemini 2.0** | LLM for chat & reasoning |
| **Gemini Embeddings** | Text-to-vector conversion |
| **Hybrid Search** | Dense + BM25 sparse vectors |

### Infrastructure
| Technology | Purpose |
|------------|---------|
| **Neon** | Serverless PostgreSQL |
| **Qdrant Cloud** | Managed vector database |
| **Docker** | Containerization |
| **Vercel** | Frontend deployment (optional) |

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `pytest` (backend) / `npm test` (frontend)
5. Commit: `git commit -m 'Add amazing feature'`
6. Push: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Code Style

- **Backend**: Follow PEP 8, use Black formatter
- **Frontend**: ESLint + Prettier configuration included

### Areas for Contribution

- 🐛 Bug fixes
- 📚 Documentation improvements
- 🌐 Internationalization
- 🎨 UI/UX enhancements
- ⚡ Performance optimizations
- 🧪 Test coverage

---

## 📜 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Qdrant](https://qdrant.tech) - Vector database
- [Clerk](https://clerk.com) - Authentication
- [shadcn/ui](https://ui.shadcn.com) - UI components
- [Neon](https://neon.tech) - Serverless Postgres
- [Google AI](https://ai.google.dev) - Gemini API

---

## 📬 Contact & Support

- **Issues**: [GitHub Issues](https://github.com/blinderchief/Memora/issues)
- **Discussions**: [GitHub Discussions](https://github.com/blinderchief/Memora/discussions)

---

<p align="center">
  Made with ❤️ for professionals who never want to forget
</p>

<p align="center">
  <a href="#memora">⬆️ Back to Top</a>
</p>
