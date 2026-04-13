import * as React from 'react';
import { View, TextInput, Pressable, Platform, useWindowDimensions, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useBrain } from './_layout';
import { invalidate } from '../../lib/cache';
import { Text } from '../../components';
import { colors, spacing, radius, typography } from '../../constants/theme';

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
  const { agentId, refreshConversations, chat } = useBrain();
  const [input, setInput] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const { width } = useWindowDimensions();

  async function handleSend(text?: string) {
    const msg = text || input.trim();
    if (!msg || sending || !agentId) return;
    setInput('');
    setSending(true);

    // Clear any previous conversation so this starts fresh
    chat.clearMessages();

    // Send message and wait for conversation ID
    const convId = await chat.sendMessage(msg);

    if (convId) {
      invalidate(`conversations:${agentId}`);
      refreshConversations();
      // Navigate to the real conversation
      router.push(`/(app)/chat/${convId}`);
    }

    setSending(false);
  }

  return (
    <View style={{
      flex: 1, backgroundColor: colors.bg,
      alignItems: 'center', justifyContent: 'center',
      paddingHorizontal: spacing['3xl'],
    }}>
      <View style={{ alignItems: 'center', maxWidth: 600, width: '100%' }}>
        {sending ? (
          // Show loading state while first message is being sent
          <View style={{ alignItems: 'center', gap: spacing.xl }}>
            <MaterialCommunityIcons name="brain" size={40} color={colors.accent} />
            <Text variant="h3" color={colors.textSecondary}>Thinking...</Text>
            <ActivityIndicator color={colors.accent} />
          </View>
        ) : (
          <>
            <MaterialCommunityIcons
              name="brain"
              size={40}
              color={colors.accent}
              style={{ marginBottom: spacing.xl }}
            />
            <Text variant="h1" align="center" style={{ marginBottom: spacing.sm }}>
              How can I help?
            </Text>
            <Text variant="body" color={colors.textSecondary} align="center" style={{ marginBottom: spacing['3xl'] }}>
              Ask anything about your business
            </Text>

            {/* Prompt input */}
            <View style={{
              flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm,
              width: '100%', marginBottom: spacing['2xl'],
            }}>
              <TextInput
                value={input}
                onChangeText={setInput}
                placeholder="Ask Minds Brain anything..."
                placeholderTextColor={colors.textMuted}
                multiline
                autoFocus={width >= 1024}
                onKeyPress={(e: any) => {
                  if (Platform.OS === 'web' && e.nativeEvent.key === 'Enter' && !e.nativeEvent.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                style={{
                  flex: 1, maxHeight: 120,
                  backgroundColor: colors.glass,
                  borderWidth: 0.5, borderColor: colors.glassBorder,
                  borderRadius: radius.lg,
                  paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
                  color: colors.text,
                  ...typography.body,
                  ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}),
                }}
              />
              <Pressable
                onPress={() => handleSend()}
                style={[{
                  width: 40, height: 40, borderRadius: radius.full,
                  backgroundColor: input.trim() ? colors.accent : colors.glass,
                  alignItems: 'center' as const, justifyContent: 'center' as const,
                }, Platform.OS === 'web' ? { cursor: input.trim() ? 'pointer' : 'default' } as any : {}]}
              >
                <MaterialCommunityIcons
                  name="arrow-up"
                  size={20}
                  color={input.trim() ? colors.textInverse : colors.textMuted}
                />
              </Pressable>
            </View>

            {/* Suggested prompts */}
            <View style={{
              flexDirection: 'row', flexWrap: 'wrap',
              justifyContent: 'center', gap: spacing.sm,
            }}>
              {SUGGESTED_PROMPTS.map((prompt) => (
                <Pressable
                  key={prompt}
                  onPress={() => handleSend(prompt)}
                  style={({ pressed }) => ({
                    paddingVertical: spacing.sm,
                    paddingHorizontal: spacing.lg,
                    borderRadius: radius.full,
                    borderWidth: 0.5,
                    borderColor: colors.borderSubtle,
                    backgroundColor: pressed ? colors.surfaceHover : 'transparent',
                    ...(Platform.OS === 'web' ? { cursor: 'pointer', transition: 'background-color 0.15s ease' } : {}),
                  })}
                >
                  <Text variant="caption" color={colors.textSecondary}>{prompt}</Text>
                </Pressable>
              ))}
            </View>
          </>
        )}
      </View>
    </View>
  );
}
