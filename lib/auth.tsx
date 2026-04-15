import * as React from 'react';
import { Recursiv } from '@recursiv/sdk';
import { ORG_ID, createAuthedSdk, anonSdk } from './recursiv';
import * as storage from './storage';

const KEYS = {
  apiKey: 'brain:api_key',
  user: 'brain:user',
  orgId: 'brain:org_id',
  version: 'brain:auth_version',
};

const AUTH_VERSION = '3'; // bumped: added projects scope

const API_KEY_SCOPES = [
  'posts:read', 'posts:write',
  'users:read', 'users:write',
  'chat:read', 'chat:write',
  'agents:read', 'agents:write',
  'organizations:read', 'organizations:write',
  'memory:read', 'memory:write',
  'databases:read', 'databases:write',
  'storage:read', 'storage:write',
  'settings:read', 'settings:write',
  'billing:read', 'billing:write',
  'projects:read', 'projects:write',
] as const;

export interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  image: string | null;
}

interface AuthContextValue {
  user: User | null;
  sdk: Recursiv | null;
  orgId: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  sendOtp: (email: string) => Promise<void>;
  verifyOtp: (email: string, otp: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [authedSdk, setAuthedSdk] = React.useState<Recursiv | null>(null);
  const [orgId, setOrgId] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      try {
        const storedVersion = await storage.getItem(KEYS.version);
        if (storedVersion !== AUTH_VERSION) {
          await clearStorage();
          setIsLoading(false);
          return;
        }

        const [storedApiKey, storedUser, storedOrgId] = await Promise.all([
          storage.getItem(KEYS.apiKey),
          storage.getItem(KEYS.user),
          storage.getItem(KEYS.orgId),
        ]);

        if (storedApiKey && storedUser) {
          const sdk = createAuthedSdk(storedApiKey);
          try {
            await sdk.users.me();
            setAuthedSdk(sdk);
            setUser(JSON.parse(storedUser));
            setOrgId(storedOrgId);
          } catch {
            await clearStorage();
          }
        }
      } catch {
        await clearStorage();
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  async function clearStorage() {
    await Promise.all([
      storage.removeItem(KEYS.apiKey),
      storage.removeItem(KEYS.user),
      storage.removeItem(KEYS.orgId),
      storage.removeItem(KEYS.version),
    ]).catch(() => {});
  }

  async function persistSession(apiKey: string, authUser: User) {
    const sdk = createAuthedSdk(apiKey);
    await Promise.all([
      storage.setItem(KEYS.apiKey, apiKey),
      storage.setItem(KEYS.user, JSON.stringify(authUser)),
      storage.setItem(KEYS.orgId, ORG_ID),
      storage.setItem(KEYS.version, AUTH_VERSION),
    ]);
    setAuthedSdk(sdk);
    setUser(authUser);
    setOrgId(ORG_ID);
  }

  const sendOtp = React.useCallback(async (email: string) => {
    await anonSdk.auth.sendOtp({ email });
  }, []);

  const verifyOtp = React.useCallback(async (email: string, otp: string) => {
    const result = await anonSdk.auth.verifyOtpAndCreateKey(
      { email, otp },
      { name: 'brain-' + Date.now(), scopes: [...API_KEY_SCOPES], organizationId: ORG_ID },
    );

    // Check org membership — reject if not a member of this org
    const sdk = createAuthedSdk(result.apiKey);
    try {
      const orgs = await sdk.organizations.list();
      const isMember = (orgs.data || []).some((o: any) => o.id === ORG_ID);
      if (!isMember) {
        throw new Error('You do not have access to this app. Contact an admin for an invite.');
      }
    } catch (err: any) {
      if (err.message?.includes('do not have access')) throw err;
      throw new Error('Failed to verify access. Please try again.');
    }

    await persistSession(result.apiKey, {
      id: result.user?.id || '',
      name: result.user?.name || '',
      email: result.user?.email || email,
      username: (result.user as any)?.username || email.split('@')[0],
      image: result.user?.image ?? null,
    });
  }, []);

  const signOut = React.useCallback(async () => {
    await clearStorage();
    setUser(null);
    setAuthedSdk(null);
    setOrgId(null);
  }, []);

  const value = React.useMemo(
    () => ({
      user,
      sdk: authedSdk,
      orgId,
      isLoading,
      isAuthenticated: !!user,
      sendOtp,
      verifyOtp,
      signOut,
    }),
    [user, authedSdk, orgId, isLoading, sendOtp, verifyOtp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
