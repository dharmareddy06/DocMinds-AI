# DocMind AI

> **Enterprise-grade Document Intelligence and Multi-Agent Reasoning Platform powered by Groq Llama 3.3 70B, LangGraph, and Hybrid RAG with Verifiable Citations.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2015-black.svg?logo=next.js&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB.svg?logo=python&logoColor=white)](https://www.python.org)
[![Groq](https://img.shields.io/badge/LLM-Groq%20Llama%203.3%2070B-F05032.svg)](https://groq.com)
[![LangGraph](https://img.shields.io/badge/Orchestration-LangGraph-1C3C3C.svg)](https://langchain-ai.github.io/langgraph/)
[![pgvector](https://img.shields.io/badge/Vector%20Store-PostgreSQL%20%2B%20pgvector-336791.svg?logo=postgresql&logoColor=white)](https://github.com/pgvector/pgvector)

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
  - **Local/Test Mode**: Transparent fallback to SQLite + vectorized in-memory cosine similarity (zero external dependencies required for immediate testing).
- **Hybrid Search Engine**: Merges dense embeddings (`sentence-transformers/all-MiniLM-L6-v2`, 384 dimensions) with sparse BM25 keyword retrieval.
- **Reciprocal Rank Fusion (RRF)**: Calibrates ranking scores using $RRF(d) = \sum_{i=1}^{n} \frac{1}{k + \text{rank}_i(d)}$ ($k=60$).
- **Cross-Encoder Reranking**: Evaluates full cross-attention between user query and candidate passages using `cross-encoder/ms-marco-MiniLM-L-6-v2`.
- **LangGraph Multi-Agent Orchestration**:
  - `Supervisor Agent`: Intent recognition, sub-query generation, and dynamic routing.
  - `Retriever Agent`: Decoupled hybrid retrieval interface.
  - `Generator Agent`: Context-grounded synthesis via Groq AI (`llama-3.3-70b-versatile`).
  - `Verifier Agent`: Post-generation hallucination audit verifying each claim against retrieved evidence.
- **Real-Time Streaming Chat (SSE)**: Token-by-token response streaming via Server-Sent Events with abortable controls and typewriter UI.
- **Verifiable Citations with Page Jumping**: Click any cited passage in Chat, Research Studio, or Comparison Studio to jump directly to the exact source page in the built-in Document Viewer.
- **Deep Research Studio**: Multi-step investigative breakdown for complex, open-ended workspace questions.
- **Document Comparison Studio**: Side-by-side reconciliation of financial metrics, technical specifications, and contractual obligations.
- **Agent & Pipeline Monitor**: Real-time pipeline health telemetry and Section 7D empirical retrieval benchmark matrix.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Presentation Layer                        │
│          Next.js App Router (TypeScript, Tailwind)          │
│   Dashboard | Documents | Chat | Research | Compare | Viewer│
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / SSE Streaming
┌──────────────────────────────▼──────────────────────────────┐
│                       API Layer                             │
│                  FastAPI Web Service                        │
│   /api/documents | /api/chat | /api/agents | /api/health   │
└──────────────┬───────────────────────────────┬──────────────┘
               │                               │
┌──────────────▼─────────────┐   ┌─────────────▼──────────────┐
│  Document Ingestion Engine │   │   Retrieval & Ranking      │
│  - PyMuPDF, python-docx    │   │   - pgvector Semantic      │
│  - pandas Tabular Parsing  │   │   - BM25 Keyword Search    │
│  - Sliding Window Chunking │   │   - RRF Fusion (k=60)      │
│  - SentenceTransformers    │   │   - Cross-Encoder Rerank   │
└──────────────┬─────────────┘   └─────────────┬──────────────┘
               │                               │
┌──────────────▼───────────────────────────────▼──────────────┐
│                    Agent & LLM Layer                        │
│  - LangGraph State Machine Workflow                         │
│  - Nodes: Supervisor -> Retriever -> Generator -> Verifier  │
│  - Groq AI (Llama 3.3 70B Versatile, sub-second latency)   │
│  - Verifiable Page-Number Citations                         │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                      Storage Layer                          │
│  - PostgreSQL + pgvector (Docker Compose production)        │
│  - SQLite Fallback (Local zero-dependency testing)          │
│  - File Storage: storage/documents/                         │
└─────────────────────────────────────────────────────────────┘
```

---

## Multi-Agent LangGraph Workflow

Rather than treating RAG as a simple single-turn prompt injection, DocMind orchestrates a decoupled state graph:

```mermaid
graph TD
    User([User Query]) --> Supervisor[Supervisor Agent]
    Supervisor -->|Sub-queries| Retriever[Hybrid Retriever]
    Retriever -->|Dense + BM25 + RRF + Reranker| Context[Ranked Context Passages]
    Context --> Generator[Groq LLM Generator]
    Generator -->|Draft Synthesis| Verifier[Citation Verifier]
    Verifier -->|Audit Grounding & Align Citations| FinalAnswer([Grounded Response + Page Citations])
```

1. **Supervisor**: Classifies query complexity, extracts entities, and formulates targeted retrieval queries.
2. **Retriever**: Calls the hybrid search service (independent of agent code).
3. **Generator**: Synthesizes a structured response strictly constrained to the retrieved context.
4. **Verifier**: Audits generated claims against the retrieved passages, pruning ungrounded claims and attaching verified page citations.

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
- **RRF Merge**: Combines rank distributions without arbitrary score normalization:
  $$RRF(d) = \sum_{i=1}^{n} \frac{1}{60 + \text{rank}_i(d)}$$
- **Cross-Encoder Rescoring**: Eliminates false positives by evaluating joint sentence-pair attention.

---

## Empirical Evaluation Suite

DocMind includes a standardized evaluation harness ([`evaluation/`](file:///c:/AI%20Projects/docminds-ai/evaluation)) implementing Section 7D metrics across 4 retrieval strategies:

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
- **Faithfulness & Citation Precision**: Automated LLM verification ensuring generated answers make no unsupported assertions.

---

## Repository Structure

```
docminds-ai/
├── frontend/                          # Next.js App Router, TypeScript, Tailwind CSS
│   ├── src/
│   │   ├── app/                       # Page layouts & client routing
│   │   ├── components/
│   │   │   ├── dashboard/             # Overview, ChatView, ResearchView, ComparisonView,
│   │   │   │                          # AgentMonitorView, DocumentViewerModal, UploadSection
│   │   │   ├── layout/                # Sidebar, Header, AppLayout
│   │   │   └── ui/                    # Button, Card, Badge, Modal, ProgressBar, Icons
│   │   ├── services/                  # Typed API & SSE streaming client (api.ts)
│   │   └── types/                     # Navigation, DocumentItem, Job types
│   ├── package.json
│   ├── tailwind.config.ts
│   └── tsconfig.json
│
├── backend/                           # FastAPI, SQLAlchemy, LangGraph, Groq AI
│   ├── app/
│   │   ├── main.py                    # Application entry point, CORS, lifespan
│   │   ├── api/
│   │   │   ├── routes/                # documents.py, chat.py, agents.py, health.py
│   │   │   └── dependencies.py        # Database session dependency
│   │   ├── core/                      # Config, settings, logging
│   │   ├── database/                  # SQLAlchemy models (pgvector), session, repositories
│   │   ├── ingestion/                 # PyMuPDF, python-docx, pandas loaders & chunker
│   │   ├── embeddings/                # SentenceTransformers (all-MiniLM-L6-v2)
│   │   ├── retrieval/                 # Semantic search, BM25 search, RRF fusion, Cross-Encoder
│   │   ├── agents/                    # LangGraph workflow, state, supervisor, verifier
│   │   ├── llm/                       # Groq client, prompt engineering, injection guards
│   │   └── schemas/                   # Pydantic validation schemas
│   ├── tests/                         # E2E pipeline integration tests
│   └── requirements.txt
│
├── evaluation/                        # RAG & Agent Evaluation Suite
│   ├── datasets/                      # Benchmark questions and ground-truth passages
│   ├── retrieval_metrics.py           # Recall, Precision, MRR, NDCG implementations
│   ├── rag_evaluation.py              # 4-strategy retrieval benchmark script
│   └── agent_evaluation.py            # Faithfulness and citation precision benchmark
│
├── infrastructure/
│   ├── docker-compose.yml             # PostgreSQL 16 (pgvector) & Redis 7
│   └── docker/
│
├── docs/                              # Project Documentation
│   ├── architecture.md                # System design & mathematical formulations
│   ├── api-documentation.md           # REST & SSE endpoint reference
│   ├── development-roadmap.md         # Milestone progress & future initiatives
│   └── details.md                     # Initial product requirement specification
│
├── .env.example                       # Environment configuration template
├── .gitignore
└── README.md
```

---

## Getting Started

### Prerequisites

- **Python 3.11+**
- **Node.js 18+** and **npm**
- **Docker & Docker Compose** (optional; required only if running PostgreSQL with pgvector)
- **Groq API Key** (obtainable from [Groq Console](https://console.groq.com))

---

### Environment Configuration

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Configure the following variables:

```env
# Application Settings
APP_NAME=DocMind-AI
DEBUG=True
API_V1_PREFIX=/api

# Groq AI Provider
GROQ_API_KEY=gsk_your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile

# Embeddings & Reranking
EMBEDDING_MODEL_NAME=sentence-transformers/all-MiniLM-L6-v2
EMBEDDING_DIMENSION=384
RERANKER_MODEL_NAME=cross-encoder/ms-marco-MiniLM-L-6-v2
RRF_K=60

# Database Configuration (Defaults to SQLite for instant local testing)
DATABASE_URL=sqlite:///./docmind.db

# If using PostgreSQL + pgvector via Docker Compose:
# DATABASE_URL=postgresql://docmind_user:docmind_password@localhost:5432/docmind_db
```

---

### Backend Setup

1. Create and activate a Python virtual environment:
   ```bash
   cd backend
   python -m venv venv
   
   # Windows:
   .\venv\Scripts\activate
   
   # Linux/macOS:
   source venv/bin/activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Start the FastAPI development server:
   ```bash
   uvicorn backend.app.main:app --reload --port 8000
   ```
   Interactive Swagger docs will be available at `http://localhost:8000/docs`.

---

### Frontend Setup

1. Open a new terminal and navigate to `frontend/`:
   ```bash
   cd frontend
   npm install
   ```

2. Launch the Next.js development server:
   ```bash
   npm run dev
   ```
   Access the dashboard at `http://localhost:3000`.

---

### Docker Infrastructure (Optional)

To start PostgreSQL with native `pgvector` and Redis:

```bash
cd infrastructure
docker-compose up -d
```

Verify the database container is healthy:
```bash
docker ps
```

---

## Running Benchmarks & Tests

### End-to-End Pipeline Integration Test
Verifies file ingestion, sliding-window chunking, vector generation, database writes, hybrid retrieval, and multi-agent synthesis:
```bash
python backend/tests/test_pipeline_e2e.py
```

### Retrieval Strategy Benchmark (Section 7D)
Evaluates and prints the Recall@K, Precision@K, MRR, and NDCG@K comparison across Vector, BM25, Hybrid, and Reranked modes:
```bash
python evaluation/rag_evaluation.py
```

### Faithfulness & Citation Evaluation
Evaluates hallucination rates and source alignment:
```bash
python evaluation/agent_evaluation.py
```

### Frontend Code Quality
```bash
cd frontend
# TypeScript type check
npx tsc --noEmit

# ESLint verification
npm run lint
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
- **[Technical Specifications](file:///c:/AI%20Projects/docminds-ai/docs/details.md)**: Original project requirements and specifications.

---

## License

This project is licensed under the [MIT License](LICENSE).
