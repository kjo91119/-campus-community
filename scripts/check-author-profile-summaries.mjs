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

const helperPath = join(projectRoot, 'lib', 'community', 'author-profile-cache.ts');
const postDetailPath = join(projectRoot, 'app', '(tabs)', 'posts', '[postId].tsx');
const recruitmentDetailPath = join(
  projectRoot,
  'app',
  '(tabs)',
  'recruitments',
  '[recruitmentId].tsx'
);

const {
  buildAuthorProfilesAfterRemoteHydrate,
  buildPersistedAuthorProfiles,
  filterUuidProfileIds,
} = loadTsModule(helperPath);

const currentProfileSummary = {
  id: 'demo-user',
  nickname: '새내기익명',
  verificationStatus: 'unverified',
};

const staleUuidSummary = {
  id: '11111111-1111-4111-8111-111111111111',
  nickname: '오래된작성자',
  verificationStatus: 'verified',
};

const keptUuidSummary = {
  id: '22222222-2222-4222-8222-222222222222',
  nickname: '서버작성자',
  verificationStatus: 'verified',
};

const nonUuidFallbackSummary = {
  id: 'profile-practice-note',
  nickname: '실습준비러',
  verificationStatus: 'verified',
};

const filteredProfileIds = filterUuidProfileIds([
  nonUuidFallbackSummary.id,
  staleUuidSummary.id,
  keptUuidSummary.id,
  staleUuidSummary.id,
]);

assert(
  filteredProfileIds.length === 2 &&
    filteredProfileIds.includes(staleUuidSummary.id) &&
    filteredProfileIds.includes(keptUuidSummary.id),
  'UUID filter should keep only unique UUID author ids.'
);

const persistedProfiles = buildPersistedAuthorProfiles({
  currentProfileSummary,
  existingProfiles: [staleUuidSummary, nonUuidFallbackSummary],
});

assert(
  persistedProfiles.some((profile) => profile.id === currentProfileSummary.id),
  'Persisted summaries should always keep the current user summary.'
);
assert(
  persistedProfiles.some((profile) => profile.id === staleUuidSummary.id),
  'Persisted summaries should keep previously validated UUID summaries.'
);
assert(
  !persistedProfiles.some((profile) => profile.id === nonUuidFallbackSummary.id),
  'Persisted summaries should not store non-UUID fallback authors.'
);

const hydratedProfiles = buildAuthorProfilesAfterRemoteHydrate({
  currentProfileSummary,
  remoteProfiles: [keptUuidSummary],
});

assert(
  hydratedProfiles.some((profile) => profile.id === currentProfileSummary.id),
  'Remote hydrate should always keep the current user summary.'
);
assert(
  hydratedProfiles.some((profile) => profile.id === keptUuidSummary.id),
  'Remote hydrate should keep server-returned UUID author summaries.'
);
assert(
  !hydratedProfiles.some((profile) => profile.id === staleUuidSummary.id),
  'Remote hydrate should prune stale UUID author summaries missing from the server result.'
);
assert(
  !hydratedProfiles.some((profile) => profile.id === nonUuidFallbackSummary.id),
  'Remote hydrate should not persist non-UUID fallback authors.'
);

const postDetailSource = readFileSync(postDetailPath, 'utf8');
const recruitmentDetailSource = readFileSync(recruitmentDetailPath, 'utf8');

assert(
  postDetailSource.includes('작성자 정보') &&
    postDetailSource.includes('익명 작성글이라 작성자 요약 정보는 공개되지 않습니다.'),
  'Post detail should continue to render the author summary block with anonymous messaging.'
);
assert(
  recruitmentDetailSource.includes('작성자 정보 요약') &&
    recruitmentDetailSource.includes('익명 모집글이라 작성자 요약 정보는 공개되지 않습니다.'),
  'Recruitment detail should continue to render the author summary block with anonymous messaging.'
);

console.log('Author profile summary regression check passed.');
