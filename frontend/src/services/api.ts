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

export interface DocumentPagePreviewData {
  page_number: number;
  content: string;
  chunks_count: number;
}

export interface DocumentPreviewData {
  document_id: string;
  filename: string;
  file_type: string;
  file_size_bytes: number;
  total_pages: number;
  chunks_count: number;
  pages: DocumentPagePreviewData[];
}

export interface ResearchResultData {
  id: string;
  agent_type: string;
  status: string;
  input_query: string;
  output_result: string;
  citations: CitationItem[];
  execution_trace?: {
    steps: Record<string, unknown>[];
    sub_queries: string[];
  };
}

export interface ComparisonResultData {
  id: string;
  agent_type: string;
  status: string;
  document_ids: string[];
  documents_compared: string[];
  comparison_result: string;
  citations: CitationItem[];
  trace?: Record<string, unknown>[];
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

  async getDocumentPreview(documentId: string): Promise<DocumentPreviewData> {
    const res = await fetch(`${API_BASE_URL}/documents/${documentId}/preview`);
    if (!res.ok) {
      throw new Error('Failed to fetch document preview');
    }
    return await res.json();
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

  async runResearch(topic: string, targetDocIds?: string[]): Promise<ResearchResultData> {
    const res = await fetch(`${API_BASE_URL}/agents/research`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic,
        target_document_ids: targetDocIds,
      }),
    });

    if (!res.ok) {
      throw new Error('Research inquiry failed');
    }

    return await res.json();
  },

  async compareDocuments(documentIds: string[], aspects?: string[]): Promise<ComparisonResultData> {
    const res = await fetch(`${API_BASE_URL}/documents/compare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        document_ids: documentIds,
        aspects: aspects,
      }),
    });

    if (!res.ok) {
      throw new Error('Document comparison failed');
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
  },

  streamChat(
    message: string,
    onToken: (token: string) => void,
    onCitations: (citations: CitationItem[]) => void,
    onComplete: () => void,
    onError: (err: Error) => void,
    conversationId?: string,
    workspaceId?: string
  ): () => void {
    const controller = new AbortController();

    fetch(`${API_BASE_URL}/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        conversation_id: conversationId,
        workspace_id: workspaceId,
      }),
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Streaming failed: HTTP ${response.status}`);
        }
        if (!response.body) {
          throw new Error('No readable stream in response body');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let currentEvent = 'message';

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            onComplete();
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            if (trimmed.startsWith('event:')) {
              currentEvent = trimmed.replace('event:', '').trim();
            } else if (trimmed.startsWith('data:')) {
              const dataStr = trimmed.replace('data:', '').trim();
              try {
                const parsed = JSON.parse(dataStr);
                if (currentEvent === 'citations' && Array.isArray(parsed)) {
                  onCitations(parsed as CitationItem[]);
                } else if (currentEvent === 'token' && parsed.token) {
                  onToken(parsed.token);
                } else if (currentEvent === 'done') {
                  onComplete();
                  return;
                }
              } catch {
                // If text token directly
                if (currentEvent === 'token') {
                  onToken(dataStr);
                }
              }
            }
          }
        }
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          onError(err);
        }
      });

    return () => controller.abort();
  },

  getDocuments: async (): Promise<DocumentItem[]> => {
    return api.listDocuments();
  },

  startResearch: async (query: string): Promise<{ findings: string; citations: CitationItem[]; execution_trace: any[] }> => {
    const res = await api.runResearch(query);
    return {
      findings: res.output_result,
      citations: res.citations || [],
      execution_trace: (res.execution_trace?.steps as any[]) || []
    };
  }
};
