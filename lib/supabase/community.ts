import type {
  CommentRow,
  PostRow,
  RecruitmentRow,
} from '@/types/domain';
import { listPublishedComments } from '@/lib/supabase/comments';
import { listPublishedPosts } from '@/lib/supabase/posts';
import { listRecruitments } from '@/lib/supabase/recruitments';

type CommunitySnapshot = {
  posts: PostRow[];
  comments: CommentRow[];
  recruitments: RecruitmentRow[];
};

type CommunitySnapshotResult = {
  ok: boolean;
  state?: CommunitySnapshot;
  error?: string;
};

function joinErrors(...errors: (string | undefined)[]) {
  return errors.filter(Boolean).join(' ');
}

export async function fetchCommunitySnapshot(): Promise<CommunitySnapshotResult> {
  const [postsResult, commentsResult, recruitmentsResult] = await Promise.all([
    listPublishedPosts(),
    listPublishedComments(),
    listRecruitments(),
  ]);

  if (!postsResult.ok || !commentsResult.ok || !recruitmentsResult.ok) {
    return {
      ok: false,
      error: joinErrors(postsResult.error, commentsResult.error, recruitmentsResult.error),
    };
  }

  return {
    ok: true,
    state: {
      posts: postsResult.posts ?? [],
      comments: commentsResult.comments ?? [],
      recruitments: recruitmentsResult.recruitments ?? [],
    },
  };
}
