'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { DocumentItem } from '@/types';

interface StatsOverviewProps {
  documents: DocumentItem[];
}

export function StatsOverview({ documents }: StatsOverviewProps) {
  const totalDocs = documents.length;
  const processingCount = documents.filter((d) => d.status === 'processing' || d.status === 'queued').length;
  const readyCount = documents.filter((d) => d.status === 'ready');
  const totalChunks = documents.reduce((sum, d) => sum + (d.chunksCount || 0), 0);

  const stats = [
    {
      id: 'total',
      label: 'Total Documents',
      value: totalDocs.toString(),
      subtext: `${documents.filter((d) => d.type === 'pdf').length} PDFs, ${documents.filter((d) => d.type === 'docx').length} DOCX`,
    },
    {
      id: 'processing',
      label: 'Processing In Queue',
      value: processingCount.toString(),
      subtext: processingCount > 0 ? 'Parsing & embedding active' : 'All jobs completed',
    },
    {
      id: 'ready',
      label: 'Indexed for Retrieval',
      value: readyCount.length.toString(),
      subtext: `${Math.round((readyCount.length / (totalDocs || 1)) * 100)}% coverage`,
    },
    {
      id: 'vectors',
      label: 'Vector Chunks',
      value: totalChunks.toLocaleString(),
      subtext: '1,536 dimensions',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
      {stats.map((stat) => (
        <Card key={stat.id}>
          <CardContent className="p-4">
            <p className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
              {stat.label}
            </p>
            <h4 className="text-xl sm:text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100 mt-1">
              {stat.value}
            </h4>
            <p className="mt-1 text-[11px] text-neutral-400 dark:text-neutral-500 truncate">
              {stat.subtext}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
