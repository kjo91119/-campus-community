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

const runbookSource = read('docs/40-moderation-smoke-runbook.md');
const briefSource = read('docs/41-moderation-smoke-runbook-review-brief.md');
const moderationSqlSource = read('supabase/sql/07_add_moderation_actions.sql');

assert(
  runbookSource.includes('moderator/admin') &&
    runbookSource.includes('report_reviewing') &&
    runbookSource.includes('content_hidden') &&
    runbookSource.includes('content_restored') &&
    runbookSource.includes('user_restricted') &&
    runbookSource.includes('user_banned') &&
    runbookSource.includes('user_restored'),
  'Moderation runbook should cover the core moderation action flow.'
);

assert(
  runbookSource.includes('target_type / target_id') &&
    runbookSource.includes('linked report') &&
    runbookSource.includes('comment_count') &&
    runbookSource.includes('<parent_post_id>'),
  'Moderation runbook should explain linked report constraints and comment_count verification.'
);

assert(
  briefSource.includes('41-moderation-smoke-runbook-review-brief-validation.md') &&
    briefSource.includes('### 1. 핵심 발견사항') &&
    briefSource.includes('### 7. 최종 판단'),
  'Moderation runbook review brief should include an explicit answer location and fixed response format.'
);

assert(
  moderationSqlSource.includes("and target_type = p_target_type") &&
    moderationSqlSource.includes("and target_id = p_target_id"),
  'Moderation SQL should still validate linked report target alignment.'
);

console.log('Moderation runbook regression check passed.');
