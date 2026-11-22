'use client';

import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { DocumentIcon } from '@/components/ui/Icons';

interface DocumentPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  documentName: string;
  totalChunks?: number;
  previewContent?: string;
}

export function DocumentPreview({
  isOpen,
  onClose,
  documentName,
  totalChunks = 5,
  previewContent,
}: DocumentPreviewProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={documentName}
      subtitle={`Document Viewer • ${totalChunks} Processed Passages`}
      maxWidth="max-w-3xl"
    >
      <div className="space-y-4">
        <div className="flex items-center space-x-2 text-xs text-zinc-400 pb-2 border-b border-zinc-800">
          <DocumentIcon className="w-4 h-4 text-lime-400" />
          <span>Extracted semantic passages stored in vector space:</span>
        </div>
        <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-zinc-200 font-mono whitespace-pre-wrap max-h-[400px] overflow-y-auto leading-relaxed">
          {previewContent || 'Preview content loaded from backend database repository.'}
        </div>
      </div>
    </Modal>
  );
}
