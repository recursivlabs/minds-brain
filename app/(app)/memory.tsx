import * as React from 'react';
import { View, ScrollView, RefreshControl, ActivityIndicator, Pressable, Platform, TextInput } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../lib/auth';
import { Text, Card, Button } from '../../components';
import { colors, spacing, radius, typography } from '../../constants/theme';

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function MemoryItem({ fact, onDelete }: { fact: any; onDelete: () => void }) {
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md,
      paddingVertical: spacing.md, borderBottomWidth: 0.5, borderBottomColor: colors.borderSubtle,
    }}>
      <MaterialCommunityIcons name="lightbulb-outline" size={16} color={colors.accent} style={{ marginTop: 3 }} />
      <View style={{ flex: 1 }}>
        <Text variant="body">{fact.fact || fact.content || fact.text}</Text>
        {fact.tags?.length > 0 && (
          <View style={{ flexDirection: 'row', gap: spacing.xs, marginTop: spacing.xs, flexWrap: 'wrap' }}>
            {fact.tags.map((tag: string) => (
              <View key={tag} style={{ paddingHorizontal: 6, paddingVertical: 1, borderRadius: radius.sm, backgroundColor: colors.glass }}>
                <Text variant="caption" color={colors.textMuted} style={{ fontSize: 10 }}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
        {fact.created_at && (
          <Text variant="caption" color={colors.textMuted} style={{ marginTop: spacing.xs }}>{timeAgo(fact.created_at)}</Text>
        )}
      </View>
      <Pressable onPress={onDelete} style={Platform.OS === 'web' ? { cursor: 'pointer' } as any : {}}>
        <MaterialCommunityIcons name="trash-can-outline" size={16} color={colors.textMuted} />
      </Pressable>
    </View>
  );
}

export default function MemoryScreen() {
  const { sdk } = useAuth();
  const [facts, setFacts] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [searching, setSearching] = React.useState(false);

  const loadFacts = React.useCallback(async () => {
    if (!sdk) return;
    try {
      const res = await sdk.memory.list({ limit: 100 });
      setFacts(res.data || []);
    } catch (err) {
      console.warn('Failed to load memory:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [sdk]);

  React.useEffect(() => { loadFacts(); }, [loadFacts]);

  // Search
  React.useEffect(() => {
    if (!sdk || !searchQuery.trim()) { if (!searchQuery) loadFacts(); return; }
    const timeout = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await sdk.memory.search({ query: searchQuery.trim() });
        setFacts(res.data || []);
      } catch { /* keep existing */ }
      finally { setSearching(false); }
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery, sdk]);

  async function handleDelete(factId: string) {
    if (!sdk) return;
    try {
      await sdk.memory.delete(factId);
      setFacts(prev => prev.filter((f: any) => f.id !== factId));
    } catch (err: any) {
      console.warn('Failed to delete memory:', err.message);
    }
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: spacing.xl, maxWidth: 680, width: '100%', alignSelf: 'center' }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadFacts(); }} tintColor={colors.accent} />}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing['2xl'] }}>
        <MaterialCommunityIcons name="brain" size={24} color={colors.accent} />
        <Text variant="h1">Memory</Text>
        <View style={{ flex: 1 }} />
        <Text variant="caption" color={colors.textMuted}>{facts.length} facts</Text>
      </View>

      <Text variant="body" color={colors.textSecondary} style={{ marginBottom: spacing.xl }}>
        Everything Brain remembers about your business. Facts are stored from conversations and can be edited.
      </Text>

      {/* Search */}
      <TextInput
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search memory..."
        placeholderTextColor={colors.textMuted}
        style={{
          backgroundColor: colors.glass, borderWidth: 0.5, borderColor: colors.glassBorder,
          borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 10,
          color: colors.text, ...typography.body, marginBottom: spacing.xl,
          ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}),
        }}
      />

      {searching && <ActivityIndicator color={colors.accent} style={{ marginBottom: spacing.lg }} />}

      {loading ? (
        <View style={{ paddingVertical: spacing['4xl'], alignItems: 'center' }}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : facts.length === 0 ? (
        <Card variant="ghost" padding="xl">
          <View style={{ alignItems: 'center', paddingVertical: spacing['3xl'] }}>
            <MaterialCommunityIcons name="brain" size={32} color={colors.textMuted} style={{ marginBottom: spacing.md }} />
            <Text variant="body" color={colors.textMuted} align="center">
              {searchQuery ? 'No matching memories' : 'No memories yet'}
            </Text>
            <Text variant="caption" color={colors.textMuted} align="center" style={{ marginTop: spacing.xs }}>
              Brain stores facts as you chat. Ask it to "remember" something to get started.
            </Text>
          </View>
        </Card>
      ) : (
        <Card variant="default" padding="lg">
          {facts.map((fact: any) => (
            <MemoryItem key={fact.id} fact={fact} onDelete={() => handleDelete(fact.id)} />
          ))}
        </Card>
      )}
    </ScrollView>
  );
}
