import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const projectRoot = process.cwd();

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function read(relativePath) {
  return readFileSync(join(projectRoot, relativePath), 'utf8');
}

const readinessGuideSource = read('docs/36-launch-readiness-guide.md');
const seedingGuideSource = read('docs/38-launch-seeding-and-qa-guide.md');
const seedSqlSource = read('supabase/sql/08_seed_launch_qa_snapshot.sql');
const resetSqlSource = read('supabase/sql/09_reset_launch_qa_snapshot.sql');

assert(
  !seedSqlSource.includes('on commit drop'),
  'Launch seed SQL should not depend on on commit drop temporary tables.'
);

assert(
  seedSqlSource.includes('파일 전체를 한 번에 실행') &&
    seedSqlSource.includes('reset 없이 재실행하면'),
  'Launch seed SQL should explain whole-file execution and rerun caveats.'
);

assert(
  seedingGuideSource.includes('파일 전체 기준으로 한 번에 실행') &&
    seedingGuideSource.includes('reset -> seed') &&
    seedingGuideSource.includes('자식 comments / recruitments'),
  'Launch seeding guide should require reset-before-seed and explain descendant cleanup.'
);

assert(
  resetSqlSource.includes('deterministic baseline') &&
    resetSqlSource.includes('자식 comments / recruitments') &&
    resetSqlSource.includes('descendant data'),
  'Launch reset SQL should explain baseline restoration and descendant deletion.'
);

assert(
  readinessGuideSource.includes('40-moderation-smoke-runbook.md') &&
    readinessGuideSource.includes('reset -> seed'),
  'Launch readiness guide should reference the moderation runbook and reset-before-seed launch rule.'
);

console.log('Launch seeding assets regression check passed.');
