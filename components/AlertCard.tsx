import { View } from 'react-native';
import { Text } from './Text';
import { colors, spacing, radius } from '../constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type Severity = 'critical' | 'warning' | 'info';

interface Props {
  severity: Severity;
  title: string;
  detail?: string;
}

const severityConfig: Record<Severity, { icon: string; color: string }> = {
  critical: { icon: 'alert-circle', color: colors.error },
  warning: { icon: 'alert', color: colors.warning },
  info: { icon: 'information', color: colors.info },
};

export function AlertCard({ severity, title, detail }: Props) {
  const config = severityConfig[severity];

  return (
    <View style={{
      flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start',
      paddingVertical: spacing.md, paddingHorizontal: spacing.lg,
      borderRadius: radius.md, backgroundColor: colors.glass,
      borderWidth: 0.5, borderColor: colors.borderSubtle,
    }}>
      <MaterialCommunityIcons name={config.icon as any} size={18} color={config.color} style={{ marginTop: 2 }} />
      <View style={{ flex: 1 }}>
        <Text variant="bodyMedium">{title}</Text>
        {detail ? <Text variant="caption" color={colors.textSecondary} style={{ marginTop: spacing.xs }}>{detail}</Text> : null}
      </View>
    </View>
  );
}
