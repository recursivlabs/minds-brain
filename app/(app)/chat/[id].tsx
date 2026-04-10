import * as React from 'react';
import { View, FlatList, ActivityIndicator, Pressable, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../../lib/auth';
import { useBrain } from '../_layout';
import { useMessages } from '../../../lib/hooks';
import { invalidate } from '../../../lib/cache';
import { Text } from '../../../components';
import { ChatBubble } from '../../../components/ChatBubble';
import { ChatInput } from '../../../components/ChatInput';
import { colors, spacing } from '../../../constants/theme';

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { sdk, user } = useAuth();
  const { agentId, refreshConversations } = useBrain();
  const { messages, setMessages, loading } = useMessages(sdk, id);
  const [input, setInput] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const flatListRef = React.useRef<FlatList>(null);

  // Sort messages oldest first
  const sorted = React.useMemo(() =>
    [...messages].sort((a, b) =>
      new Date(a.created_at || a.createdAt).getTime() - new Date(b.created_at || b.createdAt).getTime()
    ), [messages]);

  async function handleSend() {
    const text = input.trim();
    if (!text || !sdk || !agentId || sending) return;
    setSending(true);
    setInput('');

    // Optimistic insert
    const tempMsg = {
      id: 'temp-' + Date.now(),
      content: text,
      sender_id: user?.id,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempMsg]);

    try {
      const res = await sdk.agents.chat(agentId, {
        message: text,
        conversation_id: id,
      });

      // Add agent response
      const reply = res.data || res;
      if (reply.content || reply.message) {
        setMessages(prev => [...prev.filter(m => m.id !== tempMsg.id), tempMsg, {
          id: 'reply-' + Date.now(),
          content: reply.content || reply.message,
          sender_id: agentId,
          created_at: new Date().toISOString(),
        }]);
      }

      invalidate(`conversations:${agentId}`);
      refreshConversations();
    } catch (err) {
      console.warn('Send failed:', err);
    } finally {
      setSending(false);
    }
  }

  React.useEffect(() => {
    if (sorted.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [sorted.length]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: spacing.md,
        paddingHorizontal: spacing.xl, paddingVertical: spacing.md,
        borderBottomWidth: 0.5, borderBottomColor: colors.borderSubtle,
      }}>
        <Pressable
          onPress={() => router.push('/(app)')}
          style={Platform.OS === 'web' ? { cursor: 'pointer' } : {}}
        >
          <MaterialCommunityIcons name="arrow-left" size={22} color={colors.textSecondary} />
        </Pressable>
        <MaterialCommunityIcons name="brain" size={20} color={colors.accent} />
        <Text variant="h3">Minds Brain</Text>
      </View>

      {/* Messages */}
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={sorted}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            padding: spacing.xl, paddingBottom: spacing['3xl'],
            maxWidth: 720, width: '100%', alignSelf: 'center',
          }}
          renderItem={({ item }) => (
            <ChatBubble
              content={item.content || item.text || item.body || ''}
              isUser={item.sender_id === user?.id}
              timestamp={item.created_at || item.createdAt}
            />
          )}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingTop: spacing['6xl'] }}>
              <Text variant="body" color={colors.textMuted}>Start the conversation</Text>
            </View>
          }
        />
      )}

      {/* Typing indicator */}
      {sending && (
        <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.sm, maxWidth: 720, width: '100%', alignSelf: 'center' }}>
          <View style={{
            alignSelf: 'flex-start', backgroundColor: colors.surfaceRaised,
            paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
            borderRadius: 12, flexDirection: 'row', gap: 4,
          }}>
            <Text variant="caption" color={colors.textMuted}>Thinking...</Text>
          </View>
        </View>
      )}

      {/* Input */}
      <View style={{ maxWidth: 720, width: '100%', alignSelf: 'center' }}>
        <ChatInput
          value={input}
          onChangeText={setInput}
          onSend={handleSend}
          placeholder="Ask a follow-up..."
          disabled={sending}
        />
      </View>
    </View>
  );
}
