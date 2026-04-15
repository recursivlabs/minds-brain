import * as React from 'react';
import { View, ScrollView, RefreshControl, ActivityIndicator, Pressable, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../lib/auth';
import { ORG_ID } from '../../lib/recursiv';
import { Text, Card, Avatar } from '../../components';
import { colors, spacing, radius } from '../../constants/theme';

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

  const loadAgents = React.useCallback(async () => {
    if (!sdk) return;
    try {
      const res = await sdk.agents.list({ limit: 50 });
      // Filter to agents belonging to this org
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

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: spacing.xl, maxWidth: 680, width: '100%', alignSelf: 'center' }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadAgents(); }} tintColor={colors.accent} />}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing['2xl'] }}>
        <MaterialCommunityIcons name="robot-outline" size={24} color={colors.accent} />
        <Text variant="h1">Agents</Text>
        <View style={{ flex: 1 }} />
        <Text variant="caption" color={colors.textMuted}>{agents.length} agents</Text>
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
          </View>
        </Card>
      ) : (
        <Card variant="default" padding="xs">
          {agents.map((agent: any) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onChat={() => {
                // Start a new chat with this agent
                router.push(`/(app)/chat/new?message=${encodeURIComponent('Hello')}&agentId=${agent.id}`);
              }}
            />
          ))}
        </Card>
      )}
    </ScrollView>
  );
}
