import * as React from 'react';
import { View, Pressable, ScrollView, Platform } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { chatNavigationEvent } from '../lib/chat-events';
import { Text } from './Text';
import { Avatar } from './Avatar';
import { colors, spacing, radius } from '../constants/theme';

interface Props {
  conversations: any[];
  userName?: string;
  onNewChat: () => void;
  onSignOut: () => void;
}

function NavItem({ icon, label, active, onPress }: {
  icon: string; label: string; active: boolean; onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row', alignItems: 'center', gap: spacing.md,
        paddingVertical: spacing.sm, paddingHorizontal: spacing.md,
        borderRadius: radius.sm,
        backgroundColor: active ? colors.accentSubtle : 'transparent',
        ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
      }}
    >
      <MaterialCommunityIcons name={icon as any} size={20} color={active ? colors.accent : colors.textMuted} />
      <Text variant="body" color={active ? colors.text : colors.textSecondary}>{label}</Text>
    </Pressable>
  );
}

export function Sidebar({ conversations, userName, onNewChat, onSignOut }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <View style={{
      width: 260, backgroundColor: colors.surface, borderRightWidth: 0.5,
      borderRightColor: colors.borderSubtle, paddingVertical: spacing.xl,
    }}>
      {/* Header */}
      <View style={{ paddingHorizontal: spacing.xl, marginBottom: spacing['2xl'] }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <MaterialCommunityIcons name="brain" size={22} color={colors.accent} />
          <Text variant="h3">Brain</Text>
        </View>
      </View>

      {/* New chat button */}
      <View style={{ paddingHorizontal: spacing.md, marginBottom: spacing.lg }}>
        <Pressable
          onPress={onNewChat}
          style={{
            flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
            paddingVertical: spacing.sm, paddingHorizontal: spacing.md,
            borderRadius: radius.sm, borderWidth: 0.5, borderColor: colors.borderSubtle,
            ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
          }}
        >
          <MaterialCommunityIcons name="plus" size={18} color={colors.textSecondary} />
          <Text variant="body" color={colors.textSecondary}>New chat</Text>
        </Pressable>
      </View>

      {/* Nav items */}
      <View style={{ paddingHorizontal: spacing.md, gap: spacing.xs, marginBottom: spacing['2xl'] }}>
        <NavItem icon="home-outline" label="Home" active={pathname === '/(app)'  || pathname === '/'} onPress={() => router.push('/(app)')} />
        <NavItem icon="handshake-outline" label="Pipeline" active={pathname.includes('pipeline')} onPress={() => router.push('/(app)/pipeline')} />
        <NavItem icon="view-dashboard-outline" label="Dashboard" active={pathname.includes('dashboard')} onPress={() => router.push('/(app)/dashboard')} />
        <NavItem icon="cog-outline" label="Settings" active={pathname.includes('settings')} onPress={() => router.push('/(app)/settings')} />
      </View>

      {/* Recent conversations */}
      <View style={{ paddingHorizontal: spacing.xl, marginBottom: spacing.sm }}>
        <Text variant="label" color={colors.textMuted}>Recent</Text>
      </View>

      <ScrollView style={{ flex: 1, paddingHorizontal: spacing.md }}>
        {conversations.length === 0 ? (
          <View style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.sm }}>
            <Text variant="caption" color={colors.textMuted}>No conversations yet</Text>
          </View>
        ) : (
          conversations.slice(0, 20).map((c: any) => {
            const preview = c.last_message?.content || c.lastMessage?.content || 'New conversation';
            const isActive = pathname.includes(c.id);
            return (
              <Pressable
                key={c.id}
                onPress={() => chatNavigationEvent.emit({ type: 'open', conversationId: c.id })}
                style={{
                  paddingVertical: spacing.sm, paddingHorizontal: spacing.md,
                  borderRadius: radius.sm, marginBottom: 2,
                  backgroundColor: isActive ? colors.accentSubtle : 'transparent',
                  ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
                }}
              >
                <Text variant="caption" color={colors.textSecondary} numberOfLines={1}>
                  {preview.slice(0, 50)}
                </Text>
              </Pressable>
            );
          })
        )}
      </ScrollView>

      {/* User footer */}
      <View style={{
        paddingHorizontal: spacing.xl, paddingTop: spacing.lg,
        borderTopWidth: 0.5, borderTopColor: colors.borderSubtle,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Avatar name={userName} size="xs" />
          <Text variant="caption" color={colors.textSecondary} numberOfLines={1}>
            {userName || 'User'}
          </Text>
        </View>
        <Pressable onPress={onSignOut} style={Platform.OS === 'web' ? { cursor: 'pointer' } : {}}>
          <MaterialCommunityIcons name="logout" size={18} color={colors.textMuted} />
        </Pressable>
      </View>
    </View>
  );
}
