'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { DocumentIcon, TrashIcon, EyeIcon } from '@/components/ui/Icons';
import { DocumentItem } from '@/types';

interface DocumentListProps {
  documents: DocumentItem[];
  onSelectDocument?: (doc: DocumentItem) => void;
  onDeleteDocument?: (id: string) => void;
}

export function DocumentList({
  documents,
  onSelectDocument,
  onDeleteDocument,
}: DocumentListProps) {
  if (documents.length === 0) {
    return (
      <div className="text-center py-12 text-zinc-500 text-sm">
        No documents uploaded yet. Upload a document above to get started.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {documents.map((doc) => (
        <Card
          key={doc.id}
          className="p-4 border-zinc-800 bg-zinc-900/60 hover:border-lime-500/40 transition-all duration-200"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-lg bg-zinc-800 flex items-center justify-center text-lime-400">
                <DocumentIcon className="w-5 h-5" />
              </div>
              <div className="overflow-hidden">
                <div className="text-sm font-semibold text-white truncate max-w-[170px]">
                  {doc.name}
                </div>
                <div className="text-xs text-zinc-400">{doc.size}</div>
              </div>
            </div>
            <Badge
              variant="outline"
              className={
                doc.status === 'ready'
                  ? 'bg-lime-950/30 text-lime-400 border-lime-500/30'
                  : 'bg-zinc-800 text-zinc-400 border-zinc-700'
              }
            >
              {doc.status}
            </Badge>
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500">
            <span>{doc.chunksCount || 0} chunks</span>
            <div className="flex items-center space-x-1">
              {onSelectDocument && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onSelectDocument(doc)}
                  className="h-7 px-2 text-zinc-400 hover:text-white"
                >
                  <EyeIcon className="w-3.5 h-3.5 mr-1" />
                  View
                </Button>
              )}
              {onDeleteDocument && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onDeleteDocument(doc.id)}
                  className="h-7 px-2 text-zinc-500 hover:text-red-400"
                >
                  <TrashIcon className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
