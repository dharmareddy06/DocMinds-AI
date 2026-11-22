'use client';

import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { useChat } from '@/hooks/useChat';

export default function ChatPage() {
  const { messages, isStreaming, sendMessage } = useChat();

  return (
    <AppLayout
      activeTab="chat"
      onTabChange={(tab) => {
        window.location.href = tab === 'dashboard' ? '/dashboard' : `/${tab}`;
      }}
    >
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-white">Conversational Intelligence</h2>
          <p className="text-sm text-zinc-400 mt-1">
            Query across all uploaded documents with streaming responses and grounded citations.
          </p>
        </div>

        <ChatInterface
          messages={messages}
          isStreaming={isStreaming}
          onSendMessage={sendMessage}
        />
      </div>
    </AppLayout>
  );
}
