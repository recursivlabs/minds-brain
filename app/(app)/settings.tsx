import * as React from 'react';
import { View, ScrollView, Pressable, Platform, Linking, ActivityIndicator, TextInput, Modal } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../lib/auth';
import { ORG_ID, PROJECT_ID, BASE_URL } from '../../lib/recursiv';
import * as storage from '../../lib/storage';
import { ensureBrainAgent } from '../../lib/agent';
import { Text, Card, Button, Input } from '../../components';
import { colors, spacing, radius, typography } from '../../constants/theme';

type GrantStatus = 'idle' | 'pending' | 'granted' | 'failed';
type SettingsTab = 'integrations' | 'knowledge' | 'account';

const BUCKET_NAME = 'knowledge-base';

// ── Popular integrations shown by default ──────────────────────

const POPULAR_PROVIDERS = [
  'quickbooks', 'stripe', 'gmail', 'slack', 'github',
  'hubspot', 'google_calendar', 'notion', 'salesforce',
  'google_sheets', 'jira', 'linear', 'discord', 'dropbox',
  'google_drive', 'airtable', 'monday',
];

const PROVIDER_META: Record<string, { name: string; icon: string; category: string }> = {
  quickbooks: { name: 'QuickBooks', icon: 'calculator-variant', category: 'Finance' },
  stripe: { name: 'Stripe', icon: 'credit-card-outline', category: 'Finance' },
  gmail: { name: 'Gmail', icon: 'email-outline', category: 'Email' },
  slack: { name: 'Slack', icon: 'message-text-outline', category: 'Messaging' },
  github: { name: 'GitHub', icon: 'github', category: 'Developer' },
  hubspot: { name: 'HubSpot', icon: 'account-group-outline', category: 'CRM' },
  google_calendar: { name: 'Google Calendar', icon: 'calendar', category: 'Productivity' },
  notion: { name: 'Notion', icon: 'notebook-outline', category: 'Productivity' },
  salesforce: { name: 'Salesforce', icon: 'cloud-outline', category: 'CRM' },
  google_sheets: { name: 'Google Sheets', icon: 'table', category: 'Productivity' },
  jira: { name: 'Jira', icon: 'ticket-outline', category: 'Project Management' },
  linear: { name: 'Linear', icon: 'ray-start-arrow', category: 'Project Management' },
  discord: { name: 'Discord', icon: 'message-outline', category: 'Messaging' },
  dropbox: { name: 'Dropbox', icon: 'dropbox', category: 'Storage' },
  google_drive: { name: 'Google Drive', icon: 'google-drive', category: 'Storage' },
  airtable: { name: 'Airtable', icon: 'table-large', category: 'Productivity' },
  monday: { name: 'Monday.com', icon: 'view-grid-outline', category: 'Project Management' },
};

// ── Tab selector ────────────────────────────────────────────────

function TabBar({ active, onChange }: { active: SettingsTab; onChange: (t: SettingsTab) => void }) {
  const tabs: { key: SettingsTab; label: string; icon: string }[] = [
    { key: 'integrations', label: 'Integrations', icon: 'power-plug-outline' },
    { key: 'knowledge', label: 'Knowledge Base', icon: 'file-document-outline' },
    { key: 'account', label: 'Account', icon: 'account-outline' },
  ];
  return (
    <View style={{
      flexDirection: 'row', gap: spacing.xs,
      marginBottom: spacing['2xl'], borderBottomWidth: 0.5, borderBottomColor: colors.borderSubtle,
    }}>
      {tabs.map(t => (
        <Pressable
          key={t.key}
          onPress={() => onChange(t.key)}
          style={{
            flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
            paddingVertical: spacing.md, paddingHorizontal: spacing.lg,
            borderBottomWidth: 2, borderBottomColor: active === t.key ? colors.accent : 'transparent',
            ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
          } as any}
        >
          <MaterialCommunityIcons name={t.icon as any} size={16} color={active === t.key ? colors.accent : colors.textMuted} />
          <Text variant="bodyMedium" color={active === t.key ? colors.text : colors.textMuted}>{t.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

// ── Integration item ────────────────────────────────────────────

function IntegrationRow({
  provider, name, icon, connected, grantStatus, connecting,
  onConnect, onDisconnect, onGrantAccess,
}: {
  provider: string; name: string; icon: string;
  connected: boolean; grantStatus: GrantStatus; connecting: boolean;
  onConnect: () => void; onDisconnect: () => void; onGrantAccess: () => void;
}) {
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingVertical: spacing.md, paddingHorizontal: spacing.lg,
      borderBottomWidth: 0.5, borderBottomColor: colors.borderSubtle,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 }}>
        <View style={{
          width: 32, height: 32, borderRadius: radius.sm,
          backgroundColor: colors.glass, alignItems: 'center', justifyContent: 'center',
        }}>
          <MaterialCommunityIcons name={icon as any} size={18} color={colors.textSecondary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="body">{name}</Text>
          {connected && grantStatus === 'granted' && (
            <Text variant="caption" color={colors.success}>Brain has access</Text>
          )}
          {connected && grantStatus === 'failed' && (
            <Pressable onPress={onGrantAccess} style={Platform.OS === 'web' ? { cursor: 'pointer' } as any : {}}>
              <Text variant="caption" color={colors.error}>Grant failed — tap to retry</Text>
            </Pressable>
          )}
        </View>
      </View>
      {connecting ? (
        <ActivityIndicator size="small" color={colors.accent} />
      ) : connected ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <MaterialCommunityIcons name="check-circle" size={16} color={colors.success} />
          <Pressable onPress={onDisconnect} style={Platform.OS === 'web' ? { cursor: 'pointer' } as any : {}}>
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

// ── File item ───────────────────────────────────────────────────

function FileRow({ file, onDelete, onDownload }: {
  file: { key: string; size?: number; last_modified?: string };
  onDelete: () => void;
  onDownload: () => void;
}) {
  const name = file.key.split('/').pop() || file.key;
  const sizeStr = file.size ? (file.size > 1048576 ? `${(file.size / 1048576).toFixed(1)} MB` : `${(file.size / 1024).toFixed(0)} KB`) : '';

  return (
    <Pressable
      onPress={onDownload}
      style={{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingVertical: spacing.md, paddingHorizontal: spacing.lg,
        borderBottomWidth: 0.5, borderBottomColor: colors.borderSubtle,
        ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
      } as any}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 }}>
        <MaterialCommunityIcons name="file-outline" size={18} color={colors.textSecondary} />
        <View style={{ flex: 1 }}>
          <Text variant="body" numberOfLines={1}>{name}</Text>
          {sizeStr ? <Text variant="caption" color={colors.textMuted}>{sizeStr}</Text> : null}
        </View>
      </View>
      <Pressable
        onPress={(e) => { e.stopPropagation?.(); onDelete(); }}
        style={Platform.OS === 'web' ? { cursor: 'pointer' } as any : {}}
      >
        <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.textMuted} />
      </Pressable>
    </Pressable>
  );
}

// ── Main settings screen ────────────────────────────────────────

export default function SettingsScreen() {
  const { user, sdk, signOut } = useAuth();
  const [tab, setTab] = React.useState<SettingsTab>('integrations');

  // ── Integrations state ──
  const [connections, setConnections] = React.useState<any[]>([]);
  const [connecting, setConnecting] = React.useState<string | null>(null);
  const [grantStatus, setGrantStatus] = React.useState<Record<string, GrantStatus>>({});
  const [searchQuery, setSearchQuery] = React.useState('');
  const [searchResults, setSearchResults] = React.useState<any[] | null>(null);
  const [searching, setSearching] = React.useState(false);
  const [apiKeyModal, setApiKeyModal] = React.useState<{ provider: string; name: string; fields: any[] } | null>(null);
  const [apiKeyValue, setApiKeyValue] = React.useState('');
  const [apiKeySubmitting, setApiKeySubmitting] = React.useState(false);

  // ── Knowledge base state ──
  const [files, setFiles] = React.useState<any[]>([]);
  const [uploading, setUploading] = React.useState(false);
  const [loadingFiles, setLoadingFiles] = React.useState(true);

  // ── Load connections ──
  React.useEffect(() => {
    if (!sdk) return;
    sdk.integrations.listConnections(ORG_ID)
      .then(res => setConnections(res.data || []))
      .catch(err => console.warn('Failed to load connections:', err));
  }, [sdk]);

  // ── Load files ──
  React.useEffect(() => {
    if (!sdk) return;
    (async () => {
      try {
        await sdk.storage.ensureBucket({ project_id: PROJECT_ID, name: BUCKET_NAME });
        const res = await sdk.storage.listItems({ project_id: PROJECT_ID, bucket_name: BUCKET_NAME });
        setFiles((res.data || []).filter((f: any) => !f.key.endsWith('/')));
      } catch (err) {
        console.warn('Failed to load files:', err);
      } finally {
        setLoadingFiles(false);
      }
    })();
  }, [sdk]);

  const isConnected = (provider: string) => connections.some((c: any) => c.provider === provider);
  const getConnection = (provider: string) => connections.find((c: any) => c.provider === provider);

  // ── Search integrations ──
  React.useEffect(() => {
    if (!sdk || !searchQuery.trim()) { setSearchResults(null); return; }
    const timeout = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await sdk.integrations.listApps({ search: searchQuery.trim() });
        setSearchResults(res.data || []);
      } catch { setSearchResults([]); }
      finally { setSearching(false); }
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery, sdk]);

  // ── Connect integration ──
  async function handleConnect(provider: string) {
    if (!sdk) return;
    setConnecting(provider);
    try {
      // Check auth type first
      const authInfo = await sdk.integrations.getAuthInfo(provider);
      const schemes = authInfo.data?.auth_schemes || [];
      const hasOAuth = schemes.some((s: string) => s === 'OAUTH2' || s === 'OAUTH1');
      const hasApiKey = schemes.some((s: string) => s === 'API_KEY' || s === 'BEARER_TOKEN' || s === 'BASIC');

      if (!hasOAuth && hasApiKey) {
        // Fetch required fields from Composio for this auth type
        const authScheme = schemes.find((s: string) => s === 'API_KEY') || schemes[0];
        let fields: any[] = [];
        try {
          const fieldsRes = await sdk.integrations.getAuthConfigFields(provider, authScheme as any);
          fields = fieldsRes.data?.required || [];
        } catch {
          // Fallback: generic API key field
          fields = [{ name: 'api_key', display_name: 'API Key', description: 'Your API key', type: 'string', required: true }];
        }

        const name = PROVIDER_META[provider]?.name || provider;
        setApiKeyModal({ provider, name, fields });
        setApiKeyValue('');
        setConnecting(null);
        return;
      }

      // OAuth flow
      const currentUrl = Platform.OS === 'web'
        ? window.location.origin + '/(app)/settings'
        : 'https://minds-brain.on.recursiv.io/(app)/settings';
      const res = await sdk.integrations.connect({ provider, organization_id: ORG_ID, redirect_url: currentUrl });
      if (res.data?.already_connected) {
        const updated = await sdk.integrations.listConnections(ORG_ID);
        setConnections(updated.data || []);
      } else if (res.data?.auth_url) {
        if (Platform.OS === 'web') window.location.href = res.data.auth_url;
        else await Linking.openURL(res.data.auth_url);
      }
    } catch (err: any) { console.warn('Connect failed:', err.message); }
    finally { setConnecting(null); }
  }

  // ── Submit API key ──
  async function handleApiKeySubmit() {
    if (!sdk || !apiKeyModal || !apiKeyValue.trim()) return;
    setApiKeySubmitting(true);
    try {
      // Build credentials using the actual field name from Composio
      const fieldName = apiKeyModal.fields?.[0]?.name || 'api_key';
      const credentials: Record<string, string> = { [fieldName]: apiKeyValue.trim() };

      // Get the API key from storage for auth header
      const storedKey = await storage.getItem('brain:api_key');

      // Direct fetch to the connect-apikey endpoint
      const res = await fetch(`${BASE_URL}/integrations/connections/connect-apikey`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(storedKey ? { 'Authorization': `Bearer ${storedKey}` } : {}),
        },
        body: JSON.stringify({
          provider: apiKeyModal.provider,
          organization_id: ORG_ID,
          credentials,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(`${res.status} ${JSON.stringify(err)}`);
      }

      // Refresh connections
      const updated = await sdk.integrations.listConnections(ORG_ID);
      setConnections(updated.data || []);
      // Grant agent access
      const newConn = (updated.data || []).find((c: any) => c.provider === apiKeyModal.provider);
      if (newConn) await grantAgentAccess(newConn.id, apiKeyModal.provider);
      setApiKeyModal(null);
      setApiKeyValue('');
    } catch (err: any) {
      console.warn('API key connect failed:', err.message);
    } finally {
      setApiKeySubmitting(false);
    }
  }

  async function handleDisconnect(provider: string) {
    if (!sdk) return;
    const conn = getConnection(provider);
    if (!conn) return;
    try {
      await sdk.integrations.disconnect(conn.id);
      setConnections(prev => prev.filter((c: any) => c.id !== conn.id));
      setGrantStatus(prev => { const next = { ...prev }; delete next[provider]; return next; });
    } catch (err: any) { console.warn('Disconnect failed:', err.message); }
  }

  // ── Grant agent access ──
  async function grantAgentAccess(integrationId: string, provider: string) {
    if (!sdk) return;
    setGrantStatus(prev => ({ ...prev, [provider]: 'pending' }));
    try {
      const agentId = await ensureBrainAgent(sdk);
      await sdk.integrations.updateAgentIntegration(agentId, { user_integration_id: integrationId, enabled: true });
      setGrantStatus(prev => ({ ...prev, [provider]: 'granted' }));
    } catch (err: any) {
      console.error('[Settings] Grant failed:', provider, err);
      setGrantStatus(prev => ({ ...prev, [provider]: 'failed' }));
    }
  }

  // ── OAuth callback ──
  React.useEffect(() => {
    if (Platform.OS !== 'web' || !sdk) return;
    const params = new URLSearchParams(window.location.search);
    const connectionId = params.get('connection_id');
    if (connectionId) {
      sdk.integrations.confirmConnection({ connection_id: connectionId })
        .then(async () => {
          const updated = await sdk.integrations.listConnections(ORG_ID);
          setConnections(updated.data || []);
          for (const conn of (updated.data || [])) {
            await grantAgentAccess(conn.id, conn.provider);
          }
          window.history.replaceState({}, '', window.location.pathname);
        })
        .catch(err => console.warn('Confirm failed:', err.message));
    }
  }, [sdk]);

  // ── Auto-grant on load ──
  React.useEffect(() => {
    if (connections.length === 0 || !sdk) return;
    connections.forEach((conn: any) => {
      if (!grantStatus[conn.provider]) grantAgentAccess(conn.id, conn.provider);
    });
  }, [connections.length, sdk]);

  // ── File upload ──
  async function handleFileUpload() {
    if (!sdk || Platform.OS !== 'web') return;
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.onchange = async () => {
      if (!input.files?.length) return;
      setUploading(true);
      try {
        for (const file of Array.from(input.files)) {
          const key = `uploads/${file.name}`;
          const res = await sdk.storage.getUploadUrl({
            project_id: PROJECT_ID, bucket_name: BUCKET_NAME, key, content_type: file.type,
          });
          if (res.data?.url) {
            await fetch(res.data.url, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
          }
        }
        // Refresh file list
        const res = await sdk.storage.listItems({ project_id: PROJECT_ID, bucket_name: BUCKET_NAME });
        setFiles((res.data || []).filter((f: any) => !f.key.endsWith('/')));
      } catch (err: any) { console.warn('Upload failed:', err.message); }
      finally { setUploading(false); }
    };
    input.click();
  }

  async function handleFileDelete(key: string) {
    if (!sdk) return;
    try {
      await sdk.storage.deleteObject({ project_id: PROJECT_ID, bucket_name: BUCKET_NAME, key });
      setFiles(prev => prev.filter((f: any) => f.key !== key));
    } catch (err: any) { console.warn('Delete failed:', err.message); }
  }

  async function handleFileDownload(key: string) {
    if (!sdk) return;
    try {
      const res = await sdk.storage.getDownloadUrl({ project_id: PROJECT_ID, bucket_name: BUCKET_NAME, key });
      if (res.data?.url && Platform.OS === 'web') window.open(res.data.url, '_blank');
    } catch (err: any) { console.warn('Download failed:', err.message); }
  }

  // ── Which integrations to show ──
  const displayIntegrations = searchResults !== null
    ? searchResults.map((app: any) => ({
        provider: app.id || app.name?.toLowerCase().replace(/\s+/g, '_'),
        name: app.name,
        icon: PROVIDER_META[app.id]?.icon || 'power-plug-outline',
      }))
    : POPULAR_PROVIDERS.map(p => ({
        provider: p,
        name: PROVIDER_META[p]?.name || p,
        icon: PROVIDER_META[p]?.icon || 'power-plug-outline',
      }));

  return (
    <>
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: spacing.xl, maxWidth: 680, width: '100%', alignSelf: 'center' }}
    >
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing['2xl'] }}>
        <MaterialCommunityIcons name="cog-outline" size={24} color={colors.accent} />
        <Text variant="h1">Settings</Text>
      </View>

      <TabBar active={tab} onChange={setTab} />

      {/* ── Integrations Tab ── */}
      {tab === 'integrations' && (
        <>
          {/* Search */}
          <View style={{ marginBottom: spacing.lg }}>
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search 200+ integrations..."
              placeholderTextColor={colors.textMuted}
              style={{
                backgroundColor: colors.glass, borderWidth: 0.5, borderColor: colors.glassBorder,
                borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 10,
                color: colors.text, ...typography.body,
                ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}),
              }}
            />
          </View>

          {searching && <ActivityIndicator color={colors.accent} style={{ marginBottom: spacing.lg }} />}

          {/* Connected section */}
          {connections.length > 0 && !searchQuery && (
            <>
              <Text variant="label" color={colors.textMuted} style={{ marginBottom: spacing.sm }}>CONNECTED</Text>
              <Card variant="default" padding="xs" style={{ marginBottom: spacing['2xl'] }}>
                {connections.map((conn: any) => (
                  <IntegrationRow
                    key={conn.id}
                    provider={conn.provider}
                    name={PROVIDER_META[conn.provider]?.name || conn.display_name || conn.provider}
                    icon={PROVIDER_META[conn.provider]?.icon || 'power-plug-outline'}
                    connected={true}
                    grantStatus={grantStatus[conn.provider] || 'idle'}
                    connecting={false}
                    onConnect={() => {}}
                    onDisconnect={() => handleDisconnect(conn.provider)}
                    onGrantAccess={() => grantAgentAccess(conn.id, conn.provider)}
                  />
                ))}
              </Card>
            </>
          )}

          {/* Available integrations */}
          <Text variant="label" color={colors.textMuted} style={{ marginBottom: spacing.sm }}>
            {searchQuery ? 'SEARCH RESULTS' : 'POPULAR'}
          </Text>
          <Card variant="default" padding="xs" style={{ marginBottom: spacing['2xl'] }}>
            {displayIntegrations
              .filter(i => !isConnected(i.provider))
              .map(i => (
                <IntegrationRow
                  key={i.provider}
                  provider={i.provider}
                  name={i.name}
                  icon={i.icon}
                  connected={false}
                  grantStatus="idle"
                  connecting={connecting === i.provider}
                  onConnect={() => handleConnect(i.provider)}
                  onDisconnect={() => {}}
                  onGrantAccess={() => {}}
                />
              ))}
            {displayIntegrations.filter(i => !isConnected(i.provider)).length === 0 && (
              <View style={{ padding: spacing.xl, alignItems: 'center' }}>
                <Text variant="body" color={colors.textMuted}>
                  {searchQuery ? 'No integrations found' : 'All popular integrations connected'}
                </Text>
              </View>
            )}
          </Card>

          {!searchQuery && (
            <Text variant="caption" color={colors.textMuted} align="center" style={{ marginBottom: spacing['2xl'] }}>
              Search above to browse 200+ available integrations
            </Text>
          )}
        </>
      )}

      {/* ── Knowledge Base Tab ── */}
      {tab === 'knowledge' && (
        <>
          <Text variant="body" color={colors.textSecondary} style={{ marginBottom: spacing.xl }}>
            Upload documents, spreadsheets, and files. Brain will use these to answer your questions.
          </Text>

          {/* Upload area */}
          <Pressable
            onPress={handleFileUpload}
            style={{
              borderWidth: 1, borderColor: colors.borderSubtle, borderStyle: 'dashed',
              borderRadius: radius.lg, paddingVertical: spacing['3xl'], paddingHorizontal: spacing.xl,
              alignItems: 'center', justifyContent: 'center', marginBottom: spacing['2xl'],
              backgroundColor: colors.glass,
              ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
            } as any}
          >
            {uploading ? (
              <ActivityIndicator color={colors.accent} />
            ) : (
              <>
                <MaterialCommunityIcons name="cloud-upload-outline" size={32} color={colors.textMuted} style={{ marginBottom: spacing.md }} />
                <Text variant="bodyMedium" color={colors.textSecondary}>Click to upload files</Text>
                <Text variant="caption" color={colors.textMuted} style={{ marginTop: spacing.xs }}>
                  PDFs, spreadsheets, documents, images
                </Text>
              </>
            )}
          </Pressable>

          {/* File list */}
          <Text variant="label" color={colors.textMuted} style={{ marginBottom: spacing.sm }}>
            UPLOADED FILES ({files.length})
          </Text>
          <Card variant="default" padding="xs" style={{ marginBottom: spacing['2xl'] }}>
            {loadingFiles ? (
              <View style={{ padding: spacing.xl, alignItems: 'center' }}>
                <ActivityIndicator color={colors.accent} />
              </View>
            ) : files.length === 0 ? (
              <View style={{ padding: spacing.xl, alignItems: 'center' }}>
                <MaterialCommunityIcons name="file-outline" size={28} color={colors.textMuted} style={{ marginBottom: spacing.sm }} />
                <Text variant="body" color={colors.textMuted}>No files uploaded yet</Text>
                <Text variant="caption" color={colors.textMuted} style={{ marginTop: spacing.xs }}>
                  Upload documents to expand what Brain knows
                </Text>
              </View>
            ) : (
              files.map((file: any) => (
                <FileRow
                  key={file.key}
                  file={file}
                  onDelete={() => handleFileDelete(file.key)}
                  onDownload={() => handleFileDownload(file.key)}
                />
              ))
            )}
          </Card>
        </>
      )}

      {/* ── Account Tab ── */}
      {tab === 'account' && (
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
      )}
    </ScrollView>

      {/* API Key Modal */}
      <Modal visible={!!apiKeyModal} transparent animationType="fade" onRequestClose={() => setApiKeyModal(null)}>
        <Pressable
          style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', alignItems: 'center' }}
          onPress={() => setApiKeyModal(null)}
        >
          <Pressable
            onPress={(e) => e.stopPropagation?.()}
            style={{
              width: '100%', maxWidth: 440,
              backgroundColor: colors.surface, borderRadius: radius.lg,
              borderWidth: 0.5, borderColor: colors.borderSubtle,
              padding: spacing['2xl'],
              ...(Platform.OS === 'web' ? { boxShadow: '0 24px 48px rgba(0,0,0,0.5)' } as any : {}),
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xl }}>
              <Text variant="h2">Connect {apiKeyModal?.name}</Text>
              <Pressable onPress={() => setApiKeyModal(null)} style={Platform.OS === 'web' ? { cursor: 'pointer' } as any : {}}>
                <MaterialCommunityIcons name="close" size={22} color={colors.textMuted} />
              </Pressable>
            </View>

            <Text variant="body" color={colors.textSecondary} style={{ marginBottom: spacing.xl }}>
              {apiKeyModal?.fields?.[0]?.description || `Enter your API key to connect ${apiKeyModal?.name}. You can find this in your ${apiKeyModal?.name} account settings.`}
            </Text>

            <TextInput
              value={apiKeyValue}
              onChangeText={setApiKeyValue}
              placeholder={apiKeyModal?.fields?.[0]?.display_name || 'Paste your API key here...'}
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              style={{
                backgroundColor: colors.glass, borderWidth: 0.5, borderColor: colors.glassBorder,
                borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 11,
                color: colors.text, ...typography.body, marginBottom: spacing.xl,
                ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}),
              }}
            />

            <View style={{ flexDirection: 'row', gap: spacing.md, justifyContent: 'flex-end' }}>
              <Button variant="secondary" onPress={() => setApiKeyModal(null)}>Cancel</Button>
              <Button loading={apiKeySubmitting} onPress={handleApiKeySubmit}>Connect</Button>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
