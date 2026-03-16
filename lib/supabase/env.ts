export const SUPABASE_ENV_KEYS = {
  url: 'EXPO_PUBLIC_SUPABASE_URL',
  publishableKey: 'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  anonKey: 'EXPO_PUBLIC_SUPABASE_ANON_KEY',
  verificationBucket: 'EXPO_PUBLIC_SUPABASE_VERIFICATION_BUCKET',
} as const;

export const FORBIDDEN_CLIENT_ENV_KEYS = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY',
] as const;

export type SupabaseEnv = {
  url?: string;
  publishableKey?: string;
  anonKey?: string;
  verificationBucket: string;
};

export type ResolvedSupabaseEnv = {
  url: string;
  clientKey: string;
  verificationBucket: string;
  keySource: 'publishableKey' | 'anonKey';
};

export function readSupabaseEnv(): SupabaseEnv {
  return {
    url: process.env.EXPO_PUBLIC_SUPABASE_URL,
    publishableKey: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    verificationBucket:
      process.env.EXPO_PUBLIC_SUPABASE_VERIFICATION_BUCKET ?? 'manual-verification-evidence',
  };
}

export function getSupabaseClientKey(env: SupabaseEnv) {
  return env.publishableKey ?? env.anonKey;
}

export function getForbiddenSupabaseEnvKeys() {
  return FORBIDDEN_CLIENT_ENV_KEYS.filter((key) => Boolean(process.env[key]));
}

export function getMissingSupabaseEnvKeys(env: SupabaseEnv) {
  const missingKeys: string[] = [];

  if (!env.url) {
    missingKeys.push(SUPABASE_ENV_KEYS.url);
  }

  if (!getSupabaseClientKey(env)) {
    missingKeys.push(
      `${SUPABASE_ENV_KEYS.publishableKey} or ${SUPABASE_ENV_KEYS.anonKey}`
    );
  }

  return missingKeys;
}

export function resolveSupabaseEnv(env: SupabaseEnv = readSupabaseEnv()): ResolvedSupabaseEnv {
  const forbiddenKeys = getForbiddenSupabaseEnvKeys();
  const missingKeys = getMissingSupabaseEnvKeys(env);
  const clientKey = getSupabaseClientKey(env);

  if (forbiddenKeys.length > 0) {
    throw new Error(
      `Forbidden client env keys detected: ${forbiddenKeys.join(', ')}`
    );
  }

  if (missingKeys.length > 0 || !env.url || !clientKey) {
    throw new Error(`Missing required Supabase env keys: ${missingKeys.join(', ')}`);
  }

  return {
    url: env.url,
    clientKey,
    verificationBucket: env.verificationBucket,
    keySource: env.publishableKey ? 'publishableKey' : 'anonKey',
  };
}
