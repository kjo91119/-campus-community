import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createClient,
  processLock,
  type SupabaseClient,
} from '@supabase/supabase-js';
import {
  AppState,
  type NativeEventSubscription,
  Platform,
} from 'react-native';

import {
  getForbiddenSupabaseEnvKeys,
  getMissingSupabaseEnvKeys,
  readSupabaseEnv,
  resolveSupabaseEnv,
  type SupabaseEnv,
} from '@/lib/supabase/env';

export type SupabaseBootstrapStatus =
  | 'missing_env'
  | 'invalid_env'
  | 'ready_for_client_wiring';

export type SupabaseBootstrap = {
  status: SupabaseBootstrapStatus;
  env: SupabaseEnv;
  missingKeys: string[];
  forbiddenKeys: string[];
  nextStep:
    | 'set_env'
    | 'remove_forbidden_keys'
    | 'install_packages_then_create_client';
};

let supabaseClient: SupabaseClient | undefined;
let autoRefreshSubscription: NativeEventSubscription | undefined;
let autoRefreshSubscriberCount = 0;

export function getSupabaseBootstrap(): SupabaseBootstrap {
  const env = readSupabaseEnv();
  const missingKeys = getMissingSupabaseEnvKeys(env);
  const forbiddenKeys = getForbiddenSupabaseEnvKeys();

  return {
    status:
      forbiddenKeys.length > 0
        ? 'invalid_env'
        : missingKeys.length > 0
          ? 'missing_env'
          : 'ready_for_client_wiring',
    env,
    missingKeys,
    forbiddenKeys,
    nextStep:
      forbiddenKeys.length > 0
        ? 'remove_forbidden_keys'
        : missingKeys.length > 0
          ? 'set_env'
          : 'install_packages_then_create_client',
  };
}

export function createSupabaseClient() {
  const env = resolveSupabaseEnv();

  return createClient(env.url, env.clientKey, {
    auth: {
      storageKey: 'campus-community-auth',
      storage: Platform.OS === 'web' ? undefined : AsyncStorage,
      persistSession: true,
      autoRefreshToken: Platform.OS !== 'web',
      detectSessionInUrl: false,
      lock: processLock,
    },
  });
}

export function getSupabaseClient() {
  if (!supabaseClient) {
    supabaseClient = createSupabaseClient();
  }

  return supabaseClient;
}

export function resetSupabaseClient() {
  supabaseClient = undefined;
}

export function registerSupabaseAutoRefresh() {
  if (Platform.OS === 'web') {
    return () => {};
  }

  const bootstrap = getSupabaseBootstrap();

  if (bootstrap.status !== 'ready_for_client_wiring') {
    return () => {};
  }

  autoRefreshSubscriberCount += 1;

  if (!autoRefreshSubscription) {
    autoRefreshSubscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        getSupabaseClient().auth.startAutoRefresh();
        return;
      }

      getSupabaseClient().auth.stopAutoRefresh();
    });
  }

  return () => {
    autoRefreshSubscriberCount = Math.max(0, autoRefreshSubscriberCount - 1);

    if (autoRefreshSubscriberCount > 0) {
      return;
    }

    autoRefreshSubscription?.remove();
    autoRefreshSubscription = undefined;
    supabaseClient?.auth.stopAutoRefresh();
  };
}
