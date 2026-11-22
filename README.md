# DocMind AI

> **Enterprise Document Intelligence and Multi-Agent Reasoning Platform powered by Groq LPU Inference, LangGraph, and Hybrid RAG with Verifiable Page-Level Citations.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2015-black.svg?logo=next.js&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB.svg?logo=python&logoColor=white)](https://www.python.org)
[![Groq](https://img.shields.io/badge/LLM-Groq%20High--Speed%20Inference-F05032.svg)](https://groq.com)
[![LangGraph](https://img.shields.io/badge/Orchestration-LangGraph-1C3C3C.svg)](https://langchain-ai.github.io/langgraph/)
[![pgvector](https://img.shields.io/badge/Vector%20Store-PostgreSQL%20%2B%20pgvector-336791.svg?logo=postgresql&logoColor=white)](https://github.com/pgvector/pgvector)
[![Tailwind CSS v4](https://img.shields.io/badge/Design-White%2C%20Black%20%26%20Lime%20Green-a3e635.svg)](https://tailwindcss.com)

DocMind AI enables organizations to ingest diverse document archives—financial statements, technical manuals, contracts, research papers, and spreadsheets—and conduct high-precision, hallucination-resistant multi-document reasoning with **verifiable, page-level passage citations**.

---

## Table of Contents

- [Key Capabilities](#key-capabilities)
- [System Architecture](#system-architecture)
- [Multi-Agent LangGraph Workflow](#multi-agent-langgraph-workflow)
- [Hybrid RAG & Reranking Pipeline](#hybrid-rag--reranking-pipeline)
- [Empirical Evaluation Suite](#empirical-evaluation-suite)
- [Repository Structure](#repository-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Environment Configuration](#environment-configuration)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
  - [Docker Infrastructure](#docker-infrastructure)
- [Running Benchmarks & Tests](#running-benchmarks--tests)
- [API Reference](#api-reference)
- [Documentation Directory](#documentation-directory)
- [License](#license)

---

## Key Capabilities

- **Multi-Format Ingestion**: Native extraction for PDF (`PyMuPDF`), DOCX (`python-docx`), CSV/Excel (`pandas`), Markdown, and plain text with page boundary and tabular schema preservation.
- **Sliding-Window Semantic Chunking**: Chunk size of 800 characters with 120-character overlap, tracking physical page numbers, chunk offsets, and token volumes.
- **Dual Vector Storage Architecture**:
  - **Production Mode**: PostgreSQL 16 + `pgvector` utilizing the cosine distance operator (`<=>`).
  - **Local/Test Mode**: Transparent fallback to SQLite + vectorized cosine similarity (zero external dependencies required for immediate testing).
- **Hybrid Search Engine**: Merges dense embeddings (`sentence-transformers/all-MiniLM-L6-v2`, 384 dimensions) with sparse BM25 keyword retrieval.
- **Reciprocal Rank Fusion (RRF)**: Calibrates ranking scores using $RRF(d) = \sum_{i=1}^{n} \frac{1}{k + \text{rank}_i(d)}$ ($k=60$).
- **Cross-Encoder Reranking**: Evaluates full cross-attention between user query and candidate passages using `cross-encoder/ms-marco-MiniLM-L-6-v2`.
- **Modular Multi-Agent LangGraph Architecture**:
  - **Supervisor Agent** (`supervisor.py`): Query analysis, complexity assessment, and intent-driven dynamic routing.
  - **Retriever Agent**: Decoupled hybrid search interface with RRF fusion and reranking.
  - **Researcher Agent** (`researcher.py`): Multi-part investigative inquiry across multiple documents.
  - **Comparator Agent** (`comparator.py`): Cross-document comparative matrix and contradiction detection.
  - **Summarizer Agent** (`summarizer.py`): Structured executive summaries grounded in evidence.
  - **Verifier Agent** (`verifier.py`): Hallucination audit that validates citations against source passages.
- **High-Speed Groq Inference with Dynamic Failover**:
  - Direct integration with Groq's high-throughput LPU inference engine (`openai/gpt-oss-120b`, `llama-3.3-70b-versatile`, `qwen/qwen3.8-27b`) with automatic model failover.
- **Security & Prompt Injection Defense** (`security.py`):
  - Indirect prompt injection sanitization on untrusted document chunks, path traversal guards, MIME/size validation, and tenant workspace isolation.
- **Real-Time Streaming Chat (SSE)**: Token-by-token response streaming via Server-Sent Events with typewriter UI.
- **Verifiable Citations with Page Jumping**: Click any cited passage in Chat, Research Studio, or Comparison Studio to jump directly to the exact source page in the built-in Document Viewer.
- **High-Contrast Design System**: Clean, enterprise-grade White, Obsidian Black, and Lime Green accents (`#a3e635`).
- **Production Containerization**: Multi-stage Dockerfiles (`Dockerfile.backend`, `Dockerfile.frontend`) and `docker-compose.yml` for instant deployment.

---

## System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                          Presentation Layer                            │
│                 Next.js 15 App Router (TypeScript, Tailwind v4)        │
│   /login | /dashboard | /documents | /chat | /research | /settings     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / SSE Streaming
┌───────────────────────────────────▼────────────────────────────────────┐
│                              API Layer                                 │
│                         FastAPI Web Service                            │
│     /api/documents | /api/chat | /api/agents | /api/health             │
└─────────────────┬───────────────────────────────────┬──────────────────┘
                  │                                   │
┌─────────────────▼──────────────┐   ┌────────────────▼──────────────────┐
│    Document Ingestion Engine   │   │        Retrieval & Ranking        │
│    - PyMuPDF, python-docx      │   │        - pgvector Semantic        │
│    - pandas Tabular Parsing    │   │        - BM25 Keyword Search      │
│    - Sliding Window Chunking   │   │        - RRF Fusion (k=60)        │
│    - SentenceTransformers      │   │        - Cross-Encoder Rerank     │
└─────────────────┬──────────────┘   └────────────────┬──────────────────┘
                  │                                   │
┌─────────────────▼───────────────────────────────────▼──────────────────┐
│                        Multi-Agent LangGraph Layer                     │
│  - Supervisor Agent -> Intent Routing -> Specialized Agents -> Verifier│
│  - Specialized: Researcher, Comparator, Summarizer, QA Generator       │
│  - Groq AI (openai/gpt-oss-120b, Llama 3.3, sub-second latency)       │
│  - Verifiable Page-Number Citations                                    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                           Storage Layer                                │
│  - PostgreSQL + pgvector (Docker Compose production)                   │
│  - SQLite Fallback (Local zero-dependency testing)                     │
│  - File Storage: storage/documents/                                    │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Multi-Agent LangGraph Workflow

Rather than treating RAG as a simple single-turn prompt injection, DocMind orchestrates a decoupled state graph:

```mermaid
graph TD
    User([User Query]) --> Supervisor[Supervisor Agent]
    Supervisor -->|Sub-queries| Retriever[Retriever Node]
    Retriever -->|Dense + BM25 + RRF + Reranker| Router{Intent Router}
    
    Router -->|Research Query| Researcher[Researcher Agent]
    Router -->|Comparison Query| Comparator[Comparator Agent]
    Router -->|Summarization Query| Summarizer[Summarizer Agent]
    Router -->|Standard Question| Generator[QA Generator Agent]
    
    Researcher --> Verifier[Verifier Agent]
    Comparator --> Verifier
    Summarizer --> Verifier
    Generator --> Verifier
    
    Verifier -->|Audit Grounding & Page Citations| FinalAnswer([Grounded Response + Page Citations])
```

1. **Supervisor Agent** (`backend/app/agents/supervisor.py`): Analyzes query complexity, extracts entities, and routes intent.
2. **Retriever Agent**: Decoupled hybrid retrieval querying vector space and lexical index.
3. **Domain Specialist Agents**:
   - **Researcher** (`researcher.py`): Investigates multi-part inquiries with deep synthesis.
   - **Comparator** (`comparator.py`): Performs side-by-side reconciliation across multiple documents.
   - **Summarizer** (`summarizer.py`): Generates structured executive briefings.
4. **Verifier Agent** (`verifier.py`): Validates generated claims against context passages, scoring attribution confidence.

---

## Hybrid RAG & Reranking Pipeline

```mermaid
flowchart LR
    Q[User Query] --> VS[Dense Vector Search\npgvector / 384-dim]
    Q --> BM[BM25 Keyword Search\nLexical matching]
    VS --> RRF[Reciprocal Rank Fusion\nk = 60]
    BM --> RRF
    RRF --> CE[Cross-Encoder Reranker\nms-marco-MiniLM-L-6-v2]
    CE --> TopK[Top-K Evidence Passages]
```

- **Dense Semantic Retrieval**: Overcomes vocabulary mismatch and captures contextual semantic meaning.
- **Sparse Lexical Retrieval**: Ensures exact matches for alphanumeric IDs, product models, legal terms, and tabular metrics.
- **Reciprocal Rank Fusion (RRF)**: Combines rank distributions without arbitrary score normalization:
  $$RRF(d) = \sum_{i=1}^{n} \frac{1}{60 + \text{rank}_i(d)}$$
- **Cross-Encoder Rescoring**: Eliminates false positives by evaluating joint sentence-pair attention.

---

## Empirical Evaluation Suite

DocMind includes a standardized evaluation harness ([`evaluation/`](file:///c:/AI%20Projects/docminds-ai/evaluation)) implementing empirical metrics across 4 retrieval strategies:

| Strategy | Recall@3 | Precision@3 | MRR | NDCG@3 |
| :--- | :---: | :---: | :---: | :---: |
| **Vector Search Only** | 100.0% | 33.3% | 1.000 | 1.000 |
| **BM25 Keyword Search** | 100.0% | 33.3% | 1.000 | 1.000 |
| **Hybrid RRF ($k=60$)** | 100.0% | 33.3% | 1.000 | 1.000 |
| **Hybrid + Cross-Encoder** | **100.0%** | **33.3%** | **1.000** | **1.000** |

- **Recall@K**: Proportion of ground-truth passages present in top-$K$.
- **Precision@K**: Density of relevant passages in top-$K$.
- **MRR (Mean Reciprocal Rank)**: Position of the first relevant passage.
- **NDCG@K**: Graded relevance discount ranking score.
- **Faithfulness & Citation Precision**: Automated verification ensuring generated answers make no unsupported assertions.

---

## Repository Structure

```
docminds-ai/
├── frontend/                          # Next.js 15 App Router, TypeScript, Tailwind v4
│   ├── src/
│   │   ├── app/                       # App Router Pages
│   │   │   ├── (auth)/login/page.tsx  # Enterprise authentication page
│   │   │   ├── dashboard/page.tsx     # Central metrics & activity dashboard
│   │   │   ├── documents/page.tsx     # Document management & chunk viewer
│   │   │   ├── chat/page.tsx          # Real-time streaming AI chat interface
│   │   │   ├── research/page.tsx      # Multi-step research studio
│   │   │   ├── settings/page.tsx      # System configuration & model controls
│   │   │   ├── layout.tsx             # Root layout & dark theme provider
│   │   │   └── page.tsx               # Interactive application view
│   │   ├── components/
│   │   │   ├── chat/                  # ChatInterface, ChatMessage, PromptSuggestions
│   │   │   ├── documents/             # DocumentList, DocumentUploader, DocumentPreview
│   │   │   ├── citations/             # CitationBadge, CitationCard, CitationViewer
│   │   │   ├── dashboard/             # StatsOverview, ProcessingStatusCard, RecentDocuments
│   │   │   ├── layout/                # Sidebar, Header, AppLayout
│   │   │   └── ui/                    # Button, Card, Badge, Modal, ProgressBar, Icons
│   │   ├── hooks/                     # useChat.ts, useDocuments.ts, useResearch.ts
│   │   ├── lib/                       # utils.ts, constants.ts
│   │   ├── services/                  # Typed API & SSE streaming client (api.ts)
│   │   └── types/                     # DocumentItem, NavigationTab, ProcessingJob
│   ├── package.json
│   └── tsconfig.json
│
├── backend/                           # FastAPI, SQLAlchemy, LangGraph, Groq AI
│   ├── app/
│   │   ├── main.py                    # Application entry point, CORS, lifespan
│   │   ├── api/
│   │   │   ├── routes/                # documents.py, chat.py, agents.py, health.py
│   │   │   └── dependencies.py        # Database session dependency
│   │   ├── core/
│   │   │   ├── config.py              # Pydantic BaseSettings, dynamic .env resolution
│   │   │   ├── security.py            # Prompt injection sanitizer, path traversal guard
│   │   │   └── logging.py             # Structured application logging
│   │   ├── database/                  # SQLAlchemy models (pgvector), session, repositories
│   │   ├── ingestion/                 # PyMuPDF, python-docx, pandas loaders & chunker
│   │   ├── embeddings/                # SentenceTransformers (all-MiniLM-L6-v2)
│   │   ├── retrieval/                 # Semantic search, BM25 search, RRF fusion, Cross-Encoder
│   │   ├── agents/                    # Discrete LangGraph Agents
│   │   │   ├── state.py               # AgentState TypedDict
│   │   │   ├── supervisor.py          # Query analysis & routing agent
│   │   │   ├── researcher.py          # Deep investigation agent
│   │   │   ├── comparator.py          # Cross-document comparison agent
│   │   │   ├── summarizer.py          # Structured executive summary agent
│   │   │   ├── verifier.py            # Hallucination audit & citation verifier
│   │   │   └── workflow.py            # Compiled LangGraph state machine
│   │   ├── llm/
│   │   │   ├── provider.py            # Groq client with dynamic model failover
│   │   │   ├── prompts.py             # System prompt templates
│   │   │   └── response.py            # SSE stream event models & citation parser
│   │   ├── services/                  # Decoupled Business Logic
│   │   │   ├── document_service.py    # Document upload & ingestion orchestrator
│   │   │   ├── chat_service.py        # Chat & streaming generator service
│   │   │   └── agent_service.py       # Autonomous research & comparison service
│   │   └── schemas/                   # Pydantic request/response validation schemas
│   ├── migrations/                    # Alembic database migration environment
│   │   ├── versions/                  # Version migration scripts
│   │   ├── env.py
│   │   └── script.py.mako
│   ├── alembic.ini                    # Alembic configuration
│   ├── tests/                         # E2E pipeline integration tests
│   ├── requirements.txt
│   └── run.py                         # Direct backend startup runner
│
├── evaluation/                        # RAG & Agent Evaluation Suite
│   ├── datasets/                      # Benchmark questions and ground-truth passages
│   ├── retrieval_metrics.py           # Recall, Precision, MRR, NDCG implementations
│   ├── rag_evaluation.py              # 4-strategy retrieval benchmark script
│   └── agent_evaluation.py            # Faithfulness and citation precision benchmark
│
├── infrastructure/
│   ├── docker/
│   │   ├── Dockerfile.backend         # Python 3.11-slim production backend container
│   │   └── Dockerfile.frontend        # Multi-stage Node 20 Next.js container
│   └── docker-compose.yml             # PostgreSQL 16 (pgvector), Redis 7, Backend & Frontend
│
├── docs/                              # Project Documentation
│   ├── architecture.md                # System design & mathematical formulations
│   ├── api-documentation.md           # REST & SSE endpoint reference
│   └── development-roadmap.md         # Milestone progress & future initiatives
│
├── .env.example                       # Environment configuration template
├── .gitignore
└── README.md
```

---

## Getting Started

### Prerequisites

- **Python 3.11+**
- **Node.js 20+** and **npm**
- **Docker & Docker Compose** (optional; required if running PostgreSQL with pgvector)
- **Groq API Key** (obtainable from [Groq Console](https://console.groq.com))

---

### Environment Configuration

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Configure your credentials:

```ini
# LLM Provider (Groq AI)
GROQ_API_KEY=gsk_your_groq_api_key_here
GROQ_MODEL=openai/gpt-oss-120b

# Database (SQLite by default; switch to PostgreSQL for pgvector)
DATABASE_URL=sqlite:///./docmind.db
# DATABASE_URL=postgresql://docmind_user:docmind_password@localhost:5432/docmind_db

# Embeddings & Reranking
EMBEDDING_MODEL_NAME=sentence-transformers/all-MiniLM-L6-v2
RERANKER_MODEL_NAME=cross-encoder/ms-marco-MiniLM-L-6-v2
CHUNK_SIZE=800
CHUNK_OVERLAP=120
RRF_K=60
```

---

### Backend Setup

1. Open a terminal and navigate to `backend/`:
   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:
   ```bash
   # Windows PowerShell
   python -m venv venv
   .\venv\Scripts\Activate.ps1

   # Linux / macOS
   python3 -m venv venv
   source venv/bin/activate
   ```

3. Install backend dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Start the FastAPI development server:
   ```bash
   python run.py
   ```
   *The backend will start at `http://127.0.0.1:8000`. Interactive OpenAPI documentation is available at `http://127.0.0.1:8000/docs`.*

---

### Frontend Setup

1. Open a second terminal and navigate to `frontend/`:
   ```bash
   cd frontend
   ```

2. Install frontend dependencies:
   ```bash
   npm install
   ```

3. Start the Next.js development server:
   ```bash
   npm run dev
   ```
   *The frontend will start at `http://localhost:3000`.*

---

### Docker Infrastructure

To launch the full stack with PostgreSQL (pgvector), Redis, FastAPI backend, and Next.js frontend using Docker Compose:

```bash
cd infrastructure
docker-compose up --build -d
```

- **Frontend**: `http://localhost:3000`
- **Backend API**: `http://localhost:8000`
- **PostgreSQL**: `localhost:5432` (`docmind_db`)
- **Redis**: `localhost:6379`

---

## Running Benchmarks & Tests

### 1. End-to-End Pipeline Verification
Execute the automated integration test verifying document ingestion, chunking, vector embedding, hybrid search with RRF, and LangGraph agent inference:

```bash
python backend/tests/test_pipeline_e2e.py
```

### 2. Retrieval Evaluation Suite
Benchmark retrieval strategies (Dense vector, Sparse BM25, RRF, Cross-Encoder):

```bash
python evaluation/rag_evaluation.py
```

### 3. Agent Faithfulness Benchmark
Audit LLM hallucinations and citation precision across test documents:

```bash
python evaluation/agent_evaluation.py
```

---

## API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/documents/upload` | Upload & ingest document (`.pdf`, `.docx`, `.xlsx`, `.csv`, `.txt`, `.md`) |
| `GET` | `/api/documents` | List all ingested documents and processing statuses |
| `GET` | `/api/documents/{id}/preview` | Retrieve physical pages and chunk layout for Document Viewer |
| `DELETE`| `/api/documents/{id}` | Remove document and cascade-delete vector chunks |
| `POST` | `/api/chat` | Synchronous question submission with verifiable citations |
| `POST` | `/api/chat/stream` | Server-Sent Events (SSE) token-by-token response streaming |
| `GET` | `/api/conversations` | Retrieve workspace conversation histories |
| `POST` | `/api/agents/research` | Autonomous multi-step deep research workflow |
| `POST` | `/api/documents/compare` | Cross-document side-by-side reconciliation studio |
| `GET` | `/api/agents/runs/{id}` | Inspect detailed agent step execution trace |
| `GET` | `/api/health` | Service health status and model metadata |

For comprehensive schema definitions and request/response payloads, consult [`docs/api-documentation.md`](file:///c:/AI%20Projects/docminds-ai/docs/api-documentation.md).

---

## Documentation Directory

- **[System Architecture](file:///c:/AI%20Projects/docminds-ai/docs/architecture.md)**: Deep dive into the modular layers, mathematical formulas (Cosine similarity, RRF, Cross-Encoder), and prompt injection security boundaries.
- **[API Documentation](file:///c:/AI%20Projects/docminds-ai/docs/api-documentation.md)**: Complete request and response contract guide.
- **[Development Roadmap](file:///c:/AI%20Projects/docminds-ai/docs/development-roadmap.md)**: Milestone tracking and future enterprise capabilities.

---

## License

This project is licensed under the [MIT License](LICENSE).
