import * as React from 'react';
import { View, TextInput, Pressable, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, radius, typography } from '../constants/theme';

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
}

export function ChatInput({ value, onChangeText, onSend, placeholder, disabled, autoFocus }: Props) {
  const canSend = value.trim().length > 0 && !disabled;

  return (
    <View style={{
      flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm,
      paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
      borderTopWidth: 0.5, borderTopColor: colors.borderSubtle,
      backgroundColor: colors.bg,
    }}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder || 'Ask anything...'}
        placeholderTextColor={colors.textMuted}
        multiline
        autoFocus={autoFocus}
        onKeyPress={(e: any) => {
          if (Platform.OS === 'web' && e.nativeEvent.key === 'Enter' && !e.nativeEvent.shiftKey) {
            e.preventDefault();
            if (canSend) onSend();
          }
        }}
        style={{
          flex: 1, maxHeight: 120,
          backgroundColor: colors.glass,
          borderWidth: 0.5, borderColor: colors.glassBorder,
          borderRadius: radius.lg,
          paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
          color: colors.text,
          ...typography.body,
          ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}),
        }}
      />
      <Pressable
        onPress={canSend ? onSend : undefined}
        style={{
          width: 40, height: 40, borderRadius: radius.full,
          backgroundColor: canSend ? colors.accent : colors.glass,
          alignItems: 'center', justifyContent: 'center',
          ...(Platform.OS === 'web' ? { cursor: canSend ? 'pointer' : 'default' } : {}),
        }}
      >
        <MaterialCommunityIcons
          name="arrow-up"
          size={20}
          color={canSend ? colors.textInverse : colors.textMuted}
        />
      </Pressable>
    </View>
  );
}
