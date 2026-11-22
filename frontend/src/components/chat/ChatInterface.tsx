'use client';

import React, { useState } from 'react';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { PromptSuggestions } from '@/components/chat/PromptSuggestions';
import { Button } from '@/components/ui/Button';
import { SendIcon, SparklesIcon } from '@/components/ui/Icons';
import { CitationViewer } from '@/components/citations/CitationViewer';

interface ChatInterfaceProps {
  messages: Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    citations?: any[];
  }>;
  isStreaming: boolean;
  onSendMessage: (msg: string) => void;
}

export function ChatInterface({
  messages,
  isStreaming,
  onSendMessage,
}: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const [activeCitation, setActiveCitation] = useState<any | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;
    onSendMessage(input);
    setInput('');
  };

  return (
    <div className="flex flex-col h-[650px] bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden">
      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-lime-500/30 flex items-center justify-center">
              <SparklesIcon className="w-6 h-6 text-lime-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Ask DocMind AI</h3>
              <p className="text-sm text-zinc-400 mt-1 max-w-md">
                Ask questions across all your uploaded documents. Answers are verified with page-level citations.
              </p>
            </div>
            <PromptSuggestions onSelect={(p) => onSendMessage(p)} />
          </div>
        ) : (
          messages.map((m) => (
            <ChatMessage
              key={m.id}
              role={m.role}
              content={m.content}
              citations={m.citations}
              onCitationClick={(c) => setActiveCitation(c)}
            />
          ))
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-zinc-800 bg-zinc-900/60">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about your documents..."
            disabled={isStreaming}
            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-lime-500 transition-colors"
          />
          <Button
            type="submit"
            disabled={!input.trim() || isStreaming}
            className="bg-lime-400 hover:bg-lime-500 text-black font-semibold px-4"
          >
            <SendIcon className="w-4 h-4" />
          </Button>
        </div>
      </form>

      {/* Citation Modal */}
      {activeCitation && (
        <CitationViewer
          isOpen={!!activeCitation}
          onClose={() => setActiveCitation(null)}
          documentName={activeCitation.document_name}
          pageNumber={activeCitation.page_number}
          passage={activeCitation.relevant_passage}
        />
      )}
    </div>
  );
}
