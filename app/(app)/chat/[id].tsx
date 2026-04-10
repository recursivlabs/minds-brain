import * as React from 'react';
import {
  View, FlatList, TextInput, Pressable, Platform,
  Animated, KeyboardAvoidingView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBrain } from '../_layout';
import { invalidate } from '../../../lib/cache';
import { Text } from '../../../components';
import { colors, spacing, radius, typography } from '../../../constants/theme';
import type { ChatMessage } from '../../../lib/use-ai-chat';

// ─── Typing Indicator ────────────────────────────────────────

function TypingIndicator() {
  const dots = React.useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  React.useEffect(() => {
    const animations = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 150),
          Animated.timing(dot, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
        ])
      )
    );
    animations.forEach((a) => a.start());
    return () => animations.forEach((a) => a.stop());
  }, [dots]);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, height: 22, paddingHorizontal: 4 }}>
      {dots.map((dot, i) => (
        <Animated.View
          key={i}
          style={{
            width: 8, height: 8, borderRadius: 4,
            backgroundColor: colors.textMuted,
            transform: [{ translateY: dot.interpolate({ inputRange: [0, 1], outputRange: [0, -6] }) }],
          }}
        />
      ))}
    </View>
  );
}

// ─── Message Bubble ──────────────────────────────────────────

const MessageBubble = React.memo(function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  const isTyping = message.isStreaming && !message.content;

  if (isUser) {
    return (
      <View style={{
        alignSelf: 'flex-end', maxWidth: '85%',
        backgroundColor: colors.accent, borderRadius: 16, padding: 12,
        marginBottom: spacing.sm,
      }}>
        <Text variant="body" color="#fff">{message.content}</Text>
      </View>
    );
  }

  if (isTyping) {
    return (
      <View style={{
        alignSelf: 'flex-start', maxWidth: '85%',
        backgroundColor: colors.surfaceRaised, borderRadius: 16, padding: 12,
        marginBottom: spacing.sm,
      }}>
        <TypingIndicator />
      </View>
    );
  }

  // Assistant message with simple markdown rendering
  const renderContent = () => {
    if (Platform.OS === 'web') {
      const html = message.content
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, `<code style="background:rgba(255,255,255,0.08);padding:1px 4px;border-radius:3px;font-size:13px">$1</code>`)
        .replace(/^### (.*$)/gm, '<h4 style="font-size:15px;font-weight:600;margin:8px 0 4px">$1</h4>')
        .replace(/^## (.*$)/gm, '<h3 style="font-size:17px;font-weight:600;margin:10px 0 4px">$1</h3>')
        .replace(/^# (.*$)/gm, '<h2 style="font-size:20px;font-weight:700;margin:12px 0 6px">$1</h2>')
        .replace(/^- (.*$)/gm, '<div style="padding-left:12px;margin-bottom:2px">&bull; $1</div>')
        .replace(/\n/g, '<br/>');
      return (
        <div
          style={{
            color: colors.text, fontSize: 15, lineHeight: '22px',
            fontFamily: 'Geist-Regular', wordBreak: 'break-word',
          }}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
    }
    return <Text variant="body">{message.content}</Text>;
  };

  return (
    <View style={{
      alignSelf: 'flex-start', maxWidth: '85%',
      backgroundColor: colors.surfaceRaised, borderRadius: 16, padding: 12,
      marginBottom: spacing.sm,
    }}>
      {renderContent()}
    </View>
  );
});

// ─── Chat Screen ─────────────────────────────────────────────

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { agentId, refreshConversations, chat } = useBrain();
  const { messages, isStreaming, sendMessage, loadConversation } = chat;
  const [input, setInput] = React.useState('');
  const flatListRef = React.useRef<FlatList>(null);

  // Load conversation if navigating to a specific one
  React.useEffect(() => {
    if (id && chat.conversationId !== id) {
      loadConversation(id);
    }
  }, [id]);

  async function handleSend() {
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput('');
    await sendMessage(text);
    // Refresh sidebar conversations
    if (agentId) {
      invalidate(`conversations:${agentId}`);
      refreshConversations();
    }
  }

  // Auto-scroll on new messages
  React.useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length, messages[messages.length - 1]?.content]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: spacing.md,
        paddingHorizontal: spacing.xl, paddingVertical: spacing.md,
        paddingTop: Platform.OS === 'web' ? spacing.md : insets.top + spacing.sm,
        borderBottomWidth: 0.5, borderBottomColor: colors.borderSubtle,
      }}>
        <Pressable
          onPress={() => router.push('/(app)')}
          style={Platform.OS === 'web' ? { cursor: 'pointer' } as any : {}}
        >
          <MaterialCommunityIcons name="arrow-left" size={22} color={colors.textSecondary} />
        </Pressable>
        <MaterialCommunityIcons name="brain" size={20} color={colors.accent} />
        <Text variant="h3">Minds Brain</Text>
        <View style={{ flex: 1 }} />
        <Pressable
          onPress={() => {
            chat.clearMessages();
            router.push('/(app)');
          }}
          style={Platform.OS === 'web' ? { cursor: 'pointer' } as any : {}}
        >
          <MaterialCommunityIcons name="plus" size={22} color={colors.textSecondary} />
        </Pressable>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          padding: spacing.xl, paddingBottom: spacing['3xl'],
          maxWidth: 720, width: '100%', alignSelf: 'center',
        }}
        renderItem={({ item }) => <MessageBubble message={item} />}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingTop: spacing['6xl'] }}>
            <Text variant="body" color={colors.textMuted}>Start the conversation</Text>
          </View>
        }
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {/* Input */}
      <View style={{
        flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm,
        paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
        paddingBottom: Platform.OS === 'web' ? spacing.md : insets.bottom || spacing.md,
        borderTopWidth: 0.5, borderTopColor: colors.borderSubtle,
        backgroundColor: colors.bg,
        maxWidth: 720, width: '100%', alignSelf: 'center',
      }}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Ask a follow-up..."
          placeholderTextColor={colors.textMuted}
          multiline
          editable={!isStreaming}
          returnKeyType="send"
          onSubmitEditing={handleSend}
          onKeyPress={(e: any) => {
            if (Platform.OS === 'web' && e.nativeEvent.key === 'Enter' && !e.nativeEvent.shiftKey) {
              e.preventDefault();
              handleSend();
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
          onPress={input.trim() && !isStreaming ? handleSend : undefined}
          style={{
            width: 40, height: 40, borderRadius: 20,
            backgroundColor: input.trim() && !isStreaming ? colors.accent : colors.glass,
            alignItems: 'center', justifyContent: 'center',
            opacity: isStreaming ? 0.5 : 1,
            ...(Platform.OS === 'web' ? { cursor: input.trim() && !isStreaming ? 'pointer' : 'default' } : {}),
          } as any}
        >
          <MaterialCommunityIcons
            name="send"
            size={18}
            color={input.trim() && !isStreaming ? colors.textInverse : colors.textMuted}
          />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
