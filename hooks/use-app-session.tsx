import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from 'react';
import type { User } from '@supabase/supabase-js';

import {
  findUniversityByEmail,
  getMajorGroupById,
  getUniversityById,
} from '@/data/mock-community';
import { useSupabaseAuth } from '@/hooks/use-supabase-auth';
import { getProfileById, upsertProfile } from '@/lib/supabase/profiles';
import type {
  AccountStatus,
  Profile,
  ProfileStorageMode,
  VerificationRecord,
  VerificationStatus,
} from '@/types/domain';

type CompleteOnboardingInput = {
  nickname: string;
  universityId: string;
  majorGroupId: string;
  majorLabel?: string;
  acceptedPolicy: boolean;
};

type ActionResult = {
  ok: boolean;
  message?: string;
};

type AppSessionContextValue = {
  profile: Profile;
  verificationRecord?: VerificationRecord;
  verificationMethod?: VerificationRecord['method'];
  rejectionReason?: string;
  lastSubmittedEmail?: string;
  canAccessCommunity: boolean;
  isReadOnly: boolean;
  isHydrating: boolean;
  isAuthenticated: boolean;
  authEmail?: string;
  profileStorageMode: ProfileStorageMode;
  profileSyncMessage?: string;
  completeOnboarding: (input: CompleteOnboardingInput) => Promise<ActionResult>;
  setAccountStatus: (status: AccountStatus) => void;
  resetDemo: () => void;
};

const DEFAULT_PROFILE: Profile = {
  id: 'guest',
  nickname: '새내기익명',
  role: 'user',
  verificationStatus: 'unverified',
  accountStatus: 'active',
  onboardingCompleted: false,
  createdAt: '2026-03-01T09:00:00+09:00',
};

const AppSessionContext = createContext<AppSessionContextValue | null>(null);

function getLocalProfileStorageKey(userId: string) {
  return `campus-community:profile:${userId}`;
}

function getDefaultNickname(email?: string) {
  const localPart = email?.split('@')[0]?.trim();

  if (!localPart) {
    return DEFAULT_PROFILE.nickname;
  }

  return localPart.slice(0, 16);
}

function getVerificationStatus(email?: string, emailConfirmedAt?: string | null): VerificationStatus {
  const university = email ? findUniversityByEmail(email) : undefined;

  if (!university) {
    return 'unverified';
  }

  if (emailConfirmedAt) {
    return 'verified';
  }

  return 'pending';
}

function getPersistedVerificationStatus(
  authUser: Pick<User, 'email' | 'email_confirmed_at'>,
  storedProfile?: Profile
) {
  if (storedProfile?.verificationStatus) {
    return storedProfile.verificationStatus;
  }

  return getVerificationStatus(authUser.email, authUser.email_confirmed_at);
}

function getProfileTimestamp(profile?: Pick<Profile, 'updatedAt' | 'onboardingCompletedAt' | 'createdAt'>) {
  if (!profile) {
    return 0;
  }

  const source = profile.updatedAt ?? profile.onboardingCompletedAt ?? profile.createdAt;
  const timestamp = Date.parse(source);

  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function selectNewerProfile(localProfile?: Profile, remoteProfile?: Profile) {
  if (!localProfile && !remoteProfile) {
    return undefined;
  }

  if (!localProfile) {
    return { profile: remoteProfile, storageMode: 'supabase' as const };
  }

  if (!remoteProfile) {
    return { profile: localProfile, storageMode: 'local_cache' as const };
  }

  const localTimestamp = getProfileTimestamp(localProfile);
  const remoteTimestamp = getProfileTimestamp(remoteProfile);

  if (localTimestamp > remoteTimestamp) {
    return {
      profile: localProfile,
      storageMode: 'local_cache' as const,
      syncMessage: '로컬 캐시 프로필이 더 최신이라 현재는 로컬 값을 우선 사용합니다.',
    };
  }

  return { profile: remoteProfile, storageMode: 'supabase' as const };
}

function parseStoredProfile(rawValue: string | null) {
  if (!rawValue) {
    return {};
  }

  try {
    return { profile: JSON.parse(rawValue) as Profile };
  } catch {
    return {
      error:
        '로컬 프로필 캐시를 읽는 중 문제가 발생해 저장된 값을 초기화하고 다시 시작합니다.',
    };
  }
}

function mapVerificationStatusToReviewStatus(
  verificationStatus: VerificationStatus
): VerificationRecord['status'] {
  if (verificationStatus === 'verified') {
    return 'approved';
  }

  if (verificationStatus === 'rejected') {
    return 'rejected';
  }

  return 'pending';
}

function isValidNickname(nickname: string) {
  const normalized = nickname.trim();

  if (normalized.length < 2 || normalized.length > 12) {
    return false;
  }

  return /^[0-9A-Za-z가-힣_]+$/.test(normalized);
}

function buildProfileFromAuthUser(
  authUser: Pick<User, 'id' | 'email' | 'email_confirmed_at' | 'created_at'>,
  storedProfile?: Profile
): Profile {
  const university = authUser.email ? findUniversityByEmail(authUser.email) : undefined;

  return {
    id: authUser.id,
    nickname: storedProfile?.nickname ?? getDefaultNickname(authUser.email),
    role: storedProfile?.role ?? 'user',
    verificationStatus: getPersistedVerificationStatus(authUser, storedProfile),
    accountStatus: storedProfile?.accountStatus ?? 'active',
    onboardingCompleted: storedProfile?.onboardingCompleted ?? false,
    onboardingCompletedAt: storedProfile?.onboardingCompletedAt,
    primaryUniversityId: storedProfile?.primaryUniversityId ?? university?.id,
    primaryMajorGroupId: storedProfile?.primaryMajorGroupId,
    majorLabel: storedProfile?.majorLabel,
    createdAt: storedProfile?.createdAt ?? authUser.created_at,
    updatedAt: storedProfile?.updatedAt ?? storedProfile?.createdAt ?? authUser.created_at,
  };
}

function buildVerificationRecord(
  authUser: Pick<User, 'id' | 'email' | 'email_confirmed_at' | 'created_at'>,
  verificationStatus?: VerificationStatus
): VerificationRecord | undefined {
  const university = authUser.email ? findUniversityByEmail(authUser.email) : undefined;

  if (!authUser.email || !university) {
    return undefined;
  }

  const effectiveVerificationStatus =
    verificationStatus ?? getVerificationStatus(authUser.email, authUser.email_confirmed_at);

  return {
    id: `verification-email-${authUser.id}`,
    profileId: authUser.id,
    method: 'email',
    universityId: university.id,
    status: mapVerificationStatusToReviewStatus(effectiveVerificationStatus),
    submittedAt: authUser.created_at,
    reviewedAt:
      effectiveVerificationStatus === 'verified' || effectiveVerificationStatus === 'rejected'
        ? authUser.email_confirmed_at ?? authUser.created_at
        : undefined,
    submittedLabel: '학교 이메일 인증',
  };
}

export function AppSessionProvider({ children }: PropsWithChildren) {
  const { bootstrap, user, isLoading: isAuthLoading, isAuthenticated, currentEmail } =
    useSupabaseAuth();
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [verificationRecord, setVerificationRecord] = useState<VerificationRecord | undefined>();
  const [isHydrating, setIsHydrating] = useState(true);
  const [profileStorageMode, setProfileStorageMode] = useState<ProfileStorageMode>('auth_seed');
  const [profileSyncMessage, setProfileSyncMessage] = useState<string | undefined>();

  useEffect(() => {
    if (isAuthLoading) {
      setIsHydrating(true);
      return;
    }

    let active = true;

    const hydrateProfile = async () => {
      if (!user) {
        if (!active) {
          return;
        }

        setProfile(DEFAULT_PROFILE);
        setVerificationRecord(undefined);
        setProfileStorageMode('auth_seed');
        setProfileSyncMessage(undefined);
        setIsHydrating(false);
        return;
      }

      setIsHydrating(true);

      const storageKey = getLocalProfileStorageKey(user.id);
      const storedValue = await AsyncStorage.getItem(storageKey);
      const parsedStoredProfile = parseStoredProfile(storedValue);

      if (parsedStoredProfile.error) {
        await AsyncStorage.removeItem(storageKey);
      }

      const storedProfile = parsedStoredProfile.profile;
      const localProfile = storedProfile
        ? buildProfileFromAuthUser(user, storedProfile)
        : undefined;
      let nextProfile = localProfile ?? buildProfileFromAuthUser(user);
      let nextStorageMode: ProfileStorageMode = localProfile ? 'local_cache' : 'auth_seed';
      let nextSyncMessage = parsedStoredProfile.error;

      if (bootstrap.status === 'ready_for_client_wiring') {
        const remoteProfileResult = await getProfileById(user.id);

        if (remoteProfileResult.ok && remoteProfileResult.profile) {
          const remoteProfile = buildProfileFromAuthUser(user, remoteProfileResult.profile);
          const preferredProfile = selectNewerProfile(localProfile, remoteProfile);

          if (preferredProfile?.profile) {
            nextProfile = preferredProfile.profile;
            nextStorageMode = preferredProfile.storageMode;
            nextSyncMessage = preferredProfile.syncMessage ?? parsedStoredProfile.error;
          }

          await AsyncStorage.setItem(storageKey, JSON.stringify(nextProfile));
        } else if (!remoteProfileResult.ok) {
          nextSyncMessage = [
            parsedStoredProfile.error,
            `Supabase profiles 조회에 실패해 로컬 캐시를 사용합니다. ${remoteProfileResult.error ?? ''}`.trim(),
          ]
            .filter(Boolean)
            .join(' ');
        }
      }

      if (!active) {
        return;
      }

      setProfile(nextProfile);
      setVerificationRecord(buildVerificationRecord(user, nextProfile.verificationStatus));
      setProfileStorageMode(nextStorageMode);
      setProfileSyncMessage(nextSyncMessage);
      setIsHydrating(false);
    };

    void hydrateProfile();

    return () => {
      active = false;
    };
  }, [bootstrap.status, isAuthLoading, user]);

  const persistProfile = async (nextProfile: Profile) => {
    if (!user) {
      return;
    }

    await AsyncStorage.setItem(
      getLocalProfileStorageKey(user.id),
      JSON.stringify(nextProfile)
    );
  };

  const updateProfile = (updater: (current: Profile) => Profile) => {
    setProfile((current) => {
      const nextProfile = updater(current);
      void persistProfile(nextProfile);
      return nextProfile;
    });
  };

  const canAccessCommunity =
    isAuthenticated &&
    profile.verificationStatus === 'verified' &&
    profile.onboardingCompleted &&
    Boolean(profile.primaryUniversityId) &&
    Boolean(profile.primaryMajorGroupId) &&
    profile.accountStatus !== 'banned';

  const isReadOnly = profile.accountStatus === 'restricted';

  const completeOnboarding = async ({
    nickname,
    universityId,
    majorGroupId,
    majorLabel,
    acceptedPolicy,
  }: CompleteOnboardingInput): Promise<ActionResult> => {
    const trimmedNickname = nickname.trim();
    const normalizedUniversityId = universityId.trim();
    const normalizedMajorGroupId = majorGroupId.trim();
    const verifiedUniversity = currentEmail ? findUniversityByEmail(currentEmail) : undefined;
    const selectedUniversity = getUniversityById(normalizedUniversityId);
    const selectedMajorGroup = getMajorGroupById(normalizedMajorGroupId);

    if (profile.verificationStatus !== 'verified') {
      return { ok: false, message: '온보딩은 이메일 인증 완료 후 진행할 수 있습니다.' };
    }

    if (!isValidNickname(trimmedNickname)) {
      return {
        ok: false,
        message: '닉네임은 2~12자의 한글, 영문, 숫자, 밑줄만 사용할 수 있습니다.',
      };
    }

    if (!normalizedUniversityId) {
      return { ok: false, message: '학교를 선택해 주세요.' };
    }

    if (!selectedUniversity?.isActive) {
      return { ok: false, message: '허용된 학교 목록에서 다시 선택해 주세요.' };
    }

    if (verifiedUniversity && normalizedUniversityId !== verifiedUniversity.id) {
      return {
        ok: false,
        message: '학교 이메일 기준으로 확인된 학교와 같은 학교를 선택해 주세요.',
      };
    }

    if (!normalizedMajorGroupId) {
      return { ok: false, message: '전공군을 선택해 주세요.' };
    }

    if (!selectedMajorGroup?.isLaunchGroup) {
      return { ok: false, message: '허용된 전공군 목록에서 다시 선택해 주세요.' };
    }

    if (!acceptedPolicy) {
      return { ok: false, message: '이용 규칙과 익명성 정책 확인이 필요합니다.' };
    }

    const nextProfile: Profile = {
      ...profile,
      nickname: trimmedNickname,
      primaryUniversityId: normalizedUniversityId,
      primaryMajorGroupId: normalizedMajorGroupId,
      majorLabel: majorLabel?.trim() || undefined,
      onboardingCompleted: true,
      onboardingCompletedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    updateProfile(() => nextProfile);

    if (bootstrap.status === 'ready_for_client_wiring') {
      const saveResult = await upsertProfile(nextProfile);

      if (!saveResult.ok) {
        setProfileStorageMode('local_cache');
        setProfileSyncMessage(
          `Supabase profiles 저장에 실패해 로컬에만 보관했습니다. ${saveResult.error ?? ''}`.trim()
        );

        return {
          ok: true,
          message: '온보딩은 완료되었지만, 현재 프로필은 로컬에만 저장되었습니다.',
        };
      }

      const syncedProfile = saveResult.profile ?? nextProfile;

      updateProfile(() => syncedProfile);
      setProfileStorageMode('supabase');
      setProfileSyncMessage(undefined);

      return { ok: true, message: '온보딩과 프로필 저장이 완료되었습니다.' };
    }

    setProfileStorageMode('local_cache');
    setProfileSyncMessage('Supabase 설정 전이라 로컬 저장 구조만 사용 중입니다.');

    return { ok: true, message: '온보딩이 로컬 저장 구조에 반영되었습니다.' };
  };

  const setAccountStatus = (status: AccountStatus) => {
    updateProfile((current) => ({
      ...current,
      accountStatus: status,
    }));
  };

  const resetDemo = () => {
    if (!user) {
      setProfile(DEFAULT_PROFILE);
      setVerificationRecord(undefined);
      setProfileStorageMode('auth_seed');
      setProfileSyncMessage(undefined);
      return;
    }

    const resetProfile = buildProfileFromAuthUser(user);

    setProfile(resetProfile);
    setVerificationRecord(buildVerificationRecord(user, resetProfile.verificationStatus));
    setProfileStorageMode('auth_seed');
    setProfileSyncMessage(undefined);
    void AsyncStorage.removeItem(getLocalProfileStorageKey(user.id));
  };

  return (
    <AppSessionContext.Provider
      value={{
        profile,
        verificationRecord,
        verificationMethod: verificationRecord?.method,
        rejectionReason: verificationRecord?.rejectionReason,
        lastSubmittedEmail: currentEmail,
        canAccessCommunity,
        isReadOnly,
        isHydrating,
        isAuthenticated,
        authEmail: currentEmail,
        profileStorageMode,
        profileSyncMessage,
        completeOnboarding,
        setAccountStatus,
        resetDemo,
      }}>
      {children}
    </AppSessionContext.Provider>
  );
}

export function useAppSession() {
  const context = useContext(AppSessionContext);

  if (!context) {
    throw new Error('useAppSession must be used within AppSessionProvider');
  }

  return context;
}
