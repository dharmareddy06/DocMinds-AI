'use client';

import React from 'react';
import { Badge } from '@/components/ui/Badge';

interface CitationBadgeProps {
  sourceIndex: number;
  documentName: string;
  pageNumber: number;
  onClick?: () => void;
}

export function CitationBadge({
  sourceIndex,
  documentName,
  pageNumber,
  onClick,
}: CitationBadgeProps) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center space-x-1.5 px-2 py-0.5 mx-1 rounded-full text-xs font-medium bg-zinc-900 border border-lime-500/40 text-lime-400 hover:bg-lime-950/40 hover:border-lime-400 transition-colors cursor-pointer"
      title={`${documentName} (Page ${pageNumber})`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-lime-400 animate-pulse" />
      <span>[{sourceIndex}]</span>
      <span className="text-zinc-300 truncate max-w-[100px]">{documentName}</span>
      <span className="text-zinc-500 text-[10px]">p.{pageNumber}</span>
    </button>
  );
}
