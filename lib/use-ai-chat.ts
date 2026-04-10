import { useState, useCallback, useRef } from 'react';
import { Recursiv } from '@recursiv/sdk';
import { callAI } from './ai';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
  timestamp: Date;
}

export function useAiChat(sdk: Recursiv | null, agentId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (text: string) => {
      if (isStreaming || !sdk) return;

      const userMsg: ChatMessage = {
        id: 'user-' + Date.now(),
        role: 'user',
        content: text,
        timestamp: new Date(),
      };

      const assistantId = 'assistant-' + Date.now();
      setMessages((prev) => [
        ...prev,
        userMsg,
        {
          id: assistantId,
          role: 'assistant',
          content: '',
          isStreaming: true,
          timestamp: new Date(),
        },
      ]);

      setIsStreaming(true);

      try {
        const result = await callAI(sdk, agentId, text, conversationId || undefined);
        if (result.conversationId) {
          setConversationId(result.conversationId);
        }

        // Clean up code fences from response
        let cleanText = result.content
          .replace(/```(?:json|javascript|js|typescript|ts|action)?\s*\n([\s\S]*?)```/g, '')
          .replace(/```\w*\s*/g, '')
          .replace(/```/g, '')
          .trim();

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, isStreaming: false, content: cleanText }
              : m
          )
        );
      } catch (err: any) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, isStreaming: false, content: `Sorry, I encountered an error: ${err.message}` }
              : m
          )
        );
      } finally {
        setIsStreaming(false);
      }
    },
    [sdk, agentId, isStreaming, conversationId]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setConversationId(null);
  }, []);

  const loadConversation = useCallback(
    async (convId: string) => {
      if (!convId || !sdk) return;
      try {
        const res = await sdk.chat.messages(convId, { limit: 100 });
        const loaded: ChatMessage[] = (res.data || [])
          .reverse()
          .map((m: any) => ({
            id: m.id,
            role: m.sender?.is_ai ? 'assistant' as const : 'user' as const,
            content: m.content || '',
            timestamp: new Date(m.created_at),
          }));
        setMessages(loaded);
        setConversationId(convId);
      } catch (err: any) {
        console.error('[useAiChat] loadConversation error:', err.message);
      }
    },
    [sdk]
  );

  return { messages, isStreaming, conversationId, sendMessage, clearMessages, loadConversation };
}
