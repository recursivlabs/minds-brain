import * as React from 'react';
import { Recursiv } from '@recursiv/sdk';
import { getCached, isFresh, setCache } from './cache';

export function useConversations(sdk: Recursiv | null, agentId: string | null) {
  const [conversations, setConversations] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  const fetch = React.useCallback(async () => {
    if (!sdk || !agentId) return;
    const key = `conversations:${agentId}`;
    const cached = getCached(key);
    if (cached) setConversations(cached);
    if (isFresh(key) && cached) { setLoading(false); return; }

    try {
      const res = await sdk.agents.conversations(agentId, { limit: 50 });
      const data = res.data || [];
      setConversations(data);
      setCache(key, data);
    } catch (err) {
      console.warn('Failed to fetch conversations:', err);
    } finally {
      setLoading(false);
    }
  }, [sdk, agentId]);

  React.useEffect(() => { fetch(); }, [fetch]);

  return { conversations, loading, refresh: fetch };
}

export function useMessages(sdk: Recursiv | null, conversationId: string | null) {
  const [messages, setMessages] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  const fetch = React.useCallback(async () => {
    if (!sdk || !conversationId) return;
    try {
      const res = await sdk.chat.messages(conversationId, { limit: 100 });
      setMessages(res.data || []);
    } catch (err) {
      console.warn('Failed to fetch messages:', err);
    } finally {
      setLoading(false);
    }
  }, [sdk, conversationId]);

  React.useEffect(() => { fetch(); }, [fetch]);

  return { messages, setMessages, loading, refresh: fetch };
}
