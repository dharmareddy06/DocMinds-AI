'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  FileTextIcon,
  Trash2Icon,
  SearchIcon,
  SparklesIcon,
} from '@/components/ui/Icons';
import { DocumentItem, DocumentStatus } from '@/types';

interface RecentDocumentsProps {
  documents: DocumentItem[];
  onStartChatWithDoc: (doc: DocumentItem) => void;
  onDeleteDoc: (docId: string) => void;
  onOpenViewer?: (docId: string, page?: number) => void;
}

export function RecentDocuments({
  documents,
  onStartChatWithDoc,
  onDeleteDoc,
  onOpenViewer,
}: RecentDocumentsProps) {
  const [filter, setFilter] = useState<'all' | 'ready' | 'processing'>('all');
  const [search, setSearch] = useState('');

  const filteredDocuments = documents.filter((doc) => {
    const matchesFilter =
      filter === 'all'
        ? true
        : filter === 'ready'
        ? doc.status === 'ready'
        : doc.status === 'processing' || doc.status === 'queued';

    const matchesSearch = doc.name.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (status: DocumentStatus) => {
    switch (status) {
      case 'ready':
        return (
          <Badge variant="success" size="sm" dot>
            Indexed
          </Badge>
        );
      case 'processing':
        return (
          <Badge variant="warning" size="sm" dot pulse>
            Processing
          </Badge>
        );
      case 'queued':
        return (
          <Badge variant="neutral" size="sm">
            Queued
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="danger" size="sm">
            Failed
          </Badge>
        );
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle>Documents</CardTitle>
              <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500">
                {documents.length}
              </span>
            </div>
            <CardDescription>
              Verified repository of ingested documents and embeddings.
            </CardDescription>
          </div>

          {/* Search and simple filter buttons */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <SearchIcon size={13} className="absolute left-2.5 top-2 text-neutral-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter..."
                className="pl-7 pr-2.5 py-1 text-xs rounded-md bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-neutral-400 w-32 sm:w-36"
              />
            </div>

            <div className="flex items-center rounded-md bg-neutral-100 dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 p-0.5 text-xs">
              <button
                onClick={() => setFilter('all')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-neutral-950 text-lime-400 dark:bg-neutral-800 dark:text-lime-400 shadow-2xs'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('ready')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  filter === 'ready'
                    ? 'bg-neutral-950 text-lime-400 dark:bg-neutral-800 dark:text-lime-400 shadow-2xs'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
                }`}
              >
                Ready
              </button>
              <button
                onClick={() => setFilter('processing')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  filter === 'processing'
                    ? 'bg-neutral-950 text-lime-400 dark:bg-neutral-800 dark:text-lime-400 shadow-2xs'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
                }`}
              >
                Active
              </button>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-850/50 text-neutral-400 font-medium text-[11px]">
                <th className="py-2.5 px-4">Name</th>
                <th className="py-2.5 px-4">Size</th>
                <th className="py-2.5 px-4">Uploaded</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Chunks</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/80">
              {filteredDocuments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-neutral-400">
                    No documents found.
                  </td>
                </tr>
              ) : (
                filteredDocuments.map((doc) => (
                  <tr
                    key={doc.id}
                    className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors"
                  >
                    {/* Document Name */}
                    <td className="py-3 px-4">
                      <div
                        onClick={() => onOpenViewer && onOpenViewer(doc.id)}
                        className="flex items-center gap-2.5 cursor-pointer group"
                      >
                        <FileTextIcon size={15} className="text-neutral-400 group-hover:text-neutral-700 dark:group-hover:text-neutral-200 shrink-0" />
                        <span className="font-medium text-neutral-900 dark:text-neutral-100 group-hover:underline truncate max-w-[220px]">
                          {doc.name}
                        </span>
                      </div>
                    </td>

                    {/* Size */}
                    <td className="py-3 px-4 font-mono text-neutral-500 text-[11px]">
                      {doc.size}
                    </td>

                    {/* Upload Date */}
                    <td className="py-3 px-4 text-neutral-500 text-[11px] whitespace-nowrap">
                      {doc.uploadedAt}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4">
                      {getStatusBadge(doc.status)}
                    </td>

                    {/* Chunks */}
                    <td className="py-3 px-4 font-mono text-neutral-500 text-[11px]">
                      {doc.chunksCount ? `${doc.chunksCount}` : '—'}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {onOpenViewer && (
                          <button
                            onClick={() => onOpenViewer(doc.id)}
                            className="text-[11px] px-2 py-1 rounded text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                          >
                            View
                          </button>
                        )}

                        {doc.status === 'ready' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onStartChatWithDoc(doc)}
                            leftIcon={<SparklesIcon size={11} />}
                            className="h-7 text-[11px] px-2 py-0"
                          >
                            Chat
                          </Button>
                        )}

                        <button
                          onClick={() => onDeleteDoc(doc.id)}
                          className="p-1 rounded text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
                          title="Delete"
                        >
                          <Trash2Icon size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
