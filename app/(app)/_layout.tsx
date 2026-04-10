import * as React from 'react';
import { View, useWindowDimensions } from 'react-native';
import { Slot, useRouter } from 'expo-router';
import { useAuth } from '../../lib/auth';
import { ensureBrainAgent } from '../../lib/agent';
import { useAiChat } from '../../lib/use-ai-chat';
import { useConversations } from '../../lib/hooks';
import { chatNavigationEvent } from '../../lib/chat-events';
import { Sidebar } from '../../components/Sidebar';
import { colors } from '../../constants/theme';

export const BrainContext = React.createContext<{
  agentId: string | null;
  conversations: any[];
  refreshConversations: () => void;
  chat: ReturnType<typeof useAiChat>;
}>({
  agentId: null,
  conversations: [],
  refreshConversations: () => {},
  chat: {} as any,
});

export function useBrain() {
  return React.useContext(BrainContext);
}

export default function AppLayout() {
  const { isAuthenticated, isLoading, sdk, user, signOut } = useAuth();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;

  const [agentId, setAgentId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/');
    }
  }, [isLoading, isAuthenticated]);

  React.useEffect(() => {
    if (sdk) {
      ensureBrainAgent(sdk).then(setAgentId).catch(console.warn);
    }
  }, [sdk]);

  const chat = useAiChat(sdk, agentId);
  const { conversations, refresh: refreshConversations } = useConversations(sdk, agentId);

  // Listen for chat navigation events (from sidebar conversation clicks)
  React.useEffect(() => {
    const unsubscribe = chatNavigationEvent.subscribe((event) => {
      if (event.type === 'new') {
        chat.clearMessages();
        router.push('/(app)');
      } else if (event.type === 'open' && event.conversationId) {
        chat.loadConversation(event.conversationId);
        router.push(`/(app)/chat/${event.conversationId}`);
      }
    });
    return unsubscribe;
  }, [chat.clearMessages, chat.loadConversation]);

  if (isLoading || !isAuthenticated) {
    return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  }

  return (
    <BrainContext.Provider value={{ agentId, conversations, refreshConversations, chat }}>
      <View style={{ flex: 1, flexDirection: 'row', backgroundColor: colors.bg }}>
        {isDesktop && (
          <Sidebar
            conversations={conversations}
            userName={user?.name}
            onNewChat={() => {
              chat.clearMessages();
              router.push('/(app)');
            }}
            onSignOut={signOut}
          />
        )}
        <View style={{ flex: 1 }}>
          <Slot />
        </View>
      </View>
    </BrainContext.Provider>
  );
}
