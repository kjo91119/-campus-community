import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';

import ts from 'typescript';

const projectRoot = process.cwd();

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function loadTsModule(filePath) {
  const source = readFileSync(filePath, 'utf8');
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
    fileName: filePath,
  });

  const module = { exports: {} };
  const sandbox = {
    exports: module.exports,
    module,
    require: () => {
      throw new Error('Runtime imports are not supported in this regression check.');
    },
  };

  vm.runInNewContext(transpiled.outputText, sandbox, { filename: filePath });

  return module.exports;
}

const helperPath = join(projectRoot, 'lib', 'community', 'community-state-cache.ts');
const providerPath = join(projectRoot, 'hooks', 'use-community-data.tsx');

const { buildCommunityStateAfterRemoteHydrate, cloneCommunityState } = loadTsModule(helperPath);

const fallbackState = {
  posts: [
    {
      id: 'stale-post',
      boardId: 'network-home',
      authorProfileId: 'profile-practice-note',
      title: '오래된 로컬 글',
      body: '삭제된 seed 글',
      category: 'free',
      postType: 'general',
      status: 'published',
      isAnonymous: true,
      commentCount: 0,
      createdAt: '2026-03-01T09:00:00+09:00',
    },
  ],
  comments: [
    {
      id: 'stale-comment',
      postId: 'stale-post',
      authorProfileId: 'profile-practice-note',
      depth: 1,
      body: '오래된 댓글',
      status: 'published',
      kind: 'general',
      isAnonymous: true,
      createdAt: '2026-03-01T09:10:00+09:00',
    },
  ],
  recruitments: [
    {
      id: 'stale-recruitment',
      postId: 'stale-post',
      recruitmentType: 'study',
      status: 'open',
      createdAt: '2026-03-01T09:20:00+09:00',
    },
  ],
};

const remoteState = {
  posts: [
    {
      id: 'remote-post',
      boardId: 'network-home',
      authorProfileId: 'profile-practice-note',
      title: '서버 글',
      body: '최신 서버 글',
      category: 'free',
      postType: 'general',
      status: 'published',
      isAnonymous: true,
      commentCount: 2,
      createdAt: '2026-03-02T09:00:00+09:00',
    },
  ],
  comments: [],
  recruitments: [],
};

const localFallbackCreatedState = {
  posts: [
    {
      id: 'local-post-1234',
      boardId: 'network-home',
      authorProfileId: 'demo-user',
      title: '로컬 임시 글',
      body: '오프라인 작성 글',
      category: 'free',
      postType: 'general',
      status: 'published',
      isAnonymous: true,
      commentCount: 1,
      createdAt: '2026-03-03T09:00:00+09:00',
    },
  ],
  comments: [
    {
      id: 'local-comment-1234',
      postId: 'local-post-1234',
      authorProfileId: 'demo-user',
      depth: 1,
      body: '오프라인 작성 댓글',
      status: 'published',
      kind: 'general',
      isAnonymous: true,
      createdAt: '2026-03-03T09:10:00+09:00',
    },
  ],
  recruitments: [
    {
      id: 'local-recruit-1234',
      postId: 'local-post-1234',
      recruitmentType: 'study',
      status: 'open',
      createdAt: '2026-03-03T09:20:00+09:00',
    },
  ],
};

const clonedFallbackState = cloneCommunityState(fallbackState);

assert(
  clonedFallbackState !== fallbackState &&
    clonedFallbackState.posts !== fallbackState.posts &&
    clonedFallbackState.comments !== fallbackState.comments &&
    clonedFallbackState.recruitments !== fallbackState.recruitments,
  'Community state clone should return fresh array references.'
);

const hydratedState = buildCommunityStateAfterRemoteHydrate({
  remoteState,
});

assert(
  hydratedState.posts.length === 1 && hydratedState.posts[0]?.id === 'remote-post',
  'Remote hydrate should replace posts with the server snapshot.'
);
assert(
  hydratedState.comments.length === 0,
  'Remote hydrate should replace comments with the server snapshot.'
);
assert(
  hydratedState.recruitments.length === 0,
  'Remote hydrate should replace recruitments with the server snapshot.'
);
assert(
  !hydratedState.posts.some((post) => post.id === 'stale-post'),
  'Remote hydrate should prune stale local or seed posts.'
);

const hydratedAfterLocalFallbackCreate = buildCommunityStateAfterRemoteHydrate({
  remoteState,
});
const localFallbackIds = {
  postId: localFallbackCreatedState.posts[0]?.id,
  commentId: localFallbackCreatedState.comments[0]?.id,
  recruitmentId: localFallbackCreatedState.recruitments[0]?.id,
};

assert(
  !hydratedAfterLocalFallbackCreate.posts.some((post) => post.id === localFallbackIds.postId) &&
    !hydratedAfterLocalFallbackCreate.comments.some((comment) => comment.id === localFallbackIds.commentId) &&
    !hydratedAfterLocalFallbackCreate.recruitments.some(
      (recruitment) => recruitment.id === localFallbackIds.recruitmentId
    ),
  'Remote hydrate should also prune local fallback-created rows once the server snapshot succeeds.'
);

const providerSource = readFileSync(providerPath, 'utf8');

assert(
  providerSource.includes('buildCommunityStateAfterRemoteHydrate') &&
    !providerSource.includes('mergeWithSeed(') &&
    !providerSource.includes('mergeCommunityState('),
  'Community provider should use server snapshot replacement instead of seed/stored merge on remote success.'
);
assert(
  providerSource.includes('getLocalFallbackWriteMessage') &&
    providerSource.includes('로컬 임시 상태에만 반영되었습니다.'),
  'Community provider should explicitly mark local fallback writes as temporary demo-only state.'
);

console.log('Community snapshot regression check passed.');
