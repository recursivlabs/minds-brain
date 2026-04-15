import * as React from 'react';
import { View, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Text, Card, Button } from '../../components';
import { colors, spacing } from '../../constants/theme';

export default function DashboardScreen() {
  const router = useRouter();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: spacing.xl, maxWidth: 680, width: '100%', alignSelf: 'center' }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing['3xl'] }}>
        <MaterialCommunityIcons name="view-dashboard-outline" size={24} color={colors.accent} />
        <Text variant="h1">Dashboard</Text>
      </View>

      <Card variant="default" padding="xl">
        <View style={{ alignItems: 'center', paddingVertical: spacing['3xl'] }}>
          <MaterialCommunityIcons name="chart-line" size={40} color={colors.textMuted} style={{ marginBottom: spacing.lg }} />
          <Text variant="h3" align="center" style={{ marginBottom: spacing.sm }}>
            Coming soon
          </Text>
          <Text variant="body" color={colors.textSecondary} align="center" style={{ maxWidth: 360, marginBottom: spacing.xl }}>
            Real-time metrics from your connected data sources. Cash position, revenue, expenses, and user analytics — updated automatically.
          </Text>
          <Text variant="caption" color={colors.textMuted} align="center" style={{ marginBottom: spacing['2xl'] }}>
            In the meantime, ask Brain directly for any data you need.
          </Text>
          <Button variant="secondary" onPress={() => router.push('/(app)')}>
            Ask Brain
          </Button>
        </View>
      </Card>
    </ScrollView>
  );
}
