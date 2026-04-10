import * as React from 'react';
import { View, ScrollView, Pressable, Platform, Linking, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../lib/auth';
import { ORG_ID } from '../../lib/recursiv';
import { Text, Card, Button } from '../../components';
import { colors, spacing, radius } from '../../constants/theme';

interface Integration {
  provider: string;
  name: string;
  icon: string;
  description: string;
}

const INTEGRATIONS: Integration[] = [
  { provider: 'quickbooks', name: 'QuickBooks', icon: 'calculator-variant', description: 'Financial data, P&L, expenses' },
  { provider: 'stripe', name: 'Stripe', icon: 'credit-card-outline', description: 'Revenue, subscriptions, payments' },
  { provider: 'github', name: 'GitHub', icon: 'github', description: 'Repositories, commits, activity' },
];

function IntegrationItem({
  integration,
  connected,
  connecting,
  onConnect,
  onDisconnect,
}: {
  integration: Integration;
  connected: boolean;
  connecting: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}) {
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingVertical: spacing.lg, borderBottomWidth: 0.5, borderBottomColor: colors.borderSubtle,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 }}>
        <View style={{
          width: 36, height: 36, borderRadius: radius.md,
          backgroundColor: colors.glass, alignItems: 'center', justifyContent: 'center',
        }}>
          <MaterialCommunityIcons name={integration.icon as any} size={20} color={colors.textSecondary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="bodyMedium">{integration.name}</Text>
          <Text variant="caption" color={colors.textMuted}>{integration.description}</Text>
        </View>
      </View>
      {connecting ? (
        <ActivityIndicator size="small" color={colors.accent} />
      ) : connected ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
            <MaterialCommunityIcons name="check-circle" size={16} color={colors.success} />
            <Text variant="caption" color={colors.success}>Connected</Text>
          </View>
          <Pressable
            onPress={onDisconnect}
            style={Platform.OS === 'web' ? { cursor: 'pointer' } as any : {}}
          >
            <MaterialCommunityIcons name="close-circle-outline" size={16} color={colors.textMuted} />
          </Pressable>
        </View>
      ) : (
        <Pressable
          onPress={onConnect}
          style={{
            paddingVertical: spacing.xs, paddingHorizontal: spacing.md,
            borderRadius: radius.sm, backgroundColor: colors.accentMuted,
            ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
          } as any}
        >
          <Text variant="caption" color={colors.accent}>Connect</Text>
        </Pressable>
      )}
    </View>
  );
}

export default function SettingsScreen() {
  const { user, sdk, signOut } = useAuth();
  const [connections, setConnections] = React.useState<any[]>([]);
  const [connecting, setConnecting] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  // Fetch existing connections
  React.useEffect(() => {
    if (!sdk) return;
    (async () => {
      try {
        const res = await sdk.integrations.listConnections(ORG_ID);
        setConnections(res.data || []);
      } catch (err) {
        console.warn('Failed to load connections:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [sdk]);

  const isConnected = (provider: string) =>
    connections.some((c: any) => c.provider === provider);

  async function handleConnect(provider: string) {
    if (!sdk) return;
    setConnecting(provider);
    try {
      const currentUrl = Platform.OS === 'web'
        ? window.location.origin + '/(app)/settings'
        : 'https://minds-brain.on.recursiv.io/(app)/settings';

      const res = await sdk.integrations.connect({
        provider,
        organization_id: ORG_ID,
        redirect_url: currentUrl,
      });

      if (res.data?.already_connected) {
        // Already connected, refresh list
        const updated = await sdk.integrations.listConnections(ORG_ID);
        setConnections(updated.data || []);
      } else if (res.data?.auth_url) {
        // Open OAuth URL
        if (Platform.OS === 'web') {
          window.location.href = res.data.auth_url;
        } else {
          await Linking.openURL(res.data.auth_url);
        }
      }
    } catch (err: any) {
      console.warn('Connect failed:', err.message);
    } finally {
      setConnecting(null);
    }
  }

  async function handleDisconnect(provider: string) {
    if (!sdk) return;
    const conn = connections.find((c: any) => c.provider === provider);
    if (!conn) return;
    try {
      await sdk.integrations.disconnect(conn.id);
      setConnections(prev => prev.filter((c: any) => c.id !== conn.id));
    } catch (err: any) {
      console.warn('Disconnect failed:', err.message);
    }
  }

  // Check for OAuth callback (connection_id in URL params)
  React.useEffect(() => {
    if (Platform.OS !== 'web' || !sdk) return;
    const params = new URLSearchParams(window.location.search);
    const connectionId = params.get('connection_id');
    if (connectionId) {
      // Confirm the connection
      sdk.integrations.confirmConnection({ connection_id: connectionId })
        .then(async () => {
          const updated = await sdk.integrations.listConnections(ORG_ID);
          setConnections(updated.data || []);
          // Clean URL
          window.history.replaceState({}, '', window.location.pathname);
        })
        .catch((err: any) => console.warn('Confirm failed:', err.message));
    }
  }, [sdk]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{
        padding: spacing.xl,
        maxWidth: 640,
        width: '100%',
        alignSelf: 'center',
      }}
    >
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing['3xl'] }}>
        <MaterialCommunityIcons name="cog-outline" size={24} color={colors.accent} />
        <Text variant="h1">Settings</Text>
      </View>

      {/* Integrations */}
      <Text variant="h3" style={{ marginBottom: spacing.lg }}>Data Sources</Text>
      <Card variant="default" padding="xl" style={{ marginBottom: spacing['3xl'] }}>
        {INTEGRATIONS.map((integration) => (
          <IntegrationItem
            key={integration.provider}
            integration={integration}
            connected={isConnected(integration.provider)}
            connecting={connecting === integration.provider}
            onConnect={() => handleConnect(integration.provider)}
            onDisconnect={() => handleDisconnect(integration.provider)}
          />
        ))}
      </Card>

      {/* Account */}
      <Text variant="h3" style={{ marginBottom: spacing.lg }}>Account</Text>
      <Card variant="default" padding="xl" style={{ marginBottom: spacing['3xl'] }}>
        <View style={{ marginBottom: spacing.lg }}>
          <Text variant="label" color={colors.textMuted}>Name</Text>
          <Text variant="body" style={{ marginTop: spacing.xs }}>{user?.name || '--'}</Text>
        </View>
        <View style={{ marginBottom: spacing.xl }}>
          <Text variant="label" color={colors.textMuted}>Email</Text>
          <Text variant="body" style={{ marginTop: spacing.xs }}>{user?.email || '--'}</Text>
        </View>
        <Button variant="secondary" onPress={signOut}>Sign Out</Button>
      </Card>
    </ScrollView>
  );
}
