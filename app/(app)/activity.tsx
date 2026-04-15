import * as React from 'react';
import { View, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../lib/auth';
import { ORG_ID } from '../../lib/recursiv';
import { Text, Card } from '../../components';
import { PostCard } from '../../components/PostCard';
import { colors, spacing } from '../../constants/theme';

export default function ActivityScreen() {
  const { sdk, user } = useAuth();
  const [posts, setPosts] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const loadPosts = React.useCallback(async () => {
    if (!sdk) return;
    try {
      const res = await sdk.posts.list({ limit: 50, organization_id: ORG_ID });
      setPosts(res.data || []);
    } catch (err) {
      console.warn('Failed to load activity:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [sdk]);

  React.useEffect(() => { loadPosts(); }, [loadPosts]);

  const handleVoteChange = (postId: string, newScore: number, userVote: 'upvote' | 'downvote' | null) => {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, score: newScore, userReaction: userVote } : p));
  };

  const handlePostDeleted = (postId: string) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: spacing.md,
        paddingHorizontal: spacing.xl, paddingVertical: spacing.lg,
      }}>
        <MaterialCommunityIcons name="pulse" size={24} color={colors.accent} />
        <Text variant="h1">Activity</Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : posts.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl }}>
          <MaterialCommunityIcons name="pulse" size={32} color={colors.textMuted} style={{ marginBottom: spacing.md }} />
          <Text variant="body" color={colors.textMuted} align="center">No activity yet</Text>
          <Text variant="caption" color={colors.textMuted} align="center" style={{ marginTop: spacing.xs }}>
            Agent actions and updates will appear here
          </Text>
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            maxWidth: 680, width: '100%', alignSelf: 'center',
            paddingHorizontal: spacing.xl,
          }}
          renderItem={({ item }) => (
            <PostCard
              post={item}
              onVoteChange={handleVoteChange}
              onPostDeleted={handlePostDeleted}
              canModerate={user?.role === 'admin' || user?.role === 'owner'}
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); loadPosts(); }}
              tintColor={colors.accent}
            />
          }
        />
      )}
    </View>
  );
}
