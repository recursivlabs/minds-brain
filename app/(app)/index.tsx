import * as React from 'react';
import { View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../lib/auth';
import { useBrain } from './_layout';
import { invalidate } from '../../lib/cache';
import { Text } from '../../components';
import { PromptChip } from '../../components/PromptChip';
import { ChatInput } from '../../components/ChatInput';
import { colors, spacing } from '../../constants/theme';

const SUGGESTED_PROMPTS = [
  "What's our cash position?",
  "Summarize this month's P&L",
  "How are DAUs trending?",
  "Any unusual expenses?",
  "What should I be worried about?",
  "Compare revenue MoM",
];

export default function HomeScreen() {
  const router = useRouter();
  const { sdk } = useAuth();
  const { agentId, refreshConversations } = useBrain();
  const [message, setMessage] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const { width } = useWindowDimensions();

  async function handleSend(text?: string) {
    const msg = text || message.trim();
    if (!msg || !sdk || !agentId || sending) return;
    setSending(true);
    try {
      const res = await sdk.agents.chat(agentId, { message: msg });
      const conversationId = res.data?.conversation_id || res.conversation_id;
      if (conversationId) {
        invalidate(`conversations:${agentId}`);
        refreshConversations();
        router.push(`/(app)/chat/${conversationId}`);
      }
    } catch (err) {
      console.warn('Failed to send:', err);
    } finally {
      setSending(false);
      setMessage('');
    }
  }

  return (
    <View style={{
      flex: 1, backgroundColor: colors.bg,
      alignItems: 'center', justifyContent: 'center',
      paddingHorizontal: spacing['3xl'],
    }}>
      <View style={{ alignItems: 'center', maxWidth: 600, width: '100%' }}>
        <MaterialCommunityIcons
          name="brain"
          size={40}
          color={colors.accent}
          style={{ marginBottom: spacing.xl }}
        />
        <Text variant="h1" align="center" style={{ marginBottom: spacing.sm }}>
          Minds Brain
        </Text>
        <Text variant="body" color={colors.textSecondary} align="center" style={{ marginBottom: spacing['4xl'] }}>
          Ask anything about your business
        </Text>

        {/* Prompt input */}
        <View style={{ width: '100%', marginBottom: spacing['2xl'] }}>
          <ChatInput
            value={message}
            onChangeText={setMessage}
            onSend={() => handleSend()}
            placeholder="Ask Minds Brain anything..."
            disabled={sending || !agentId}
            autoFocus={width >= 1024}
          />
        </View>

        {/* Suggested prompts */}
        <View style={{
          flexDirection: 'row', flexWrap: 'wrap',
          justifyContent: 'center', gap: spacing.sm,
        }}>
          {SUGGESTED_PROMPTS.map((prompt) => (
            <PromptChip
              key={prompt}
              label={prompt}
              onPress={() => handleSend(prompt)}
            />
          ))}
        </View>
      </View>
    </View>
  );
}
