'use client';

import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { DocumentIcon, SparklesIcon } from '@/components/ui/Icons';

interface CitationViewerProps {
  isOpen: boolean;
  onClose: () => void;
  documentName: string;
  pageNumber: number;
  passage: string;
  fullContent?: string;
}

export function CitationViewer({
  isOpen,
  onClose,
  documentName,
  pageNumber,
  passage,
  fullContent,
}: CitationViewerProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={documentName}
      subtitle={`Verified Evidence Source • Page ${pageNumber}`}
      maxWidth="max-w-3xl"
    >
      <div className="space-y-4">
        <div className="p-3.5 rounded-lg bg-lime-950/20 border border-lime-500/30 flex items-start space-x-3">
          <SparklesIcon className="w-5 h-5 text-lime-400 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-semibold text-lime-400 mb-1">
              Cited Evidence Passage
            </div>
            <p className="text-sm text-zinc-200 italic leading-relaxed">
              &ldquo;{passage}&rdquo;
            </p>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800">
          <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
            Page Context ({pageNumber})
          </div>
          <div className="text-sm text-zinc-300 font-mono whitespace-pre-wrap leading-relaxed max-h-[350px] overflow-y-auto">
            {fullContent || passage}
          </div>
        </div>
      </div>
    </Modal>
  );
}
