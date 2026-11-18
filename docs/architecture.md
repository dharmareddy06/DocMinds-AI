# DocMind AI - System Architecture

DocMind AI is an enterprise document intelligence and reasoning platform powered by Large Language Models (LLMs) and advanced Retrieval-Augmented Generation (RAG).

---

## 1. High-Level System Architecture

DocMind AI is organized into decoupled layers to ensure that ingestion, vector search, multi-agent orchestration, and frontend presentation remain independently testable and maintainable:

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
│  - Object Storage: storage/documents/                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Ingestion Pipeline

When a document (`.pdf`, `.docx`, `.xlsx`, `.csv`, `.txt`, `.md`) is uploaded:
1. **File Validation**: MIME type and size checks (50 MB limit) prevent path traversal and unsafe payloads.
2. **Text & Table Extraction**:
   - `PyMuPDF` extracts text while preserving physical page boundaries.
   - `python-docx` extracts paragraphs and document runs.
   - `pandas` reads structured spreadsheets into clean markdown tables with preserved column schemas.
3. **Sliding Window Chunking**:
   - Configurable chunk size (800 characters) and overlap (120 characters).
   - Preserves `document_id`, `page_number`, `chunk_index`, and word token counts.
4. **Vector Embeddings**:
   - Encodes text with `sentence-transformers/all-MiniLM-L6-v2` (384-dimensional dense vectors).
   - Batch-processed with deterministic fallback for offline sandboxed testing.
5. **Database Persistence**:
   - Chunks and dense vectors are persisted into the `document_chunks` table.

---

## 3. Hybrid Retrieval & Reranking Engine

To overcome the blind spots of purely semantic vector search or purely keyword search:

### A. Dense Semantic Search
- Evaluates cosine distance between query vector and chunk embeddings:
  $$\text{Cosine Similarity}(u, v) = \frac{u \cdot v}{\|u\|_2 \|v\|_2}$$
- On PostgreSQL, uses pgvector native cosine distance operator (`<=>`).

### B. BM25 Keyword Search
- Indexes exact matches, acronyms, product identifiers, and numerical tables using term frequency and inverse document frequency.

### C. Reciprocal Rank Fusion (RRF)
- Merges ranked lists from both vector search and BM25 search without needing score calibration:
  $$RRF(d) = \sum_{i=1}^n \frac{1}{k + \text{rank}_i(d)}, \quad k = 60$$

### D. Cross-Encoder Reranking
- The top-K candidates from RRF are fed into a cross-encoder (`ms-marco-MiniLM-L-6-v2`), evaluating the full attention matrix between query and passage to eliminate irrelevant candidates.

---

## 4. LangGraph Multi-Agent Workflow

Multi-agent reasoning is decoupled from basic retrieval:
1. **Supervisor Node**: Analyzes user intent, checks whether single-document or cross-document reasoning is needed, and prepares retrieval sub-queries.
2. **Retriever Node**: Invokes the hybrid retrieval engine with reranking.
3. **Generator Node**: Generates a comprehensive, structured response grounded exclusively on retrieved passages using Groq AI (`llama-3.3-70b-versatile`).
4. **Verifier Node**: Evaluates generated claims against source passages, flagging potential hallucinations and compiling verifiable citations with exact page numbers.

---

## 5. Security & Prompt Injection Defense

- **Untrusted Context Isolation**: Retrieved document passages are delimited and wrapped with strict system guardrails instructing the model to treat document contents as reference data rather than executable instructions.
- **Path Traversal Protection**: Uploaded filenames are sanitized and stored under UUID paths.
- **Workspace Isolation**: Database queries enforce `workspace_id` filtering on all retrieval and document management operations.
