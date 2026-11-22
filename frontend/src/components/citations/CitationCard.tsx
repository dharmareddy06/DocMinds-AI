'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { DocumentIcon } from '@/components/ui/Icons';

interface CitationCardProps {
  documentName: string;
  pageNumber: number;
  passage: string;
  relevanceScore?: number;
  onClick?: () => void;
}

export function CitationCard({
  documentName,
  pageNumber,
  passage,
  relevanceScore,
  onClick,
}: CitationCardProps) {
  return (
    <Card
      onClick={onClick}
      className="p-3.5 border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800/60 hover:border-lime-500/50 cursor-pointer transition-all duration-200 group"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <DocumentIcon className="w-4 h-4 text-lime-400" />
          <span className="text-xs font-semibold text-zinc-200 truncate max-w-[180px]">
            {documentName}
          </span>
        </div>
        <Badge variant="outline" className="text-[10px] bg-zinc-950 text-lime-400 border-lime-500/30">
          Page {pageNumber}
        </Badge>
      </div>
      <p className="text-xs text-zinc-400 line-clamp-3 leading-relaxed">
        &ldquo;{passage}&rdquo;
      </p>
      {relevanceScore !== undefined && (
        <div className="mt-2 flex items-center justify-between text-[10px] text-zinc-500">
          <span>Relevance Score</span>
          <span className="text-lime-400 font-mono">{(relevanceScore * 100).toFixed(0)}%</span>
        </div>
      )}
    </Card>
  );
}
