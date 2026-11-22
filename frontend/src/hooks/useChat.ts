import { useState, useCallback } from 'react';
import { api, CitationItem } from '@/services/api';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  citations?: CitationItem[];
}

export function useChat(conversationId?: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [currentCitation, setCurrentCitation] = useState<any[]>([]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isStreaming) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: 'Just now',
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsStreaming(true);
    setCurrentCitation([]);

    const assistantMsgId = `asst-${Date.now()}`;
    const initialAssistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: 'Just now',
      citations: [],
    };

    setMessages((prev) => [...prev, initialAssistantMsg]);

    try {
      await api.streamChat(
        text,
        (token) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId ? { ...m, content: m.content + token } : m
            )
          );
        },
        (citations) => {
          setCurrentCitation(citations);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId ? { ...m, citations } : m
            )
          );
        },
        () => {
          setIsStreaming(false);
        },
        (err) => {
          setIsStreaming(false);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId
                ? {
                    ...m,
                    content:
                      m.content ||
                      `Error generating response: ${err.message}. Please check connection.`,
                  }
                : m
            )
          );
        }
      );
    } catch (err: any) {
      setIsStreaming(false);
    }
  }, [isStreaming]);

  return {
    messages,
    isStreaming,
    currentCitation,
    sendMessage,
    setMessages,
  };
}
