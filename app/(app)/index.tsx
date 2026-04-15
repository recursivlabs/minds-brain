import * as React from 'react';
import { View, TextInput, Pressable, Platform, useWindowDimensions, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useBrain } from './_layout';
import { Text } from '../../components';
import { colors, spacing, radius, typography } from '../../constants/theme';

const CAPABILITIES = [
  {
    icon: 'cash-multiple',
    label: 'Finance',
    prompts: [
      "What's our cash position?",
      "Summarize this month's P&L",
      "Any unusual expenses?",
    ],
  },
  {
    icon: 'chart-line',
    label: 'Analytics',
    prompts: [
      "How are DAUs trending?",
      "What's our MRR?",
      "Compare revenue MoM",
    ],
  },
  {
    icon: 'magnify',
    label: 'Research',
    prompts: [
      "Research competitors in our space",
      "Find CPAs that specialize in creator businesses",
      "What are the latest trends in subscription content?",
    ],
  },
  {
    icon: 'pencil-outline',
    label: 'Create',
    prompts: [
      "Draft a blog post about our new show",
      "Write an investor update email",
      "Generate a thumbnail concept for the podcast",
    ],
  },
  {
    icon: 'brain',
    label: 'Remember',
    prompts: [
      "Remember that our lease renews in August",
      "What did I tell you about the cap table?",
      "What are our current priorities?",
    ],
  },
  {
    icon: 'email-outline',
    label: 'Act',
    prompts: [
      "Send Ryan the monthly summary",
      "Create a task to review Q2 taxes",
      "Schedule a reminder for the board meeting",
    ],
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const { agentId } = useBrain();
  const [input, setInput] = React.useState('');
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;

  function handleSend(text?: string) {
    const msg = text || input.trim();
    if (!msg || !agentId) return;
    setInput('');
    router.push(`/(app)/chat/new?message=${encodeURIComponent(msg)}`);
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{
        flexGrow: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing['4xl'],
      }}
    >
      <View style={{ alignItems: 'center', maxWidth: 680, width: '100%' }}>
        <MaterialCommunityIcons
          name="brain"
          size={36}
          color={colors.accent}
          style={{ marginBottom: spacing.lg }}
        />
        <Text variant="h1" align="center" style={{ marginBottom: spacing.sm }}>
          What do you need?
        </Text>
        <Text variant="body" color={colors.textSecondary} align="center" style={{ marginBottom: spacing['3xl'] }}>
          Ask anything. Get insights. Take action.
        </Text>

        {/* Prompt input */}
        <View style={{
          flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm,
          width: '100%', maxWidth: 560, marginBottom: spacing['4xl'],
        }}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Ask, create, research, or automate..."
            placeholderTextColor={colors.textMuted}
            multiline
            autoFocus={isDesktop}
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

        {/* Capability grid */}
        <View style={{
          flexDirection: 'row', flexWrap: 'wrap',
          gap: spacing.md, width: '100%',
          justifyContent: 'center',
        }}>
          {CAPABILITIES.map((cap) => (
            <View
              key={cap.label}
              style={{
                width: isDesktop ? '31%' : '47%',
                minWidth: isDesktop ? 200 : 150,
              }}
            >
              {/* Category header */}
              <View style={{
                flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
                marginBottom: spacing.sm,
              }}>
                <MaterialCommunityIcons name={cap.icon as any} size={16} color={colors.textMuted} />
                <Text variant="label" color={colors.textMuted}>{cap.label}</Text>
              </View>

              {/* Prompt buttons */}
              <View style={{ gap: spacing.xs }}>
                {cap.prompts.map((prompt) => (
                  <Pressable
                    key={prompt}
                    onPress={() => handleSend(prompt)}
                    style={({ pressed }) => ({
                      paddingVertical: spacing.sm,
                      paddingHorizontal: spacing.md,
                      borderRadius: radius.sm,
                      backgroundColor: pressed ? colors.surfaceHover : colors.glass,
                      borderWidth: 0.5,
                      borderColor: colors.borderSubtle,
                      ...(Platform.OS === 'web' ? { cursor: 'pointer', transition: 'background-color 0.15s ease' } : {}),
                    })}
                  >
                    <Text variant="caption" color={colors.textSecondary} numberOfLines={2}>{prompt}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
