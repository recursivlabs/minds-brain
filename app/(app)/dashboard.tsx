import * as React from 'react';
import { View, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../lib/auth';
import { useBrain } from './_layout';
import { callAI } from '../../lib/ai';
import { Text, Skeleton, Card } from '../../components';
import { StatCard } from '../../components/StatCard';
import { colors, spacing } from '../../constants/theme';

interface DashboardData {
  metrics: { label: string; value: string; trend?: { direction: 'up' | 'down' | 'flat'; value: string } }[];
  alerts: { severity: 'critical' | 'warning' | 'info'; title: string; detail: string }[];
  summary: string;
}

const DASHBOARD_PROMPT = `Give me a dashboard summary for the business. Use your connected tools to pull real data.

Return ONLY a JSON object in this exact format (no other text, no markdown, no code fences):
{
  "metrics": [
    {"label": "Cash Position", "value": "$X,XXX"},
    {"label": "MTD Revenue", "value": "$X,XXX"},
    {"label": "MTD Expenses", "value": "$X,XXX"},
    {"label": "Active Customers", "value": "XX"}
  ],
  "alerts": [
    {"severity": "warning", "title": "Alert title", "detail": "Alert detail"}
  ],
  "summary": "One paragraph plain English summary of the business health."
}

If a data source isn't connected, use "N/A" for the value. Pull real numbers from QuickBooks, Stripe, or PostHog if available. Do not make up numbers.`;

export default function DashboardScreen() {
  const { sdk } = useAuth();
  const { agentId } = useBrain();
  const [data, setData] = React.useState<DashboardData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const loadDashboard = React.useCallback(async () => {
    if (!sdk || !agentId) { setLoading(false); return; }
    setError(null);
    try {
      const result = await callAI(sdk, agentId, DASHBOARD_PROMPT, undefined, true);

      // Parse JSON from response — strip any markdown wrapping
      let jsonStr = result.content
        .replace(/```json\s*/g, '').replace(/```\s*/g, '')
        .trim();

      // Try to extract JSON if there's extra text
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (jsonMatch) jsonStr = jsonMatch[0];

      const parsed = JSON.parse(jsonStr) as DashboardData;
      setData(parsed);
    } catch (err: any) {
      console.warn('Dashboard load failed:', err.message);
      setError('Could not load dashboard data. Try refreshing.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [sdk, agentId]);

  React.useEffect(() => { loadDashboard(); }, [loadDashboard]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: spacing.xl, maxWidth: 960, width: '100%', alignSelf: 'center' }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadDashboard(); }} tintColor={colors.accent} />}
    >
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing['3xl'] }}>
        <MaterialCommunityIcons name="view-dashboard-outline" size={24} color={colors.accent} />
        <Text variant="h1">Dashboard</Text>
      </View>

      {loading ? (
        <>
          <Text variant="label" color={colors.textMuted} style={{ marginBottom: spacing.md }}>KEY METRICS</Text>
          <View style={{ flexDirection: 'row', gap: spacing.md, marginBottom: spacing['3xl'], flexWrap: 'wrap' }}>
            {[1, 2, 3, 4].map(i => <Skeleton key={i} height={100} style={{ flex: 1, minWidth: 140 }} />)}
          </View>
          <Text variant="label" color={colors.textMuted} style={{ marginBottom: spacing.md }}>SUMMARY</Text>
          <Skeleton height={60} style={{ marginBottom: spacing['3xl'] }} />
          <Text variant="body" color={colors.textSecondary} align="center" style={{ marginTop: spacing.xl }}>
            Brain is pulling data from your connected tools...
          </Text>
        </>
      ) : error ? (
        <Card variant="default" padding="xl">
          <View style={{ alignItems: 'center', paddingVertical: spacing['2xl'] }}>
            <MaterialCommunityIcons name="alert-circle-outline" size={32} color={colors.textMuted} style={{ marginBottom: spacing.md }} />
            <Text variant="body" color={colors.textMuted} align="center">{error}</Text>
          </View>
        </Card>
      ) : data ? (
        <>
          {/* Metrics */}
          <Text variant="label" color={colors.textMuted} style={{ marginBottom: spacing.md }}>KEY METRICS</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing['3xl'] }}>
            {data.metrics.map((m, i) => (
              <StatCard key={i} label={m.label} value={m.value} trend={m.trend} size={i === 0 ? 'hero' : 'default'} />
            ))}
          </View>

          {/* Summary */}
          {data.summary && (
            <>
              <Text variant="label" color={colors.textMuted} style={{ marginBottom: spacing.md }}>SUMMARY</Text>
              <Card variant="default" padding="xl" style={{ marginBottom: spacing['3xl'] }}>
                <Text variant="body" color={colors.textSecondary}>{data.summary}</Text>
              </Card>
            </>
          )}

          {/* Alerts */}
          {data.alerts && data.alerts.length > 0 && (
            <>
              <Text variant="label" color={colors.textMuted} style={{ marginBottom: spacing.md }}>ALERTS</Text>
              <View style={{ gap: spacing.sm, marginBottom: spacing['3xl'] }}>
                {data.alerts.map((alert, i) => (
                  <View key={i} style={{
                    flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start',
                    paddingVertical: spacing.md, paddingHorizontal: spacing.lg,
                    borderRadius: 8, backgroundColor: colors.glass,
                    borderWidth: 0.5, borderColor: colors.borderSubtle,
                  }}>
                    <MaterialCommunityIcons
                      name={alert.severity === 'critical' ? 'alert-circle' : alert.severity === 'warning' ? 'alert' : 'information'}
                      size={18}
                      color={alert.severity === 'critical' ? colors.error : alert.severity === 'warning' ? colors.warning : colors.info}
                      style={{ marginTop: 2 }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text variant="bodyMedium">{alert.title}</Text>
                      <Text variant="caption" color={colors.textSecondary} style={{ marginTop: spacing.xs }}>{alert.detail}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </>
          )}
        </>
      ) : null}
    </ScrollView>
  );
}
