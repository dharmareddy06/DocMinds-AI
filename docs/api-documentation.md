# DocMind AI - API Documentation

The DocMind AI backend is built with FastAPI, providing clear RESTful endpoints and Server-Sent Events (SSE) streaming.

Base URL: `http://localhost:8000/api`

---

## 1. Document Management Endpoints

### Upload Document
- **Endpoint**: `POST /api/documents/upload`
- **Content-Type**: `multipart/form-data`
- **Parameters**:
  - `file`: UploadFile (PDF, DOCX, XLSX, CSV, TXT, MD, max 50MB)
  - `workspace_id`: string (optional, default `"default"`)
- **Response**: `200 OK`
```json
{
  "id": "c1f6b8a2-...",
  "workspace_id": "default",
  "filename": "annual_financial_report_2025.pdf",
  "file_type": "pdf",
  "file_size_bytes": 4404019,
  "status": "completed",
  "chunks_count": 142,
  "created_at": "2026-11-18T10:00:00Z"
}
```

### List Documents
- **Endpoint**: `GET /api/documents`
- **Query Parameters**: `workspace_id` (optional)
- **Response**: `200 OK`
```json
[
  {
    "id": "c1f6b8a2-...",
    "workspace_id": "default",
    "filename": "annual_financial_report_2025.pdf",
    "file_type": "pdf",
    "file_size_bytes": 4404019,
    "status": "completed",
    "chunks_count": 142,
    "created_at": "2026-11-18T10:00:00Z"
  }
]
```

### Get Document Preview
- **Endpoint**: `GET /api/documents/{document_id}/preview`
- **Response**: `200 OK`
```json
{
  "document_id": "c1f6b8a2-...",
  "filename": "annual_financial_report_2025.pdf",
  "file_type": "pdf",
  "total_pages": 12,
  "chunks_count": 142,
  "pages": [
    {
      "page_number": 1,
      "content": "Page text..."
    }
  ]
}
```

### Delete Document
- **Endpoint**: `DELETE /api/documents/{document_id}`
- **Response**: `200 OK` `{"status": "deleted"}`

---

## 2. Conversational RAG & Streaming Endpoints

### Submit Question (Synchronous)
- **Endpoint**: `POST /api/chat`
- **Request Body**:
```json
{
  "message": "What were the primary revenue drivers and risk factors in 2025?",
  "conversation_id": "optional-id",
  "workspace_id": "default"
}
```
- **Response**: `200 OK`
```json
{
  "conversation_id": "conv-101",
  "message_id": "msg-202",
  "answer": "Revenue increased by 18% driven by cloud services expansion...",
  "citations": [
    {
      "document_id": "c1f6b8a2-...",
      "document_name": "annual_financial_report_2025.pdf",
      "page_number": 4,
      "relevant_passage": "Cloud service revenue reached $42M...",
      "relevance_score": 0.94
    }
  ],
  "execution_trace": []
}
```

### Stream Question (Server-Sent Events)
- **Endpoint**: `POST /api/chat/stream`
- **Content-Type**: `text/event-stream`
- **Events**:
  - `event: citations`: JSON array of retrieved passage citations.
  - `event: token`: JSON object `{"token": "word "}` for live typewriter effect.
  - `event: done`: JSON object `{"status": "completed"}`.

### List Conversations
- **Endpoint**: `GET /api/conversations`
- **Query Parameters**: `workspace_id` (optional)

---

## 3. Autonomous Multi-Agent Endpoints

### Deep Research Studio
- **Endpoint**: `POST /api/agents/research`
- **Request Body**:
```json
{
  "topic": "Comprehensive analysis of cross-document debt maturities and compliance covenants",
  "target_document_ids": ["doc-1", "doc-2"],
  "workspace_id": "default"
}
```
- **Response**: Structured multi-section research dossier with sub-query execution traces and citations.

### Document Comparison
- **Endpoint**: `POST /api/documents/compare`
- **Request Body**:
```json
{
  "document_ids": ["doc-1", "doc-2"],
  "aspects": ["Financial Performance", "Liabilities", "Timeline Commitments"]
}
```
- **Response**: Side-by-side comparative matrix highlighting agreements and contradictions.

---

## 4. System Health
- **Endpoint**: `GET /api/health`
- **Response**:
```json
{
  "status": "healthy",
  "llm_provider": "Groq AI (llama-3.3-70b-versatile)",
  "vector_store": "pgvector / SQLite dual-mode",
  "embedding_dim": 384
}
```
