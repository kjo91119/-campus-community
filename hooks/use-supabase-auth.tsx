import {
  createContext,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from 'react';

import type {
  AuthChangeEvent,
  Session,
  User,
} from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

import {
  getSupabaseBootstrap,
  getSupabaseClient,
  registerSupabaseAutoRefresh,
  type SupabaseBootstrap,
} from '@/lib/supabase/client';
import { findUniversityByEmail } from '@/lib/community/metadata';

type AuthCredentials = {
  email: string;
  password: string;
  verificationPath?: 'school_email' | 'manual_student_id';
};

type AuthActionResult = {
  ok: boolean;
  message?: string;
  nextStep?: 'stay' | 'await_email_confirmation' | 'signed_in' | 'signed_out';
};

type SupabaseAuthContextValue = {
  bootstrap: SupabaseBootstrap;
  session: Session | null;
  user: User | null;
  currentEmail?: string;
  pendingEmailConfirmation?: string;
  isLoading: boolean;
  isAuthenticated: boolean;
  signInWithEmail: (credentials: AuthCredentials) => Promise<AuthActionResult>;
  signUpWithEmail: (credentials: AuthCredentials) => Promise<AuthActionResult>;
  signOut: () => Promise<AuthActionResult>;
  clearPendingEmailConfirmation: () => void;
};

const DEFAULT_BOOTSTRAP = getSupabaseBootstrap();

const SupabaseAuthContext = createContext<SupabaseAuthContextValue | null>(null);

function getAuthClient() {
  return getSupabaseClient().auth;
}

function mapAuthErrorMessage(message: string) {
  if (message.includes('Invalid login credentials')) {
    return '이메일 또는 비밀번호를 다시 확인해 주세요.';
  }

  if (message.includes('Email not confirmed')) {
    return '학교 이메일 인증이 아직 완료되지 않았습니다. 메일함의 확인 링크를 먼저 눌러 주세요.';
  }

  if (message.includes('User already registered')) {
    return '이미 가입된 이메일입니다. 로그인으로 진행해 주세요.';
  }

  if (message.includes('Password should be at least')) {
    return '비밀번호는 8자 이상으로 입력해 주세요.';
  }

  return message;
}

function normalizeSchoolEmail(email: string) {
  return email.trim().toLowerCase();
}

function buildEmailRedirectUrl() {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return new URL('/', window.location.origin).toString();
  }

  return Linking.createURL('/');
}

export function SupabaseAuthProvider({ children }: PropsWithChildren) {
  const [bootstrap] = useState(DEFAULT_BOOTSTRAP);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingEmailConfirmation, setPendingEmailConfirmation] = useState<string | undefined>();

  useEffect(() => {
    if (bootstrap.status !== 'ready_for_client_wiring') {
      setIsLoading(false);
      return;
    }

    const unregisterAutoRefresh = registerSupabaseAutoRefresh();

    const auth = getAuthClient();
    let active = true;

    auth
      .getSession()
      .then(
        ({
          data,
          error,
        }: {
          data: { session: Session | null };
          error: Error | null;
        }) => {
          if (!active) {
            return;
          }

          if (error) {
            setSession(null);
            setUser(null);
            setIsLoading(false);
            return;
          }

          setSession(data.session ?? null);
          setUser(data.session?.user ?? null);
          setIsLoading(false);
        }
      )
      .catch(() => {
        if (!active) {
          return;
        }

        setSession(null);
        setUser(null);
        setIsLoading(false);
      });

    const {
      data: { subscription },
    } = auth.onAuthStateChange(
      (_event: AuthChangeEvent, nextSession: Session | null) => {
        if (!active) {
          return;
        }

        setSession(nextSession);
        setUser(nextSession?.user ?? null);

        if (nextSession?.user?.email_confirmed_at) {
          setPendingEmailConfirmation(undefined);
        }

        setIsLoading(false);
      }
    );

    return () => {
      active = false;
      subscription.unsubscribe();
      unregisterAutoRefresh();
    };
  }, [bootstrap.status]);

  const signUpWithEmail = async ({
    email,
    password,
    verificationPath = 'school_email',
  }: AuthCredentials): Promise<AuthActionResult> => {
    if (bootstrap.status !== 'ready_for_client_wiring') {
      return { ok: false, message: 'Supabase 환경변수가 아직 준비되지 않았습니다.' };
    }

    const normalizedEmail = normalizeSchoolEmail(email);
    const isSchoolEmailFlow = verificationPath === 'school_email';

    if (isSchoolEmailFlow && !findUniversityByEmail(normalizedEmail)) {
      return { ok: false, message: '지원하는 학교 이메일 도메인으로만 가입할 수 있습니다.' };
    }

    if (password.trim().length < 8) {
      return { ok: false, message: '비밀번호는 8자 이상으로 입력해 주세요.' };
    }

    const { data, error } = await getAuthClient().signUp({
      email: normalizedEmail,
      password,
      options: {
        emailRedirectTo: buildEmailRedirectUrl(),
      },
    });

    if (error) {
      return { ok: false, message: mapAuthErrorMessage(error.message) };
    }

    if (!data.session) {
      setPendingEmailConfirmation(normalizedEmail);

      return {
        ok: true,
        message: isSchoolEmailFlow
          ? '가입 요청이 생성되었습니다. 학교 이메일로 전송된 확인 링크를 누른 뒤 로그인해 주세요.'
          : '계정 생성 요청이 완료되었습니다. 입력한 이메일의 확인 링크를 누른 뒤 로그인하고 학생증 수동 인증을 진행해 주세요.',
        nextStep: 'await_email_confirmation',
      };
    }

    setPendingEmailConfirmation(undefined);

    return { ok: true, message: '가입과 로그인에 성공했습니다.', nextStep: 'signed_in' };
  };

  const signInWithEmail = async ({
    email,
    password,
  }: AuthCredentials): Promise<AuthActionResult> => {
    if (bootstrap.status !== 'ready_for_client_wiring') {
      return { ok: false, message: 'Supabase 환경변수가 아직 준비되지 않았습니다.' };
    }

    const normalizedEmail = normalizeSchoolEmail(email);

    const { error } = await getAuthClient().signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (error) {
      return { ok: false, message: mapAuthErrorMessage(error.message) };
    }

    setPendingEmailConfirmation(undefined);

    return { ok: true, message: '로그인에 성공했습니다.', nextStep: 'signed_in' };
  };

  const signOut = async (): Promise<AuthActionResult> => {
    if (bootstrap.status !== 'ready_for_client_wiring') {
      setPendingEmailConfirmation(undefined);
      setSession(null);
      setUser(null);

      return { ok: true, nextStep: 'signed_out' };
    }

    const { error } = await getAuthClient().signOut();

    if (error) {
      return { ok: false, message: mapAuthErrorMessage(error.message) };
    }

    setPendingEmailConfirmation(undefined);

    return { ok: true, message: '로그아웃되었습니다.', nextStep: 'signed_out' };
  };

  return (
    <SupabaseAuthContext.Provider
      value={{
        bootstrap,
        session,
        user,
        currentEmail: user?.email ?? pendingEmailConfirmation,
        pendingEmailConfirmation,
        isLoading,
        isAuthenticated: Boolean(session?.user),
        signInWithEmail,
        signUpWithEmail,
        signOut,
        clearPendingEmailConfirmation: () => setPendingEmailConfirmation(undefined),
      }}>
      {children}
    </SupabaseAuthContext.Provider>
  );
}

export function useSupabaseAuth() {
  const context = useContext(SupabaseAuthContext);

  if (!context) {
    throw new Error('useSupabaseAuth must be used within SupabaseAuthProvider');
  }

  return context;
}
