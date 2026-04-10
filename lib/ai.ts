import type { Recursiv } from '@recursiv/sdk';

const MAX_RETRIES = 2;

/**
 * Call AI via the SDK's chatStreamText helper (SSE → full text).
 * Retries once on empty response before giving up.
 */
export async function callAI(
  sdk: Recursiv,
  agentId: string | null,
  prompt: string,
  conversationId?: string
): Promise<{ content: string; conversationId: string }> {
  if (!agentId) {
    throw new Error('No AI agent available.');
  }

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await sdk.agents.chatStreamText(agentId, {
        message: prompt,
        ...(conversationId ? { conversation_id: conversationId } : {}),
      });

      return { content: result.content, conversationId: result.conversationId };
    } catch (err: any) {
      lastError = err;
      if (err.code !== 'empty_response' || attempt === MAX_RETRIES) {
        break;
      }
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  throw lastError || new Error('AI returned an empty response');
}
