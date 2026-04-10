import { Pressable, Platform } from 'react-native';
import { Text } from './Text';
import { colors, spacing, radius } from '../constants/theme';

interface Props {
  label: string;
  onPress: () => void;
}

export function PromptChip({ label, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.lg,
        borderRadius: radius.full,
        borderWidth: 0.5,
        borderColor: colors.borderSubtle,
        backgroundColor: pressed ? colors.surfaceHover : 'transparent',
        ...(Platform.OS === 'web' ? { cursor: 'pointer', transition: 'background-color 0.15s ease' } : {}),
      })}
    >
      <Text variant="caption" color={colors.textSecondary}>{label}</Text>
    </Pressable>
  );
}
