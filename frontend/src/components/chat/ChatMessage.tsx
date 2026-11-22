'use client';

import React from 'react';
import { Badge } from '@/components/ui/Badge';
import { CitationBadge } from '@/components/citations/CitationBadge';
import { SparklesIcon, CheckCircleIcon } from '@/components/ui/Icons';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  citations?: Array<{
    document_id: string;
    document_name: string;
    page_number: number;
    relevant_passage: string;
  }>;
  onCitationClick?: (citation: any) => void;
}

export function ChatMessage({
  role,
  content,
  citations,
  onCitationClick,
}: ChatMessageProps) {
  const isUser = role === 'user';

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-[85%] rounded-2xl p-4 transition-all duration-200 ${
          isUser
            ? 'bg-zinc-800 text-white rounded-br-sm border border-zinc-700/60'
            : 'bg-zinc-900/90 text-zinc-100 rounded-bl-sm border border-zinc-800'
        }`}
      >
        {!isUser && (
          <div className="flex items-center space-x-2 mb-2 pb-2 border-b border-zinc-800/80">
            <SparklesIcon className="w-4 h-4 text-lime-400" />
            <span className="text-xs font-semibold text-lime-400">DocMind Multi-Agent</span>
            <Badge variant="outline" className="text-[10px] bg-zinc-950 border-lime-500/30 text-lime-400">
              Verified Evidence
            </Badge>
          </div>
        )}

        <div className="text-sm leading-relaxed whitespace-pre-wrap font-sans">
          {content}
        </div>

        {!isUser && citations && citations.length > 0 && (
          <div className="mt-3 pt-3 border-t border-zinc-800/80">
            <div className="text-[11px] font-medium text-zinc-400 mb-1.5 flex items-center space-x-1">
              <CheckCircleIcon className="w-3.5 h-3.5 text-lime-400" />
              <span>Grounded Citations ({citations.length}):</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {citations.map((c, idx) => (
                <CitationBadge
                  key={idx}
                  sourceIndex={idx + 1}
                  documentName={c.document_name}
                  pageNumber={c.page_number}
                  onClick={() => onCitationClick && onCitationClick(c)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
