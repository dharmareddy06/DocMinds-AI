'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { FileTextIcon } from '@/components/ui/Icons';
import { api, DocumentPreviewData } from '@/services/api';

interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId?: string | null;
  documentName?: string;
  initialPage?: number;
  highlightText?: string;
}

export function DocumentViewerModal({
  isOpen,
  onClose,
  documentId,
  documentName,
  initialPage = 1,
  highlightText,
}: DocumentViewerModalProps) {
  const [selectedPage, setSelectedPage] = useState<number | null>(null);
  const [previewData, setPreviewData] = useState<DocumentPreviewData | null>(null);

  const currentPage = selectedPage ?? initialPage;

  useEffect(() => {
    let active = true;
    if (isOpen && documentId) {
      api.getDocumentPreview(documentId)
        .then((data) => {
          if (active) {
            setPreviewData(data);
          }
        })
        .catch(() => {
          if (active) {
            setPreviewData(null);
          }
        });
    }
    return () => {
      active = false;
    };
  }, [isOpen, documentId]);

  if (!isOpen) return null;

  const isLoading = Boolean(isOpen && documentId && previewData?.document_id !== documentId);
  const totalPages = previewData?.total_pages || 1;
  const activePageContent = previewData?.pages?.find((p) => p.page_number === currentPage)?.content ||
    (previewData?.pages && previewData.pages.length > 0 ? previewData.pages[0].content : 'No page content available.');

  const handleClose = () => {
    setSelectedPage(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        <div className="flex items-center gap-2">
          <FileTextIcon size={18} className="text-neutral-500" />
          <span className="truncate max-w-sm sm:max-w-md">
            {previewData?.filename || documentName || 'Document Viewer'}
          </span>
        </div>
      }
      description={
        previewData
          ? `${previewData.file_type.toUpperCase()} • ${totalPages} page(s) • ${previewData.chunks_count} semantic chunk(s)`
          : 'Inspect extracted document pages and verified citation evidence.'
      }
      maxWidth="xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-1.5 text-xs text-neutral-500">
            <button
              onClick={() => setSelectedPage((p) => Math.max(1, (p ?? initialPage) - 1))}
              disabled={currentPage <= 1}
              className="px-2 py-1 rounded border border-neutral-200 dark:border-neutral-800 disabled:opacity-40 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              Previous
            </button>
            <span className="font-mono text-[11px] px-2">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setSelectedPage((p) => Math.min(totalPages, (p ?? initialPage) + 1))}
              disabled={currentPage >= totalPages}
              className="px-2 py-1 rounded border border-neutral-200 dark:border-neutral-800 disabled:opacity-40 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              Next
            </button>
          </div>
          <Button variant="outline" size="sm" onClick={handleClose}>
            Close
          </Button>
        </div>
      }
    >
      <div className="space-y-3">
        {/* Highlight Banner if citation is focused */}
        {highlightText && (
          <div className="p-2.5 rounded-lg bg-lime-400/10 border border-lime-400/40 text-xs text-lime-900 dark:text-lime-300 shadow-[0_0_12px_rgba(163,230,53,0.15)]">
            <span className="font-semibold block text-[10px] uppercase tracking-wider mb-0.5 text-lime-600 dark:text-lime-400">
              Cited Evidence Passage
            </span>
            <p className="italic line-clamp-3">
              &ldquo;{highlightText}&rdquo;
            </p>
          </div>
        )}

        {/* Content Viewer */}
        <div className="p-4 rounded-lg bg-neutral-50 dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-800 max-h-[50vh] overflow-y-auto font-mono text-xs text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap leading-relaxed select-text">
          {isLoading ? (
            <div className="py-12 text-center text-neutral-400">
              Loading document text...
            </div>
          ) : (
            activePageContent
          )}
        </div>
      </div>
    </Modal>
  );
}
