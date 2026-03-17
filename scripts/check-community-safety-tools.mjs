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

const helperPath = join(projectRoot, 'lib', 'community', 'report-block-state.ts');
const providerPath = join(projectRoot, 'hooks', 'use-community-data.tsx');
const postDetailPath = join(projectRoot, 'app', '(tabs)', 'posts', '[postId].tsx');
const recruitmentDetailPath = join(
  projectRoot,
  'app',
  '(tabs)',
  'recruitments',
  '[recruitmentId].tsx'
);
const profilePath = join(projectRoot, 'app', '(tabs)', 'profile.tsx');

const {
  buildBlockedProfileEntries,
  buildBlockedProfileIds,
  prependBlockRecord,
  prependReportRecord,
} = loadTsModule(helperPath);

const blocks = [
  {
    id: 'block-1',
    blockerProfileId: 'viewer-a',
    blockedProfileId: 'author-a',
    createdAt: '2026-03-10T09:00:00+09:00',
  },
  {
    id: 'block-2',
    blockerProfileId: 'viewer-a',
    blockedProfileId: 'author-b',
    createdAt: '2026-03-11T09:00:00+09:00',
  },
  {
    id: 'block-3',
    blockerProfileId: 'viewer-b',
    blockedProfileId: 'author-c',
    createdAt: '2026-03-12T09:00:00+09:00',
  },
  {
    id: 'block-4',
    blockerProfileId: 'viewer-a',
    blockedProfileId: 'author-a',
    createdAt: '2026-03-13T09:00:00+09:00',
  },
];

const blockedIds = buildBlockedProfileIds({
  blocks,
  blockerProfileId: 'viewer-a',
});

assert(
  blockedIds.has('author-a') && blockedIds.has('author-b') && !blockedIds.has('author-c'),
  'Blocked profile ids should be scoped to the current viewer only.'
);

const profileMap = new Map([
  [
    'author-a',
    {
      id: 'author-a',
      nickname: '차단대상A',
      verificationStatus: 'verified',
    },
  ],
  [
    'author-b',
    {
      id: 'author-b',
      nickname: '차단대상B',
      verificationStatus: 'verified',
    },
  ],
]);

const blockedEntries = buildBlockedProfileEntries({
  blocks,
  blockerProfileId: 'viewer-a',
  resolveProfile: (profileId) => profileMap.get(profileId),
});

assert(
  blockedEntries.length === 2 &&
    blockedEntries[0]?.profileId === 'author-a' &&
    blockedEntries[1]?.profileId === 'author-b',
  'Blocked profile entries should dedupe by blocked profile and keep the latest block first.'
);

const unresolvedBlockedEntries = buildBlockedProfileEntries({
  blocks,
  blockerProfileId: 'viewer-a',
  resolveProfile: () => undefined,
});

assert(
  unresolvedBlockedEntries.length === 2 &&
    unresolvedBlockedEntries[0]?.profileId === 'author-a' &&
    unresolvedBlockedEntries[0]?.displayName === '차단한 사용자',
  'Blocked profile entries should remain visible for unblock even when profile summaries no longer resolve.'
);

const prependedReport = prependReportRecord(
  [
    {
      id: 'report-old',
      reporterProfileId: 'viewer-a',
      targetType: 'post',
      targetId: 'post-1',
      reason: 'abuse',
      createdAt: '2026-03-01T09:00:00+09:00',
    },
  ],
  {
    id: 'report-new',
    reporterProfileId: 'viewer-a',
    targetType: 'comment',
    targetId: 'comment-1',
    reason: 'spam',
    createdAt: '2026-03-02T09:00:00+09:00',
  }
);

assert(
  prependedReport[0]?.id === 'report-new' && prependedReport.length === 2,
  'New reports should prepend without dropping older report history.'
);

const prependedBlock = prependBlockRecord(
  [
    {
      id: 'block-old',
      blockerProfileId: 'viewer-a',
      blockedProfileId: 'author-z',
      createdAt: '2026-03-01T09:00:00+09:00',
    },
  ],
  {
    id: 'block-new',
    blockerProfileId: 'viewer-a',
    blockedProfileId: 'author-y',
    createdAt: '2026-03-02T09:00:00+09:00',
  }
);

assert(
  prependedBlock[0]?.id === 'block-new' && prependedBlock.length === 2,
  'New blocks should prepend without dropping older block history.'
);

const providerSource = readFileSync(providerPath, 'utf8');
const postDetailSource = readFileSync(postDetailPath, 'utf8');
const recruitmentDetailSource = readFileSync(recruitmentDetailPath, 'utf8');
const profileSource = readFileSync(profilePath, 'utf8');

assert(
  providerSource.includes('reportTarget') &&
    providerSource.includes('blockProfile') &&
    providerSource.includes('unblockProfile') &&
    providerSource.includes('getBlockedProfiles') &&
    providerSource.includes('isBlockedProfile'),
  'Community provider should expose report/block actions and blocked profile lookup.'
);

assert(
  providerSource.includes("차단한 사용자의 글이라 숨겨졌습니다.") &&
    providerSource.includes('!blockedProfileIds.has(comment.authorProfileId)'),
  'Community provider should hide blocked authors from post detail access and comment lists.'
);

assert(
  providerSource.includes('내 글, 내 댓글, 내 모집글, 내 프로필은 신고할 수 없습니다.'),
  'Community provider should guard against self-reporting invariants, not only screen-level callers.'
);

assert(
  postDetailSource.includes('신고 / 차단') &&
    postDetailSource.includes('게시글 신고') &&
    postDetailSource.includes('작성자 차단'),
  'Post detail should expose the report/block safety card.'
);

assert(
  recruitmentDetailSource.includes('신고 / 차단') &&
    recruitmentDetailSource.includes('모집글 신고') &&
    recruitmentDetailSource.includes('작성자 차단'),
  'Recruitment detail should expose the report/block safety card.'
);

assert(
  profileSource.includes('차단 목록') && profileSource.includes('차단 해제'),
  'Profile screen should expose the blocked profiles list.'
);

console.log('Community safety regression check passed.');
