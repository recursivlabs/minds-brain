import * as React from 'react';
import { View, useWindowDimensions } from 'react-native';
import { Slot, useRouter } from 'expo-router';
import { useAuth } from '../../lib/auth';
import { ensureBrainAgent } from '../../lib/agent';
import { useConversations } from '../../lib/hooks';
import { chatNavigationEvent } from '../../lib/chat-events';
import { Sidebar } from '../../components/Sidebar';
import { colors } from '../../constants/theme';

export const BrainContext = React.createContext<{
  agentId: string | null;
  conversations: any[];
  refreshConversations: () => void;
}>({
  agentId: null,
  conversations: [],
  refreshConversations: () => {},
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

  const { conversations, refresh: refreshConversations } = useConversations(sdk, agentId);

  // Listen for chat navigation events (from sidebar conversation clicks)
  React.useEffect(() => {
    const unsubscribe = chatNavigationEvent.subscribe((event) => {
      if (event.type === 'new') {
        router.push('/(app)');
      } else if (event.type === 'open' && event.conversationId) {
        router.push(`/(app)/chat/${event.conversationId}`);
      }
    });
    return unsubscribe;
  }, []);

  if (isLoading || !isAuthenticated) {
    return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  }

  return (
    <BrainContext.Provider value={{ agentId, conversations, refreshConversations }}>
      <View style={{ flex: 1, flexDirection: 'row', backgroundColor: colors.bg }}>
        {isDesktop && (
          <Sidebar
            conversations={conversations}
            userName={user?.name}
            onNewChat={() => router.push('/(app)')}
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
