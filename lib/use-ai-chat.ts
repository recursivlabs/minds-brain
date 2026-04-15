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

function stripCodeBlocks(text: string): string {
  return text
    .replace(/```(?:json|javascript|js|typescript|ts|action)?\s*\n([\s\S]*?)```/g, '')
    .replace(/```\w*\s*/g, '')
    .replace(/```/g, '')
    .trim();
}

export function useAiChat(sdk: Recursiv | null, agentId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const conversationIdRef = useRef<string | null>(null);

  const sendMessage = useCallback(
    async (text: string, options?: { newConversation?: boolean }): Promise<string | null> => {
      if (isStreaming || !sdk) return null;

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
        const convId = options?.newConversation ? undefined : conversationIdRef.current || undefined;
        const result = await callAI(sdk, agentId, text, convId, options?.newConversation);
        if (result.conversationId) {
          conversationIdRef.current = result.conversationId;
          setConversationId(result.conversationId);
        }

        const cleanText = stripCodeBlocks(result.content);

        if (!cleanText) {
          // Tool-only response with no visible text — remove the empty bubble
          setMessages((prev) => prev.filter((m) => m.id !== assistantId));
        } else {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, isStreaming: false, content: cleanText }
                : m
            )
          );
        }

        return result.conversationId || null;
      } catch (err: any) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, isStreaming: false, content: `Sorry, I encountered an error: ${err.message}` }
              : m
          )
        );
        return conversationIdRef.current;
      } finally {
        setIsStreaming(false);
      }
    },
    [sdk, agentId, isStreaming]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setConversationId(null);
    conversationIdRef.current = null;
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
            content: stripCodeBlocks(m.content || ''),
            timestamp: new Date(m.created_at),
          }))
          .filter((m: ChatMessage) => m.content.length > 0);
        setMessages(loaded);
        setConversationId(convId);
        conversationIdRef.current = convId;
      } catch (err: any) {
        console.error('[useAiChat] loadConversation error:', err.message);
      }
    },
    [sdk]
  );

  return { messages, isStreaming, conversationId, sendMessage, clearMessages, loadConversation };
}
