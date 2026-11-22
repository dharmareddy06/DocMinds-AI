import { useState, useEffect, useCallback } from 'react';
import { api } from '@/services/api';
import { DocumentItem } from '@/types';

export function useDocuments() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const docs = await api.getDocuments();
      if (docs && docs.length > 0) {
        setDocuments(
          docs.map((d: any) => ({
            id: d.id,
            name: d.filename,
            size: `${(d.file_size / (1024 * 1024)).toFixed(1)} MB`,
            sizeBytes: d.file_size,
            type: d.filename.split('.').pop() || 'pdf',
            uploadedAt: 'Recent',
            status: d.status === 'completed' ? 'ready' : d.status,
            chunksCount: d.chunks_count || 5,
            vectorCount: d.chunks_count || 5,
            tokensProcessed: (d.chunks_count || 5) * 600,
          }))
        );
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const deleteDocument = useCallback(async (id: string) => {
    try {
      await api.deleteDocument(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    } catch (err: any) {
      setError(err.message || 'Failed to delete document');
    }
  }, []);

  return {
    documents,
    isLoading,
    error,
    refreshDocuments: fetchDocuments,
    deleteDocument,
  };
}
