# DocMind AI 

> **Intelligent, Agentic Document Intelligence Platform powered by Groq and Advanced Hybrid RAG.**

DocMind AI is an enterprise document intelligence and multi-agent reasoning platform. Upload research papers, financial reports, technical manuals, contracts, and datasets to ask complex multi-document questions, compare findings, detect contradictions, and generate executive summaries with **verifiable, page-level citations**.

---

## Key Capabilities

- **Intelligent Multi-Format Ingestion**: Automated parsing for PDF (PyMuPDF), DOCX (python-docx), CSV/Excel (pandas), TXT, and Markdown preserving page numbers and tabular structure.
- **Hybrid Search Engine**: Combines **pgvector semantic search** (Sentence Transformers embeddings) and **BM25 full-text keyword retrieval**.
- **Reciprocal Rank Fusion (RRF)**: Merges disparate vector and lexical rankings using $RRF(d) = \sum \frac{1}{k + rank(d)}$ ($k=60$).
- **Cross-Encoder Reranking**: Re-scores candidate passages against the query using `ms-marco-MiniLM-L-6-v2`.
- **LangGraph Multi-Agent Architecture**:
  - **Supervisor Agent**: User intent classification and dynamic query routing.
  - **Retriever Agent**: Decoupled hybrid retrieval execution.
  - **Generator / Specialist Agent**: Context-grounded synthesis (QA, Document Comparison, Executive Summaries).
  - **Verifier Agent**: Audits factual claims against retrieved passages to prevent hallucinations.
- **Verifiable Citations**: Every claim is linked to source document name, page number, and original excerpt.
- **High-Speed Inference**: Powered by **Groq AI** (`llama-3.3-70b-versatile` / `llama3-70b-8192`) with streaming Server-Sent Events (SSE).
- **Clean SaaS Frontend**: Modern, responsive interface built with Next.js (App Router), TypeScript, and Tailwind CSS.

---

## Architecture

```
docmind-ai/
├── frontend/                     # Next.js App Router, TypeScript, Tailwind CSS
│   ├── src/
│   │   ├── app/                  # Layout, pages, routing
│   │   ├── components/           # UI components, layout, dashboard widgets
│   │   ├── services/             # Typed API client
│   │   └── types/                # Domain type definitions
│   └── package.json
│
├── backend/                      # FastAPI, SQLAlchemy, LangGraph, Sentence Transformers
│   ├── app/
│   │   ├── main.py               # FastAPI entry point & CORS
│   │   ├── api/routes/           # Document, Chat, Agent, and Health routes
│   │   ├── core/                 # Config, settings, logging
│   │   ├── database/             # Models (pgvector), session, repositories
│   │   ├── ingestion/            # File extractors, loaders, semantic chunker
│   │   ├── embeddings/           # SentenceTransformers embedding service
│   │   ├── retrieval/            # Semantic search, BM25 keyword search, RRF fusion, Cross-Encoder
│   │   ├── agents/               # LangGraph workflow, state, supervisor, verifier
│   │   ├── llm/                  # Groq client, prompt engineering
│   │   └── schemas/              # Pydantic validation schemas
│   ├── tests/                    # E2E pipeline & integration tests
│   └── requirements.txt
│
└── infrastructure/
    └── docker-compose.yml        # PostgreSQL (pgvector) & Redis
```

---

## Quick Start

### 1. Prerequisites
- Python 3.11+
- Node.js 18+ & npm
- Docker & Docker Compose (optional, for PostgreSQL + pgvector)

### 2. Environment Setup
Copy the example environment configuration:
```bash
cp .env.example .env
```
Add your **Groq API key**:
```env
GROQ_API_KEY=gsk_your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile
```

### 3. Start Database Services (Optional)
```bash
cd infrastructure
docker-compose up -d
```
*(DocMind automatically falls back to local SQLite if PostgreSQL is not running).*

### 4. Backend Setup
```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
uvicorn backend.app.main:app --reload --port 8000
```
API Documentation will be live at `http://localhost:8000/docs`.

### 5. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000` to access the dashboard.

---

## Testing

Run the end-to-end pipeline verification test (validates database, ingestion, RRF hybrid retrieval, and multi-agent workflow):
```bash
python backend/tests/test_pipeline_e2e.py
```

---

## License
MIT License.
