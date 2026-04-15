import * as React from 'react';
import {
  View, FlatList, TextInput, Pressable, Platform,
  Animated, KeyboardAvoidingView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../../lib/auth';
import { useBrain } from '../_layout';
import { useAiChat, type ChatMessage } from '../../../lib/use-ai-chat';
import { invalidate } from '../../../lib/cache';
import { Text } from '../../../components';
import { colors, spacing, radius, typography } from '../../../constants/theme';

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

  // Skip empty messages (tool calls with no visible content)
  if (!isUser && !isTyping && (!message.content || !message.content.trim())) {
    return null;
  }

  if (isUser) {
    return (
      <View style={{
        alignSelf: 'flex-end', maxWidth: '85%',
        backgroundColor: colors.accent, borderRadius: 16, padding: 12,
        marginBottom: spacing.sm,
      }}>
        <Text variant="body" color={colors.textInverse}>{message.content}</Text>
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
  const { id, message: initialMessage } = useLocalSearchParams<{ id: string; message?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { sdk } = useAuth();
  const { agentId, refreshConversations } = useBrain();

  const { messages, isStreaming, conversationId, sendMessage, loadConversation } = useAiChat(sdk, agentId);

  const [input, setInput] = React.useState('');
  const flatListRef = React.useRef<FlatList>(null);
  const sentInitial = React.useRef(false);

  // Handle new conversation from home screen OR load existing conversation
  React.useEffect(() => {
    if (id === 'new' && initialMessage && !sentInitial.current) {
      sentInitial.current = true;
      const decoded = decodeURIComponent(initialMessage);
      sendMessage(decoded, { newConversation: true }).then((convId) => {
        if (convId) {
          invalidate(`conversations:${agentId}`);
          refreshConversations();
          router.replace(`/(app)/chat/${convId}`);
        }
      });
    } else if (id && id !== 'new') {
      loadConversation(id);
    }
  }, [id]);

  async function handleSend() {
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput('');
    await sendMessage(text);
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
          onPress={() => router.push('/(app)')}
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
          style={[{
            width: 40, height: 40, borderRadius: 20,
            backgroundColor: input.trim() && !isStreaming ? colors.accent : colors.glass,
            alignItems: 'center' as const, justifyContent: 'center' as const,
            opacity: isStreaming ? 0.5 : 1,
          }, Platform.OS === 'web' ? { cursor: input.trim() && !isStreaming ? 'pointer' : 'default' } as any : {}]}
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
