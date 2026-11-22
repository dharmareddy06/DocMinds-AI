'use client';

import React from 'react';
import { SparklesIcon } from '@/components/ui/Icons';

interface PromptSuggestionsProps {
  onSelect: (prompt: string) => void;
}

const DEFAULT_SUGGESTIONS = [
  'Extract technical specifications and architecture requirements.',
  'Identify all key risks, compliance obligations, and action items.',
  'Compare findings, metrics, and methodology across all documents.',
  'Summarize the core executive takeaways into a bulleted briefing.',
];

export function PromptSuggestions({ onSelect }: PromptSuggestionsProps) {
  return (
    <div className="flex flex-wrap gap-2 pt-2">
      {DEFAULT_SUGGESTIONS.map((s, idx) => (
        <button
          key={idx}
          onClick={() => onSelect(s)}
          className="flex items-center space-x-2 text-xs px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-lime-500/50 hover:bg-zinc-800/80 transition-all cursor-pointer"
        >
          <SparklesIcon className="w-3.5 h-3.5 text-lime-400" />
          <span>{s}</span>
        </button>
      ))}
    </div>
  );
}
