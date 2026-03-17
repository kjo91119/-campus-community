import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useEffect,
  useContext,
  useMemo,
  useRef,
  type PropsWithChildren,
} from 'react';

type AnalyticsEventName =
  | 'auth_started'
  | 'school_email_submitted'
  | 'school_email_verified'
  | 'manual_verification_started'
  | 'manual_verification_submitted'
  | 'manual_verification_approved'
  | 'manual_verification_rejected'
  | 'onboarding_started'
  | 'nickname_set'
  | 'major_group_selected'
  | 'onboarding_completed'
  | 'home_viewed'
  | 'major_filter_applied'
  | 'post_opened'
  | 'school_board_viewed'
  | 'recruitment_list_viewed'
  | 'recruitment_opened'
  | 'post_create_started'
  | 'post_created'
  | 'comment_created'
  | 'recruitment_created'
  | 'recruitment_interest_commented'
  | 'report_submitted'
  | 'user_blocked'
  | 'user_unblocked'
  | 'user_restricted'
  | 'user_banned';

type AnalyticsProperty = string | number | boolean | null | undefined;

type AnalyticsRecord = {
  id: string;
  name: AnalyticsEventName;
  properties?: Record<string, AnalyticsProperty>;
  occurredAt: string;
};

type AnalyticsContextValue = {
  track: (name: AnalyticsEventName, properties?: Record<string, AnalyticsProperty>) => void;
};

const ANALYTICS_STORAGE_KEY = 'campus-community:analytics-events';
const ANALYTICS_MAX_EVENTS = 400;
const IS_DEV = Boolean((globalThis as { __DEV__?: boolean }).__DEV__);

const AnalyticsContext = createContext<AnalyticsContextValue | null>(null);

function createAnalyticsEventId() {
  return `analytics-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function AnalyticsProvider({ children }: PropsWithChildren) {
  const queueRef = useRef<AnalyticsRecord[]>([]);

  useEffect(() => {
    let active = true;

    const hydrate = async () => {
      const rawValue = await AsyncStorage.getItem(ANALYTICS_STORAGE_KEY);

      if (!active) {
        return;
      }

      if (!rawValue) {
        return;
      }

      try {
        const parsed = JSON.parse(rawValue) as AnalyticsRecord[];
        queueRef.current = [
          ...(Array.isArray(parsed) ? parsed.slice(-ANALYTICS_MAX_EVENTS) : []),
          ...queueRef.current,
        ].slice(-ANALYTICS_MAX_EVENTS);
      } catch {
        queueRef.current = queueRef.current.slice(-ANALYTICS_MAX_EVENTS);
      }
    };

    void hydrate();

    return () => {
      active = false;
    };
  }, []);

  const value = useMemo<AnalyticsContextValue>(
    () => ({
      track: (name, properties) => {
        const nextRecord: AnalyticsRecord = {
          id: createAnalyticsEventId(),
          name,
          properties,
          occurredAt: new Date().toISOString(),
        };

        const currentQueue = queueRef.current;
        const nextQueue = [...currentQueue, nextRecord].slice(-ANALYTICS_MAX_EVENTS);
        queueRef.current = nextQueue;

        void AsyncStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(nextQueue));

        if (IS_DEV) {
          console.log('[analytics]', name, properties ?? {});
        }
      },
    }),
    []
  );

  return <AnalyticsContext.Provider value={value}>{children}</AnalyticsContext.Provider>;
}

export function useAnalytics() {
  const context = useContext(AnalyticsContext);

  if (!context) {
    throw new Error('useAnalytics must be used within AnalyticsProvider');
  }

  return context;
}
