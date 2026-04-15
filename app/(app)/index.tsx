import * as React from 'react';
import { View, TextInput, Pressable, Platform, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useBrain } from './_layout';
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
  const { agentId } = useBrain();
  const [input, setInput] = React.useState('');
  const { width } = useWindowDimensions();

  function handleSend(text?: string) {
    const msg = text || input.trim();
    if (!msg || !agentId) return;
    setInput('');
    router.push(`/(app)/chat/new?message=${encodeURIComponent(msg)}`);
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
      </View>
    </View>
  );
}
