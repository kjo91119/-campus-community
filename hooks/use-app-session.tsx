import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import type { User } from '@supabase/supabase-js';

import { useSupabaseAuth } from '@/hooks/use-supabase-auth';
import { useAnalytics } from '@/hooks/use-analytics';
import {
  findUniversityByEmail,
  getMajorGroupById,
  getUniversityById,
} from '@/lib/community/metadata';
import { completeOnboardingProfile, getProfileById } from '@/lib/supabase/profiles';
import {
  getLatestVerificationByProfileId,
  submitManualVerificationRequest,
} from '@/lib/supabase/verifications';
import type {
  AccountStatus,
  Profile,
  ProfileStorageMode,
  VerificationRecord,
  VerificationStorageMode,
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

type SubmitManualVerificationInput = {
  universityId: string;
  acceptedMaskingGuide: boolean;
  acceptedEvidenceChecklist: boolean;
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
  verificationStorageMode: VerificationStorageMode;
  verificationSyncMessage?: string;
  completeOnboarding: (input: CompleteOnboardingInput) => Promise<ActionResult>;
  submitManualVerification: (input: SubmitManualVerificationInput) => Promise<ActionResult>;
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

function getLocalVerificationStorageKey(userId: string) {
  return `campus-community:verification:${userId}`;
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

function parseStoredVerification(rawValue: string | null) {
  if (!rawValue) {
    return {};
  }

  try {
    return { verification: JSON.parse(rawValue) as VerificationRecord };
  } catch {
    return {
      error:
        '로컬 인증 요청 캐시를 읽는 중 문제가 발생해 저장된 값을 초기화하고 다시 시작합니다.',
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

function mapReviewStatusToVerificationStatus(
  reviewStatus: VerificationRecord['status']
): VerificationStatus {
  if (reviewStatus === 'approved') {
    return 'verified';
  }

  if (reviewStatus === 'rejected') {
    return 'rejected';
  }

  return 'pending';
}

function getVerificationTimestamp(
  verification?: Pick<VerificationRecord, 'reviewedAt' | 'submittedAt'>
) {
  if (!verification) {
    return 0;
  }

  const source = verification.reviewedAt ?? verification.submittedAt;
  const timestamp = Date.parse(source);

  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function selectNewerVerification(
  localVerification?: VerificationRecord,
  remoteVerification?: VerificationRecord
) {
  if (!localVerification && !remoteVerification) {
    return undefined;
  }

  if (!localVerification) {
    return { verification: remoteVerification, storageMode: 'supabase' as const };
  }

  if (!remoteVerification) {
    return {
      verification: localVerification,
      storageMode:
        localVerification.syncState === 'retry_required'
          ? ('local_retry' as const)
          : ('local_cache' as const),
    };
  }

  if (
    localVerification.method === 'student_id_manual' &&
    localVerification.syncState === 'retry_required' &&
    remoteVerification.method === 'student_id_manual'
  ) {
    return {
      verification: remoteVerification,
      storageMode: 'supabase' as const,
      syncMessage: '서버에 접수된 학생증 인증 요청을 우선 사용합니다.',
    };
  }

  const localTimestamp = getVerificationTimestamp(localVerification);
  const remoteTimestamp = getVerificationTimestamp(remoteVerification);

  if (localTimestamp > remoteTimestamp) {
    return {
      verification: localVerification,
      storageMode:
        localVerification.syncState === 'retry_required'
          ? ('local_retry' as const)
          : ('local_cache' as const),
      syncMessage: '로컬 인증 요청이 더 최신이라 현재는 로컬 값을 우선 사용합니다.',
    };
  }

  return { verification: remoteVerification, storageMode: 'supabase' as const };
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
    syncState: 'synced',
  };
}

function applyManualVerificationToProfile(
  baseProfile: Profile,
  verification?: VerificationRecord
) {
  if (!verification || verification.method !== 'student_id_manual') {
    return baseProfile;
  }

  const derivedStatus = mapReviewStatusToVerificationStatus(verification.status);
  const nextTimestamp = verification.reviewedAt ?? verification.submittedAt;

  return {
    ...baseProfile,
    verificationStatus: derivedStatus,
    primaryUniversityId: verification.universityId ?? baseProfile.primaryUniversityId,
    updatedAt: nextTimestamp ?? baseProfile.updatedAt,
  };
}

export function AppSessionProvider({ children }: PropsWithChildren) {
  const { track } = useAnalytics();
  const { bootstrap, user, isLoading: isAuthLoading, isAuthenticated, currentEmail } =
    useSupabaseAuth();
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [verificationRecord, setVerificationRecord] = useState<VerificationRecord | undefined>();
  const [isHydrating, setIsHydrating] = useState(true);
  const [profileStorageMode, setProfileStorageMode] = useState<ProfileStorageMode>('auth_seed');
  const [profileSyncMessage, setProfileSyncMessage] = useState<string | undefined>();
  const [verificationStorageMode, setVerificationStorageMode] =
    useState<VerificationStorageMode>('auth_seed');
  const [verificationSyncMessage, setVerificationSyncMessage] = useState<string | undefined>();
  const lastVerificationEventKeyRef = useRef<string | undefined>(undefined);
  const lastAccountStatusEventKeyRef = useRef<string | undefined>(undefined);

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
        setVerificationStorageMode('auth_seed');
        setVerificationSyncMessage(undefined);
        setIsHydrating(false);
        return;
      }

      setIsHydrating(true);

      const profileStorageKey = getLocalProfileStorageKey(user.id);
      const verificationStorageKey = getLocalVerificationStorageKey(user.id);
      const [storedProfileValue, storedVerificationValue] = await Promise.all([
        AsyncStorage.getItem(profileStorageKey),
        AsyncStorage.getItem(verificationStorageKey),
      ]);
      const parsedStoredProfile = parseStoredProfile(storedProfileValue);
      const parsedStoredVerification = parseStoredVerification(storedVerificationValue);

      if (parsedStoredProfile.error) {
        await AsyncStorage.removeItem(profileStorageKey);
      }

      if (parsedStoredVerification.error) {
        await AsyncStorage.removeItem(verificationStorageKey);
      }

      const storedProfile = parsedStoredProfile.profile;
      const storedVerification = parsedStoredVerification.verification;
      const localProfile = storedProfile
        ? buildProfileFromAuthUser(user, storedProfile)
        : undefined;
      const localVerification =
        storedVerification?.method === 'student_id_manual' ? storedVerification : undefined;
      let nextProfile = localProfile ?? buildProfileFromAuthUser(user);
      let nextStorageMode: ProfileStorageMode = localProfile ? 'local_cache' : 'auth_seed';
      let nextSyncMessage = parsedStoredProfile.error;
      let nextVerification = localVerification;
      let nextVerificationStorageMode: VerificationStorageMode = localVerification
        ? localVerification.syncState === 'retry_required'
          ? 'local_retry'
          : 'local_cache'
        : 'auth_seed';
      let nextVerificationSyncMessage = parsedStoredVerification.error;

      if (bootstrap.status === 'ready_for_client_wiring') {
        const [remoteProfileResult, remoteVerificationResult] = await Promise.all([
          getProfileById(user.id),
          getLatestVerificationByProfileId(user.id),
        ]);

        if (remoteProfileResult.ok && remoteProfileResult.profile) {
          const remoteProfile = buildProfileFromAuthUser(user, remoteProfileResult.profile);
          const preferredProfile = selectNewerProfile(localProfile, remoteProfile);

          if (preferredProfile?.profile) {
            nextProfile = preferredProfile.profile;
            nextStorageMode = preferredProfile.storageMode;
            nextSyncMessage = preferredProfile.syncMessage ?? parsedStoredProfile.error;
          }

          await AsyncStorage.setItem(profileStorageKey, JSON.stringify(nextProfile));
        } else if (!remoteProfileResult.ok) {
          nextSyncMessage = [
            parsedStoredProfile.error,
            `Supabase profiles 조회에 실패해 로컬 캐시를 사용합니다. ${remoteProfileResult.error ?? ''}`.trim(),
          ]
            .filter(Boolean)
            .join(' ');
        }

        if (remoteVerificationResult.ok && remoteVerificationResult.verification) {
          const preferredVerification = selectNewerVerification(
            localVerification,
            remoteVerificationResult.verification
          );

          if (preferredVerification?.verification) {
            nextVerification = preferredVerification.verification;
            nextVerificationStorageMode = preferredVerification.storageMode;
            nextVerificationSyncMessage =
              preferredVerification.syncMessage ?? parsedStoredVerification.error;
          }

          await AsyncStorage.setItem(
            verificationStorageKey,
            JSON.stringify(nextVerification ?? remoteVerificationResult.verification)
          );
        } else if (!remoteVerificationResult.ok) {
          nextVerificationSyncMessage = [
            parsedStoredVerification.error,
            `Supabase verifications 조회에 실패해 로컬 인증 요청을 사용합니다. ${remoteVerificationResult.error ?? ''}`.trim(),
          ]
            .filter(Boolean)
            .join(' ');
        }
      }

      if (!nextVerification) {
        nextVerification = buildVerificationRecord(user, nextProfile.verificationStatus);
        nextVerificationStorageMode = 'auth_seed';
      }

      const shouldSyncProfileFromVerification =
        nextVerification?.method === 'student_id_manual' &&
        (nextStorageMode !== 'supabase' || nextVerificationStorageMode === 'supabase');

      if (shouldSyncProfileFromVerification) {
        nextProfile = applyManualVerificationToProfile(nextProfile, nextVerification);

        if (nextVerificationStorageMode === 'supabase') {
          nextStorageMode = 'supabase';
          nextSyncMessage = nextVerificationSyncMessage ?? nextSyncMessage;
        }
      }

      await AsyncStorage.setItem(profileStorageKey, JSON.stringify(nextProfile));

      if (!active) {
        return;
      }

      setProfile(nextProfile);
      setVerificationRecord(nextVerification);
      setProfileStorageMode(nextStorageMode);
      setProfileSyncMessage(nextSyncMessage);
      setVerificationStorageMode(nextVerificationStorageMode);
      setVerificationSyncMessage(nextVerificationSyncMessage);
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

  const persistVerification = async (nextVerification?: VerificationRecord) => {
    if (!user) {
      return;
    }

    const storageKey = getLocalVerificationStorageKey(user.id);

    if (!nextVerification || nextVerification.method !== 'student_id_manual') {
      await AsyncStorage.removeItem(storageKey);
      return;
    }

    await AsyncStorage.setItem(storageKey, JSON.stringify(nextVerification));
  };

  const updateProfile = (updater: (current: Profile) => Profile) => {
    setProfile((current) => {
      const nextProfile = updater(current);
      void persistProfile(nextProfile);
      return nextProfile;
    });
  };

  const updateVerification = (nextVerification?: VerificationRecord) => {
    setVerificationRecord(nextVerification);
    void persistVerification(nextVerification);
  };

  const canAccessCommunity =
    isAuthenticated &&
    profile.verificationStatus === 'verified' &&
    profile.onboardingCompleted &&
    Boolean(profile.primaryUniversityId) &&
    Boolean(profile.primaryMajorGroupId) &&
    profile.accountStatus !== 'banned';

  const isReadOnly = profile.accountStatus === 'restricted';

  useEffect(() => {
    if (!isAuthenticated || !user) {
      lastVerificationEventKeyRef.current = undefined;
      lastAccountStatusEventKeyRef.current = undefined;
      return;
    }

    const verificationMethod = verificationRecord?.method;
    const nextVerificationEventKey = [
      user.id,
      profile.verificationStatus,
      verificationMethod ?? 'none',
    ].join(':');
    const nextAccountStatusEventKey = [user.id, profile.accountStatus].join(':');

    const commonProperties = {
      verification_method: verificationMethod ?? 'none',
      university_id: profile.primaryUniversityId ?? null,
      major_group: profile.primaryMajorGroupId ?? null,
    };

    if (lastVerificationEventKeyRef.current !== nextVerificationEventKey) {
      if (profile.verificationStatus === 'verified' && verificationMethod === 'email') {
        track('school_email_verified', commonProperties);
      }

      if (
        profile.verificationStatus === 'verified' &&
        verificationMethod === 'student_id_manual'
      ) {
        track('manual_verification_approved', commonProperties);
      }

      if (
        profile.verificationStatus === 'rejected' &&
        verificationMethod === 'student_id_manual'
      ) {
        track('manual_verification_rejected', commonProperties);
      }

      lastVerificationEventKeyRef.current = nextVerificationEventKey;
    }

    if (lastAccountStatusEventKeyRef.current !== nextAccountStatusEventKey) {
      if (profileStorageMode === 'supabase' && profile.accountStatus === 'restricted') {
        track('user_restricted', commonProperties);
      }

      if (profileStorageMode === 'supabase' && profile.accountStatus === 'banned') {
        track('user_banned', commonProperties);
      }

      lastAccountStatusEventKeyRef.current = nextAccountStatusEventKey;
    }
  }, [
    isAuthenticated,
    profile.accountStatus,
    profile.primaryMajorGroupId,
    profile.primaryUniversityId,
    profileStorageMode,
    profile.verificationStatus,
    track,
    user,
    verificationRecord?.method,
  ]);

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

    if (bootstrap.status === 'ready_for_client_wiring') {
      const saveResult = await completeOnboardingProfile(nextProfile);

      if (!saveResult.ok) {
        if (saveResult.errorKind === 'network') {
          updateProfile(() => nextProfile);
          setProfileStorageMode('local_cache');
          setProfileSyncMessage(
            `Supabase 연결이 불안정해 온보딩 결과를 로컬에만 보관했습니다. ${saveResult.error ?? ''}`.trim()
          );

          return {
            ok: true,
            message: '연결이 불안정해 온보딩 결과를 로컬에만 저장했습니다. 네트워크가 안정되면 다시 확인해 주세요.',
          };
        }

        setProfileSyncMessage(
          saveResult.error ?? '온보딩 저장을 완료하지 못했습니다.'
        );

        return {
          ok: false,
          message:
            saveResult.error ??
            '온보딩 저장을 완료하지 못했습니다. 입력값과 현재 인증 상태를 다시 확인해 주세요.',
        };
      }

      const syncedProfile = saveResult.profile ?? nextProfile;

      updateProfile(() => syncedProfile);
      setProfileStorageMode('supabase');
      setProfileSyncMessage(undefined);
      track('nickname_set', {
        major_group: normalizedMajorGroupId,
        university_id: normalizedUniversityId,
        storage_mode: 'supabase',
      });
      track('major_group_selected', {
        major_group: normalizedMajorGroupId,
        university_id: normalizedUniversityId,
        storage_mode: 'supabase',
      });
      track('onboarding_completed', {
        major_group: normalizedMajorGroupId,
        university_id: normalizedUniversityId,
        storage_mode: 'supabase',
      });

      return { ok: true, message: '온보딩과 프로필 저장이 완료되었습니다.' };
    }

    updateProfile(() => nextProfile);
    setProfileStorageMode('local_cache');
    setProfileSyncMessage('Supabase 설정 전이라 로컬 저장 구조만 사용 중입니다.');
    track('nickname_set', {
      major_group: normalizedMajorGroupId,
      university_id: normalizedUniversityId,
      storage_mode: 'local_cache',
    });
    track('major_group_selected', {
      major_group: normalizedMajorGroupId,
      university_id: normalizedUniversityId,
      storage_mode: 'local_cache',
    });
    track('onboarding_completed', {
      major_group: normalizedMajorGroupId,
      university_id: normalizedUniversityId,
      storage_mode: 'local_cache',
    });

    return { ok: true, message: '온보딩이 로컬 저장 구조에 반영되었습니다.' };
  };

  const submitManualVerification = async ({
    universityId,
    acceptedMaskingGuide,
    acceptedEvidenceChecklist,
  }: SubmitManualVerificationInput): Promise<ActionResult> => {
    if (!user) {
      return { ok: false, message: '학생증 수동 인증은 로그인 후 진행할 수 있습니다.' };
    }

    if (profile.verificationStatus === 'verified') {
      return { ok: false, message: '이미 인증이 완료된 계정입니다.' };
    }

    const normalizedUniversityId = universityId.trim();
    const selectedUniversity = getUniversityById(normalizedUniversityId);

    if (!normalizedUniversityId) {
      return { ok: false, message: '학교를 선택해 주세요.' };
    }

    if (!selectedUniversity?.isActive) {
      return { ok: false, message: '허용된 학교 목록에서 다시 선택해 주세요.' };
    }

    if (!acceptedMaskingGuide) {
      return { ok: false, message: '민감정보 마스킹 안내 확인이 필요합니다.' };
    }

    if (!acceptedEvidenceChecklist) {
      return { ok: false, message: '재학 증빙 준비 확인이 필요합니다.' };
    }

    const schoolEmailUniversity = currentEmail ? findUniversityByEmail(currentEmail) : undefined;

    if (schoolEmailUniversity) {
      return {
        ok: false,
        message: '지원 학교 이메일이 있는 계정은 학교 이메일 인증 경로를 먼저 사용해 주세요.',
      };
    }

    const submittedAt = new Date().toISOString();
    const nextVerification: VerificationRecord = {
      id: `verification-manual-${user.id}-${submittedAt}`,
      profileId: user.id,
      method: 'student_id_manual',
      universityId: normalizedUniversityId,
      status: 'pending',
      submittedAt,
      submittedLabel: '학생증 수동 인증 제출',
      syncState: 'retry_required',
    };
    const nextProfile: Profile = {
      ...profile,
      verificationStatus: 'pending',
      primaryUniversityId: normalizedUniversityId,
      updatedAt: submittedAt,
    };

    if (bootstrap.status === 'ready_for_client_wiring') {
      const verificationSaveResult = await submitManualVerificationRequest({
        universityId: normalizedUniversityId,
      });

      if (!verificationSaveResult.ok || !verificationSaveResult.verification) {
        if (verificationSaveResult.errorKind === 'network') {
          updateProfile(() => nextProfile);
          updateVerification(nextVerification);
          setVerificationStorageMode('local_retry');
          setVerificationSyncMessage(
            `Supabase 연결이 불안정해 학생증 수동 인증 요청을 로컬에만 보관했습니다. ${verificationSaveResult.error ?? ''}`.trim()
          );
          setProfileStorageMode('local_cache');
          setProfileSyncMessage(
            '학생증 수동 인증 요청은 로컬 상태를 우선 사용합니다. 네트워크가 안정되면 다시 제출해 주세요.'
          );
          track('manual_verification_submitted', {
            university_id: normalizedUniversityId,
            storage_mode: 'local_retry',
          });

          return {
            ok: true,
            message: '연결이 불안정해 학생증 수동 인증 요청을 로컬에만 저장했습니다. 네트워크가 안정되면 다시 제출해 주세요.',
          };
        }

        const [remoteProfileResult, remoteVerificationResult] = await Promise.all([
          getProfileById(user.id),
          getLatestVerificationByProfileId(user.id),
        ]);

        if (remoteVerificationResult.ok && remoteVerificationResult.verification) {
          const syncedVerification = remoteVerificationResult.verification;
          const syncedProfile = applyManualVerificationToProfile(
            remoteProfileResult.profile ?? profile,
            syncedVerification
          );

          updateVerification(syncedVerification);
          updateProfile(() => syncedProfile);
          setVerificationStorageMode('supabase');
          setVerificationSyncMessage(undefined);

          if (remoteProfileResult.ok && remoteProfileResult.profile) {
            setProfileStorageMode('supabase');
            setProfileSyncMessage(undefined);
          } else {
            setProfileStorageMode('local_cache');
            setProfileSyncMessage(
              `서버 인증 상태는 다시 불러왔지만 최신 프로필 동기화는 일부 지연되고 있습니다. ${remoteProfileResult.error ?? ''}`.trim()
            );
          }

          track('manual_verification_submitted', {
            university_id: normalizedUniversityId,
            storage_mode: 'supabase_resynced',
          });

          return {
            ok: true,
            message:
              syncedVerification.status === 'pending'
                ? '이미 검토 중인 학생증 수동 인증 요청이 있어 서버 상태를 다시 불러왔습니다.'
                : '학생증 수동 인증 상태를 서버 기준으로 다시 불러왔습니다.',
          };
        }

        return {
          ok: false,
          message:
            verificationSaveResult.error ??
            '학생증 수동 인증 요청을 접수하지 못했습니다. 입력값과 현재 계정 상태를 다시 확인해 주세요.',
        };
      }

      const profileSaveResult = await getProfileById(user.id);
      const syncedVerification = verificationSaveResult.verification;
      const syncedProfileBase = profileSaveResult.profile ?? nextProfile;
      const syncedProfileFromVerification = applyManualVerificationToProfile(
        syncedProfileBase,
        syncedVerification
      );

      updateVerification(syncedVerification);
      updateProfile(() => syncedProfileFromVerification);
      setVerificationStorageMode('supabase');
      setVerificationSyncMessage(undefined);

      if (profileSaveResult.ok && profileSaveResult.profile) {
        updateProfile(() =>
          applyManualVerificationToProfile(profileSaveResult.profile!, syncedVerification)
        );
        setProfileStorageMode('supabase');
        setProfileSyncMessage(undefined);
      } else {
        setProfileStorageMode('local_cache');
        setProfileSyncMessage(
          `학생증 수동 인증 요청은 서버에 접수되었지만 최신 프로필 동기화에 실패했습니다. ${profileSaveResult.error ?? ''}`.trim()
        );
      }
      track('manual_verification_submitted', {
        university_id: normalizedUniversityId,
        storage_mode: profileSaveResult.ok ? 'supabase' : 'supabase_partial',
      });

      return {
        ok: true,
        message:
          profileSaveResult.ok
            ? '학생증 수동 인증 요청이 접수되었습니다. 검토 결과가 나올 때까지 잠시 기다려 주세요.'
            : '학생증 수동 인증 요청은 접수되었지만 최신 상태 동기화가 일부 지연되고 있습니다.',
      };
    }

    updateProfile(() => nextProfile);
    updateVerification(nextVerification);
    setVerificationStorageMode('local_retry');
    setVerificationSyncMessage('Supabase 설정 전이라 수동 인증 요청을 로컬에만 저장했습니다.');
    setProfileStorageMode('local_cache');
    setProfileSyncMessage('Supabase 설정 전이라 프로필 상태도 로컬에만 저장했습니다.');
    track('manual_verification_submitted', {
      university_id: normalizedUniversityId,
      storage_mode: 'local_cache',
    });

    return {
      ok: true,
      message: '학생증 수동 인증 요청을 로컬 저장 구조에 반영했습니다.',
    };
  };

  const setAccountStatus = (status: AccountStatus) => {
    updateProfile((current) => ({
      ...current,
      accountStatus: status,
    }));
    setProfileStorageMode('local_cache');
    setProfileSyncMessage(
      '프로필 화면에서 바꾼 계정 상태는 현재 기기에서만 반영되는 로컬 데모 값입니다.'
    );
  };

  const resetDemo = () => {
    if (!user) {
      setProfile(DEFAULT_PROFILE);
      setVerificationRecord(undefined);
      setProfileStorageMode('auth_seed');
      setProfileSyncMessage(undefined);
      setVerificationStorageMode('auth_seed');
      setVerificationSyncMessage(undefined);
      return;
    }

    const resetProfile = buildProfileFromAuthUser(user);

    setProfile(resetProfile);
    setVerificationRecord(buildVerificationRecord(user, resetProfile.verificationStatus));
    setProfileStorageMode('auth_seed');
    setProfileSyncMessage(undefined);
    setVerificationStorageMode('auth_seed');
    setVerificationSyncMessage(undefined);
    void Promise.all([
      AsyncStorage.removeItem(getLocalProfileStorageKey(user.id)),
      AsyncStorage.removeItem(getLocalVerificationStorageKey(user.id)),
    ]);
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
        verificationStorageMode,
        verificationSyncMessage,
        completeOnboarding,
        submitManualVerification,
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
