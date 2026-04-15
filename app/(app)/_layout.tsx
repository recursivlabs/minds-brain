import * as React from 'react';
import { View, Pressable, Animated, Platform, useWindowDimensions } from 'react-native';
import { Slot, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../lib/auth';
import { ensureBrainAgent } from '../../lib/agent';
import { useConversations } from '../../lib/hooks';
import { chatNavigationEvent } from '../../lib/chat-events';
import { Sidebar } from '../../components/Sidebar';
import { Text } from '../../components';
import { colors, spacing } from '../../constants/theme';

export const BrainContext = React.createContext<{
  agentId: string | null;
  conversations: any[];
  refreshConversations: () => void;
  toggleSidebar: () => void;
}>({
  agentId: null,
  conversations: [],
  refreshConversations: () => {},
  toggleSidebar: () => {},
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
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const slideAnim = React.useRef(new Animated.Value(-280)).current;

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

  const toggleSidebar = React.useCallback(() => {
    const toValue = sidebarOpen ? -280 : 0;
    setSidebarOpen(!sidebarOpen);
    Animated.timing(slideAnim, {
      toValue,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [sidebarOpen, slideAnim]);

  const closeSidebar = React.useCallback(() => {
    if (!sidebarOpen) return;
    setSidebarOpen(false);
    Animated.timing(slideAnim, {
      toValue: -280,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [sidebarOpen, slideAnim]);

  // Close sidebar on navigation
  React.useEffect(() => {
    const unsubscribe = chatNavigationEvent.subscribe((event) => {
      closeSidebar();
      if (event.type === 'new') {
        router.push('/(app)');
      } else if (event.type === 'open' && event.conversationId) {
        router.push(`/(app)/chat/${event.conversationId}`);
      }
    });
    return unsubscribe;
  }, [closeSidebar]);

  if (isLoading || !isAuthenticated) {
    return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  }

  return (
    <BrainContext.Provider value={{ agentId, conversations, refreshConversations, toggleSidebar }}>
      <View style={{ flex: 1, flexDirection: 'row', backgroundColor: colors.bg }}>
        {/* Desktop: static sidebar */}
        {isDesktop && (
          <Sidebar
            conversations={conversations}
            userName={user?.name}
            onNewChat={() => router.push('/(app)')}
            onSignOut={signOut}
          />
        )}

        {/* Mobile: overlay sidebar */}
        {!isDesktop && (
          <>
            {/* Scrim */}
            {sidebarOpen && (
              <Pressable
                onPress={closeSidebar}
                style={{
                  position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                  backgroundColor: colors.overlay, zIndex: 10,
                }}
              />
            )}
            {/* Sliding sidebar */}
            <Animated.View style={{
              position: 'absolute', top: 0, left: 0, bottom: 0,
              width: 280, zIndex: 11,
              transform: [{ translateX: slideAnim }],
            }}>
              <Sidebar
                conversations={conversations}
                userName={user?.name}
                onNewChat={() => { closeSidebar(); router.push('/(app)'); }}
                onSignOut={() => { closeSidebar(); signOut(); }}
              />
            </Animated.View>
          </>
        )}

        {/* Main content */}
        <View style={{ flex: 1 }}>
          {/* Mobile header with hamburger */}
          {!isDesktop && (
            <View style={{
              flexDirection: 'row', alignItems: 'center',
              paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
              borderBottomWidth: 0.5, borderBottomColor: colors.borderSubtle,
            }}>
              <Pressable
                onPress={toggleSidebar}
                style={Platform.OS === 'web' ? { cursor: 'pointer' } as any : {}}
              >
                <MaterialCommunityIcons name="menu" size={24} color={colors.text} />
              </Pressable>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text variant="h2" color={colors.accent} style={{ letterSpacing: 4, fontWeight: '300', fontSize: 16 }}>
                  minds
                </Text>
              </View>
              <Pressable
                onPress={() => router.push('/(app)')}
                style={Platform.OS === 'web' ? { cursor: 'pointer' } as any : {}}
              >
                <MaterialCommunityIcons name="plus" size={24} color={colors.text} />
              </Pressable>
            </View>
          )}
          <Slot />
        </View>
      </View>
    </BrainContext.Provider>
  );
}

