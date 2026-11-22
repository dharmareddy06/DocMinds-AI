'use client';

import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { DocumentUploader } from '@/components/documents/DocumentUploader';
import { DocumentList } from '@/components/documents/DocumentList';
import { DocumentPreview } from '@/components/documents/DocumentPreview';
import { useDocuments } from '@/hooks/useDocuments';
import { DocumentItem } from '@/types';

export default function DocumentsPage() {
  const { documents, refreshDocuments, deleteDocument } = useDocuments();
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);

  return (
    <AppLayout
      activeTab="documents"
      onTabChange={(tab) => {
        window.location.href = tab === 'dashboard' ? '/dashboard' : `/${tab}`;
      }}
    >
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-white">Document Management</h2>
          <p className="text-sm text-zinc-400 mt-1">
            Upload, inspect semantic chunks, and manage enterprise knowledge corpus.
          </p>
        </div>

        <DocumentUploader onUploadSuccess={refreshDocuments} />

        <div className="pt-2">
          <h3 className="text-sm font-semibold text-zinc-300 mb-3">
            Indexed Documents ({documents.length})
          </h3>
          <DocumentList
            documents={documents}
            onSelectDocument={(doc) => setSelectedDoc(doc)}
            onDeleteDocument={deleteDocument}
          />
        </div>

        {selectedDoc && (
          <DocumentPreview
            isOpen={!!selectedDoc}
            onClose={() => setSelectedDoc(null)}
            documentName={selectedDoc.name}
            totalChunks={selectedDoc.chunksCount}
          />
        )}
      </div>
    </AppLayout>
  );
}
