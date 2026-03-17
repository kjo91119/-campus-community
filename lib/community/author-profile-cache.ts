import type {
  CommentRow,
  PostRow,
  ProfileSummary,
} from '@/types/domain';

const PROFILE_ID_UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuidProfileId(value?: string) {
  return Boolean(value && PROFILE_ID_UUID_PATTERN.test(value));
}

export function collectAuthorProfileIdsFromRows(
  posts: Pick<PostRow, 'authorProfileId'>[],
  comments: Pick<CommentRow, 'authorProfileId'>[]
) {
  return [...new Set([...posts.map((post) => post.authorProfileId), ...comments.map((comment) => comment.authorProfileId)])];
}

export function filterUuidProfileIds(profileIds: string[]) {
  return [...new Set(profileIds)].filter(isUuidProfileId);
}

export function buildPersistedAuthorProfiles({
  currentProfileSummary,
  existingProfiles,
}: {
  currentProfileSummary: ProfileSummary;
  existingProfiles: ProfileSummary[];
}) {
  const profileMap = new Map<string, ProfileSummary>();

  existingProfiles.forEach((profile) => {
    if (profile.id === currentProfileSummary.id || isUuidProfileId(profile.id)) {
      profileMap.set(profile.id, profile);
    }
  });

  profileMap.set(currentProfileSummary.id, currentProfileSummary);

  return [...profileMap.values()];
}

export function buildAuthorProfilesAfterRemoteHydrate({
  currentProfileSummary,
  remoteProfiles,
}: {
  currentProfileSummary: ProfileSummary;
  remoteProfiles: ProfileSummary[];
}) {
  const profileMap = new Map<string, ProfileSummary>();

  remoteProfiles.forEach((profile) => {
    if (profile.id === currentProfileSummary.id || isUuidProfileId(profile.id)) {
      profileMap.set(profile.id, profile);
    }
  });

  profileMap.set(currentProfileSummary.id, currentProfileSummary);

  return [...profileMap.values()];
}
