import * as React from 'react';
import { View, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text, Skeleton, Card } from '../../components';
import { StatCard } from '../../components/StatCard';
import { AlertCard } from '../../components/AlertCard';
import { colors, spacing } from '../../constants/theme';

// Placeholder data — will be replaced with live data from agent + database
const PLACEHOLDER_STATS = {
  cash: { value: '--', trend: undefined },
  revenue: { value: '--', trend: undefined },
  expenses: { value: '--', trend: undefined },
  dau: { value: '--', trend: undefined },
};

export default function DashboardScreen() {
  const [loading] = React.useState(false);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{
        padding: spacing.xl,
        maxWidth: 960,
        width: '100%',
        alignSelf: 'center',
      }}
    >
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing['3xl'] }}>
        <MaterialCommunityIcons name="view-dashboard-outline" size={24} color={colors.accent} />
        <Text variant="h1">Dashboard</Text>
      </View>

      {/* Key Metrics */}
      <Text variant="label" color={colors.textMuted} style={{ marginBottom: spacing.md }}>
        KEY METRICS
      </Text>
      {loading ? (
        <View style={{ flexDirection: 'row', gap: spacing.md, marginBottom: spacing['3xl'] }}>
          {[1, 2, 3, 4].map(i => <Skeleton key={i} height={100} style={{ flex: 1 }} />)}
        </View>
      ) : (
        <View style={{
          flexDirection: 'row', flexWrap: 'wrap',
          gap: spacing.md, marginBottom: spacing['3xl'],
        }}>
          <StatCard label="Cash Position" value={PLACEHOLDER_STATS.cash.value} size="hero" />
          <StatCard label="MTD Revenue" value={PLACEHOLDER_STATS.revenue.value} />
          <StatCard label="MTD Expenses" value={PLACEHOLDER_STATS.expenses.value} />
          <StatCard label="DAU" value={PLACEHOLDER_STATS.dau.value} />
        </View>
      )}

      {/* Alerts */}
      <Text variant="label" color={colors.textMuted} style={{ marginBottom: spacing.md }}>
        ALERTS
      </Text>
      <Card variant="ghost" padding="xs" style={{ marginBottom: spacing['3xl'] }}>
        <View style={{ alignItems: 'center', paddingVertical: spacing['3xl'] }}>
          <MaterialCommunityIcons name="check-circle-outline" size={32} color={colors.textMuted} style={{ marginBottom: spacing.md }} />
          <Text variant="body" color={colors.textMuted} align="center">
            No alerts right now
          </Text>
          <Text variant="caption" color={colors.textMuted} align="center" style={{ marginTop: spacing.xs }}>
            Connect your data sources in Settings to see alerts
          </Text>
        </View>
      </Card>

      {/* Revenue Breakdown */}
      <Text variant="label" color={colors.textMuted} style={{ marginBottom: spacing.md }}>
        REVENUE BY STREAM
      </Text>
      <Card variant="default" padding="xl" style={{ marginBottom: spacing['3xl'] }}>
        <View style={{ alignItems: 'center', paddingVertical: spacing.xl }}>
          <Text variant="body" color={colors.textMuted} align="center">
            Revenue data will appear once QuickBooks is connected
          </Text>
        </View>
      </Card>

      {/* Expense Categories */}
      <Text variant="label" color={colors.textMuted} style={{ marginBottom: spacing.md }}>
        TOP EXPENSES
      </Text>
      <Card variant="default" padding="xl" style={{ marginBottom: spacing['3xl'] }}>
        <View style={{ alignItems: 'center', paddingVertical: spacing.xl }}>
          <Text variant="body" color={colors.textMuted} align="center">
            Expense data will appear once QuickBooks is connected
          </Text>
        </View>
      </Card>
    </ScrollView>
  );
}
