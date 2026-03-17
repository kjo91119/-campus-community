import type {
  CommentRow,
  PostRow,
  RecruitmentRow,
} from '@/types/domain';

export type CommunityStateSnapshot = {
  posts: PostRow[];
  comments: CommentRow[];
  recruitments: RecruitmentRow[];
};

export function cloneCommunityState(state: CommunityStateSnapshot): CommunityStateSnapshot {
  return {
    posts: [...state.posts],
    comments: [...state.comments],
    recruitments: [...state.recruitments],
  };
}

export function buildCommunityStateAfterRemoteHydrate({
  remoteState,
}: {
  remoteState: CommunityStateSnapshot;
}) {
  return cloneCommunityState(remoteState);
}
