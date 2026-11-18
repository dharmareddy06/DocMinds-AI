import { DocumentItem, FileExtension } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export interface BackendDocument {
  id: string;
  filename: string;
  file_type: string;
  file_size_bytes: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  total_pages: number;
  chunks_count: number;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface CitationItem {
  document_id: string;
  document_name: string;
  page_number?: number;
  relevant_passage: string;
  relevance_score: number;
}

export interface ChatResponseData {
  conversation_id: string;
  message_id: string;
  answer: string;
  citations: CitationItem[];
  execution_trace?: Record<string, unknown>[];
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function mapBackendDoc(doc: BackendDocument): DocumentItem {
  const statusMap: Record<string, 'ready' | 'processing' | 'queued' | 'failed'> = {
    completed: 'ready',
    processing: 'processing',
    pending: 'queued',
    failed: 'failed'
  };

  return {
    id: doc.id,
    name: doc.filename,
    size: formatBytes(doc.file_size_bytes),
    sizeBytes: doc.file_size_bytes,
    type: (doc.file_type.toLowerCase() || 'pdf') as FileExtension,
    uploadedAt: new Date(doc.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    status: statusMap[doc.status] || 'ready',
    chunksCount: doc.chunks_count,
    vectorCount: doc.chunks_count,
    tokensProcessed: doc.chunks_count * 150
  };
}

export const api = {
  async listDocuments(): Promise<DocumentItem[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/documents`);
      if (!res.ok) throw new Error('Failed to fetch documents');
      const docs: BackendDocument[] = await res.json();
      return docs.map(mapBackendDoc);
    } catch {
      return [];
    }
  },

  async uploadDocument(file: File): Promise<DocumentItem | null> {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_BASE_URL}/documents/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      throw new Error('Upload failed');
    }

    const doc: BackendDocument = await res.json();
    return mapBackendDoc(doc);
  },

  async deleteDocument(documentId: string): Promise<boolean> {
    const res = await fetch(`${API_BASE_URL}/documents/${documentId}`, {
      method: 'DELETE',
    });
    return res.ok;
  },

  async submitChat(message: string, conversationId?: string): Promise<ChatResponseData> {
    const res = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        conversation_id: conversationId,
      }),
    });

    if (!res.ok) {
      throw new Error('Chat request failed');
    }

    return await res.json();
  },

  async checkHealth(): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/health`);
      return res.ok;
    } catch {
      return false;
    }
  }
};
