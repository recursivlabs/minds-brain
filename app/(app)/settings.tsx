import * as React from 'react';
import { View, ScrollView, Pressable, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../lib/auth';
import { Text, Card, Button } from '../../components';
import { colors, spacing, radius } from '../../constants/theme';

interface IntegrationItemProps {
  name: string;
  icon: string;
  description: string;
  connected: boolean;
  onConnect: () => void;
}

function IntegrationItem({ name, icon, description, connected, onConnect }: IntegrationItemProps) {
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingVertical: spacing.lg, borderBottomWidth: 0.5, borderBottomColor: colors.borderSubtle,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 }}>
        <View style={{
          width: 36, height: 36, borderRadius: radius.md,
          backgroundColor: colors.glass, alignItems: 'center', justifyContent: 'center',
        }}>
          <MaterialCommunityIcons name={icon as any} size={20} color={colors.textSecondary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="bodyMedium">{name}</Text>
          <Text variant="caption" color={colors.textMuted}>{description}</Text>
        </View>
      </View>
      {connected ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
          <MaterialCommunityIcons name="check-circle" size={16} color={colors.success} />
          <Text variant="caption" color={colors.success}>Connected</Text>
        </View>
      ) : (
        <Pressable
          onPress={onConnect}
          style={{
            paddingVertical: spacing.xs, paddingHorizontal: spacing.md,
            borderRadius: radius.sm, borderWidth: 0.5, borderColor: colors.borderSubtle,
            ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
          }}
        >
          <Text variant="caption" color={colors.textSecondary}>Connect</Text>
        </Pressable>
      )}
    </View>
  );
}

export default function SettingsScreen() {
  const { user, signOut } = useAuth();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{
        padding: spacing.xl,
        maxWidth: 640,
        width: '100%',
        alignSelf: 'center',
      }}
    >
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing['3xl'] }}>
        <MaterialCommunityIcons name="cog-outline" size={24} color={colors.accent} />
        <Text variant="h1">Settings</Text>
      </View>

      {/* Integrations */}
      <Text variant="h3" style={{ marginBottom: spacing.lg }}>Data Sources</Text>
      <Card variant="default" padding="xl" style={{ marginBottom: spacing['3xl'] }}>
        <IntegrationItem
          name="QuickBooks"
          icon="calculator-variant"
          description="Financial data, P&L, expenses"
          connected={false}
          onConnect={() => { /* TODO: Composio OAuth */ }}
        />
        <IntegrationItem
          name="Stripe"
          icon="credit-card-outline"
          description="Revenue, subscriptions, payments"
          connected={false}
          onConnect={() => { /* TODO: Composio OAuth */ }}
        />
        <IntegrationItem
          name="PostHog"
          icon="chart-line"
          description="Product analytics, DAU, events"
          connected={false}
          onConnect={() => { /* TODO: API key input */ }}
        />
        <IntegrationItem
          name="GitHub"
          icon="github"
          description="Repositories, commits, activity"
          connected={false}
          onConnect={() => { /* TODO: Composio OAuth */ }}
        />
      </Card>

      {/* Account */}
      <Text variant="h3" style={{ marginBottom: spacing.lg }}>Account</Text>
      <Card variant="default" padding="xl" style={{ marginBottom: spacing['3xl'] }}>
        <View style={{ marginBottom: spacing.lg }}>
          <Text variant="label" color={colors.textMuted}>Name</Text>
          <Text variant="body" style={{ marginTop: spacing.xs }}>{user?.name || '--'}</Text>
        </View>
        <View style={{ marginBottom: spacing.xl }}>
          <Text variant="label" color={colors.textMuted}>Email</Text>
          <Text variant="body" style={{ marginTop: spacing.xs }}>{user?.email || '--'}</Text>
        </View>
        <Button variant="secondary" onPress={signOut}>Sign Out</Button>
      </Card>
    </ScrollView>
  );
}
