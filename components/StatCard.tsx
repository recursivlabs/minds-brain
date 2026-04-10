import { View } from 'react-native';
import { Text } from './Text';
import { Card } from './Card';
import { colors, spacing } from '../constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type TrendDirection = 'up' | 'down' | 'flat';

interface Props {
  label: string;
  value: string;
  trend?: { direction: TrendDirection; value: string };
  size?: 'default' | 'hero';
}

export function StatCard({ label, value, trend, size = 'default' }: Props) {
  const trendColor = trend?.direction === 'up' ? colors.success
    : trend?.direction === 'down' ? colors.error : colors.textMuted;
  const trendIcon = trend?.direction === 'up' ? 'trending-up'
    : trend?.direction === 'down' ? 'trending-down' : 'minus';

  return (
    <Card variant="default" padding="xl" style={{ flex: 1, minWidth: 140 }}>
      <Text variant="label" color={colors.textMuted} style={{ marginBottom: spacing.sm }}>
        {label}
      </Text>
      <Text variant={size === 'hero' ? 'hero' : 'h1'} style={{ marginBottom: trend ? spacing.sm : 0 }}>
        {value}
      </Text>
      {trend && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
          <MaterialCommunityIcons name={trendIcon as any} size={14} color={trendColor} />
          <Text variant="caption" color={trendColor}>{trend.value}</Text>
        </View>
      )}
    </Card>
  );
}
