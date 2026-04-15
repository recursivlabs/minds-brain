import { Recursiv } from '@recursiv/sdk';

export const BASE_URL =
  process.env.EXPO_PUBLIC_RECURSIV_API_URL ||
  'https://api.recursiv.io/api/v1';

export const BASE_ORIGIN = BASE_URL.replace(/\/api\/v1$/, '');
export const ORG_ID = process.env.EXPO_PUBLIC_RECURSIV_ORG_ID || '';
export const PROJECT_ID = process.env.EXPO_PUBLIC_RECURSIV_PROJECT_ID || '';

export function createAuthedSdk(apiKey: string): Recursiv {
  return new Recursiv({
    apiKey,
    baseUrl: BASE_URL,
    timeout: 120_000,
  });
}

// Anonymous SDK for sign-in (no API key needed)
export const anonSdk = new Recursiv({
  apiKey: 'anonymous',
  baseUrl: BASE_URL,
  timeout: 30_000,
} as any);
