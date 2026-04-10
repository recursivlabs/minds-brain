import * as React from 'react';
import { View, Platform } from 'react-native';
import { Text } from './Text';
import { colors, spacing, radius } from '../constants/theme';

interface Props {
  content: string;
  isUser: boolean;
  timestamp?: string;
}

export const ChatBubble = React.memo(function ChatBubble({ content, isUser, timestamp }: Props) {
  const textColor = isUser ? '#fff' : colors.text;

  const formattedTime = timestamp
    ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  const renderContent = () => {
    if (Platform.OS === 'web') {
      // Simple markdown: **bold**, `code`, line breaks
      const html = content
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/`(.*?)`/g, `<code style="background:rgba(255,255,255,0.1);padding:1px 4px;border-radius:3px;font-size:13px">$1</code>`)
        .replace(/\n/g, '<br/>');
      return (
        <div
          style={{
            color: textColor, fontSize: 15, lineHeight: '22px',
            fontFamily: 'Geist-Regular', wordBreak: 'break-word',
          }}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
    }

    return <Text variant="body" color={textColor}>{content}</Text>;
  };

  return (
    <View style={{
      alignSelf: isUser ? 'flex-end' : 'flex-start',
      maxWidth: '80%', marginBottom: spacing.sm,
    }}>
      <View style={{
        backgroundColor: isUser ? colors.accent : colors.surfaceRaised,
        paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
        borderRadius: radius.lg,
        borderBottomRightRadius: isUser ? radius.sm : radius.lg,
        borderBottomLeftRadius: isUser ? radius.lg : radius.sm,
      }}>
        {renderContent()}
      </View>
      {formattedTime ? (
        <Text variant="caption" color={colors.textMuted} style={{
          marginTop: spacing.xs, alignSelf: isUser ? 'flex-end' : 'flex-start', fontSize: 11,
        }}>
          {formattedTime}
        </Text>
      ) : null}
    </View>
  );
});
