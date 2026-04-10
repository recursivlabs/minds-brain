import { Platform } from 'react-native';

type CacheEntry = { data: any; timestamp: number };

const store = new Map<string, CacheEntry>();
const STORAGE_KEY = 'brain:cache';
const FRESH_MS = 30_000;

if (Platform.OS === 'web' && typeof window !== 'undefined') {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as Record<string, CacheEntry>;
      const now = Date.now();
      for (const [key, entry] of Object.entries(parsed)) {
        if (now - entry.timestamp < 10 * 60_000) {
          store.set(key, entry);
        }
      }
    }
  } catch {}
}

let persistTimer: ReturnType<typeof setTimeout> | null = null;
function schedulePersist() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    try {
      const obj: Record<string, CacheEntry> = {};
      const now = Date.now();
      for (const [key, entry] of store.entries()) {
        if (now - entry.timestamp < 10 * 60_000) obj[key] = entry;
      }
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
    } catch {}
  }, 1000);
}

export function getCached(key: string): any | null {
  return store.get(key)?.data ?? null;
}

export function isFresh(key: string): boolean {
  const entry = store.get(key);
  return entry ? Date.now() - entry.timestamp < FRESH_MS : false;
}

export function setCache(key: string, data: any): void {
  store.set(key, { data, timestamp: Date.now() });
  schedulePersist();
}

export function invalidate(key: string): void {
  store.delete(key);
  schedulePersist();
}
