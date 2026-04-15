import * as React from 'react';
import { View, ScrollView, RefreshControl, ActivityIndicator, Pressable, Platform, Modal, TextInput as RNTextInput } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../lib/auth';
import { ORG_ID } from '../../lib/recursiv';
import { Text, Card, Avatar, Button, Input } from '../../components';
import { colors, spacing, radius, typography } from '../../constants/theme';

const MODELS = [
  { value: 'google/gemini-3.1-pro-preview', label: 'Gemini 3.1 Pro (Free)' },
  { value: 'google/gemini-3-flash-preview', label: 'Gemini 3 Flash (Free)' },
  { value: 'anthropic/claude-sonnet-4.6', label: 'Claude Sonnet 4.6' },
  { value: 'openai/gpt-5.4', label: 'GPT-5.4' },
  { value: 'deepseek/deepseek-v3.2', label: 'DeepSeek V3.2' },
];

function AgentCard({ agent, onChat }: { agent: any; onChat: () => void }) {
  const model = agent.model?.split('/')?.pop() || agent.model || 'unknown';

  return (
    <Pressable
      onPress={onChat}
      style={({ pressed }) => ({
        flexDirection: 'row', alignItems: 'center', gap: spacing.md,
        paddingVertical: spacing.lg, paddingHorizontal: spacing.lg,
        borderBottomWidth: 0.5, borderBottomColor: colors.borderSubtle,
        backgroundColor: pressed ? colors.surfaceHover : 'transparent',
        ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
      })}
    >
      <Avatar name={agent.name} size="md" />
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Text variant="bodyMedium">{agent.name}</Text>
          <View style={{ paddingHorizontal: 6, paddingVertical: 1, borderRadius: radius.sm, backgroundColor: colors.accentMuted }}>
            <Text variant="caption" color={colors.accent} style={{ fontSize: 10 }}>Agent</Text>
          </View>
        </View>
        {agent.bio && <Text variant="caption" color={colors.textSecondary} numberOfLines={1}>{agent.bio}</Text>}
        <Text variant="caption" color={colors.textMuted} style={{ marginTop: spacing.xs }}>
          {model} · {agent.tool_mode}
        </Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textMuted} />
    </Pressable>
  );
}

export default function AgentsScreen() {
  const { sdk } = useAuth();
  const router = useRouter();
  const [agents, setAgents] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [showCreate, setShowCreate] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [name, setName] = React.useState('');
  const [bio, setBio] = React.useState('');
  const [systemPrompt, setSystemPrompt] = React.useState('');
  const [model, setModel] = React.useState(MODELS[0].value);

  const loadAgents = React.useCallback(async () => {
    if (!sdk) return;
    try {
      const res = await sdk.agents.list({ limit: 50 });
      const orgAgents = (res.data || []).filter((a: any) => a.organization_id === ORG_ID);
      setAgents(orgAgents);
    } catch (err) {
      console.warn('Failed to load agents:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [sdk]);

  React.useEffect(() => { loadAgents(); }, [loadAgents]);

  async function handleCreate() {
    if (!sdk || !name.trim()) return;
    setCreating(true);
    try {
      const username = name.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_').slice(0, 30);
      await sdk.agents.create({
        name: name.trim(),
        username: username + '_' + Date.now().toString(36).slice(-4),
        bio: bio.trim() || undefined,
        system_prompt: systemPrompt.trim() || undefined,
        model,
        tool_mode: 'autonomous',
        social_mode: 'chat_only',
        organization_id: ORG_ID,
      });
      setShowCreate(false);
      setName(''); setBio(''); setSystemPrompt(''); setModel(MODELS[0].value);
      await loadAgents();
    } catch (err: any) {
      console.warn('Failed to create agent:', err.message);
    } finally {
      setCreating(false);
    }
  }

  return (
    <>
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: spacing.xl, maxWidth: 680, width: '100%', alignSelf: 'center' }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadAgents(); }} tintColor={colors.accent} />}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing['2xl'] }}>
        <MaterialCommunityIcons name="robot-outline" size={24} color={colors.accent} />
        <Text variant="h1">Agents</Text>
        <View style={{ flex: 1 }} />
        <Button size="sm" onPress={() => setShowCreate(true)}>Create Agent</Button>
      </View>

      <Text variant="body" color={colors.textSecondary} style={{ marginBottom: spacing.xl }}>
        AI agents working for your business. Each can be specialized with different tools and instructions.
      </Text>

      {loading ? (
        <View style={{ paddingVertical: spacing['4xl'], alignItems: 'center' }}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : agents.length === 0 ? (
        <Card variant="ghost" padding="xl">
          <View style={{ alignItems: 'center', paddingVertical: spacing['3xl'] }}>
            <MaterialCommunityIcons name="robot-outline" size={32} color={colors.textMuted} style={{ marginBottom: spacing.md }} />
            <Text variant="body" color={colors.textMuted} align="center">No agents yet</Text>
            <Text variant="caption" color={colors.textMuted} align="center" style={{ marginTop: spacing.xs }}>
              Create your first agent to get started
            </Text>
          </View>
        </Card>
      ) : (
        <Card variant="default" padding="xs">
          {agents.map((agent: any) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onChat={() => {
                router.push(`/(app)/chat/new?message=${encodeURIComponent('Hello')}&agentId=${agent.id}`);
              }}
            />
          ))}
        </Card>
      )}
    </ScrollView>

    {/* Create Agent Modal */}
    <Modal visible={showCreate} transparent animationType="fade" onRequestClose={() => setShowCreate(false)}>
      <Pressable
        style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', alignItems: 'center' }}
        onPress={() => setShowCreate(false)}
      >
        <Pressable
          onPress={(e) => e.stopPropagation?.()}
          style={{
            width: '100%', maxWidth: 520, maxHeight: '90%',
            backgroundColor: colors.surface, borderRadius: radius.lg,
            borderWidth: 0.5, borderColor: colors.borderSubtle,
            ...(Platform.OS === 'web' ? { boxShadow: '0 24px 48px rgba(0,0,0,0.5)' } as any : {}),
          }}
        >
          <ScrollView contentContainerStyle={{ padding: spacing['2xl'] }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xl }}>
              <Text variant="h2">Create Agent</Text>
              <Pressable onPress={() => setShowCreate(false)} style={Platform.OS === 'web' ? { cursor: 'pointer' } as any : {}}>
                <MaterialCommunityIcons name="close" size={22} color={colors.textMuted} />
              </Pressable>
            </View>

            <Input label="Name" value={name} onChangeText={setName} placeholder="e.g. Revenue Agent" />
            <Input label="Bio" value={bio} onChangeText={setBio} placeholder="What does this agent do?" />

            {/* Model selector */}
            <Text variant="label" color={colors.textSecondary} style={{ marginBottom: spacing.xs }}>Model</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.md }}>
              {MODELS.map(m => (
                <Pressable
                  key={m.value}
                  onPress={() => setModel(m.value)}
                  style={{
                    paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.full,
                    backgroundColor: model === m.value ? colors.accentMuted : colors.glass,
                    borderWidth: 0.5,
                    borderColor: model === m.value ? colors.accent + '40' : colors.glassBorder,
                    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
                  } as any}
                >
                  <Text variant="caption" color={model === m.value ? colors.accent : colors.textSecondary}>{m.label}</Text>
                </Pressable>
              ))}
            </View>

            {/* System prompt */}
            <Text variant="label" color={colors.textSecondary} style={{ marginBottom: spacing.xs }}>Instructions</Text>
            <RNTextInput
              value={systemPrompt}
              onChangeText={setSystemPrompt}
              multiline
              numberOfLines={6}
              placeholder="Tell this agent what it should do, what it knows, and how it should behave..."
              placeholderTextColor={colors.textMuted}
              style={{
                backgroundColor: colors.glass,
                borderWidth: 0.5, borderColor: colors.glassBorder,
                borderRadius: radius.md,
                paddingHorizontal: spacing.md, paddingVertical: spacing.md,
                color: colors.text, minHeight: 120, textAlignVertical: 'top',
                ...typography.body,
                ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}),
                marginBottom: spacing.xl,
              }}
            />

            <View style={{ flexDirection: 'row', gap: spacing.md, justifyContent: 'flex-end' }}>
              <Button variant="secondary" onPress={() => setShowCreate(false)}>Cancel</Button>
              <Button loading={creating} onPress={handleCreate}>Create</Button>
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
    </>
  );
}
