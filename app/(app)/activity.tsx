import * as React from 'react';
import { View, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../lib/auth';
import { ORG_ID } from '../../lib/recursiv';
import { useBrain } from './_layout';
import { Text, Card, Avatar } from '../../components';
import { colors, spacing, radius } from '../../constants/theme';

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function ActivityItem({ item }: { item: any }) {
  const isAgent = item.author?.is_ai || item.sender?.is_ai;
  const name = item.author?.name || item.sender?.name || 'Brain';
  const content = item.content || item.text || item.body || '';
  const time = item.created_at || item.createdAt;

  return (
    <View style={{
      flexDirection: 'row', gap: spacing.md, paddingVertical: spacing.md,
      borderBottomWidth: 0.5, borderBottomColor: colors.borderSubtle,
    }}>
      <Avatar name={name} size="sm" />
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs }}>
          <Text variant="bodyMedium">{name}</Text>
          {isAgent && (
            <View style={{ paddingHorizontal: 6, paddingVertical: 1, borderRadius: radius.sm, backgroundColor: colors.accentMuted }}>
              <Text variant="caption" color={colors.accent} style={{ fontSize: 10 }}>Agent</Text>
            </View>
          )}
          <Text variant="caption" color={colors.textMuted}>{timeAgo(time)}</Text>
        </View>
        <Text variant="body" color={colors.textSecondary} numberOfLines={3}>{content}</Text>
      </View>
    </View>
  );
}

export default function ActivityScreen() {
  const { sdk } = useAuth();
  const [activity, setActivity] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const loadActivity = React.useCallback(async () => {
    if (!sdk) return;
    try {
      // Load posts scoped to this org
      const res = await sdk.posts.list({ limit: 50, organization_id: ORG_ID });
      setActivity(res.data || []);
    } catch (err) {
      console.warn('Failed to load activity:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [sdk]);

  React.useEffect(() => { loadActivity(); }, [loadActivity]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: spacing.xl, maxWidth: 680, width: '100%', alignSelf: 'center' }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadActivity(); }} tintColor={colors.accent} />}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing['2xl'] }}>
        <MaterialCommunityIcons name="pulse" size={24} color={colors.accent} />
        <Text variant="h1">Activity</Text>
      </View>

      {loading ? (
        <View style={{ paddingVertical: spacing['4xl'], alignItems: 'center' }}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : activity.length === 0 ? (
        <Card variant="ghost" padding="xl">
          <View style={{ alignItems: 'center', paddingVertical: spacing['3xl'] }}>
            <MaterialCommunityIcons name="pulse" size={32} color={colors.textMuted} style={{ marginBottom: spacing.md }} />
            <Text variant="body" color={colors.textMuted} align="center">No activity yet</Text>
            <Text variant="caption" color={colors.textMuted} align="center" style={{ marginTop: spacing.xs }}>
              Agent actions and updates will appear here
            </Text>
          </View>
        </Card>
      ) : (
        <Card variant="default" padding="lg">
          {activity.map((item: any) => (
            <ActivityItem key={item.id} item={item} />
          ))}
        </Card>
      )}
    </ScrollView>
  );
}
