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

const executionSheetSource = read('docs/42-launch-qa-execution-sheet.md');
const reviewBriefSource = read('docs/43-launch-qa-execution-sheet-review-brief.md');

assert(
  executionSheetSource.includes('학교 보드 same-school 접근 제한') &&
    executionSheetSource.includes('remote snapshot 후 stale local row 정리') &&
    executionSheetSource.includes('fallback write 후 임시 row 정리 문구'),
  'Launch QA execution sheet should cover launch-critical read/write QA gaps from the launch readiness guide.'
);

assert(
  executionSheetSource.includes('신고/차단 network 실패 시 fallback 메시지 확인') &&
    executionSheetSource.includes('작성자 요약이 사라진 차단 사용자 해제 가능') &&
    executionSheetSource.includes('linked report resolved 확인 결과'),
  'Launch QA execution sheet should track safety fallback behavior and linked report resolution.'
);

assert(
  executionSheetSource.includes('manual_verification_started') &&
    executionSheetSource.includes('onboarding_started') &&
    executionSheetSource.includes('major_filter_applied') &&
    executionSheetSource.includes('school_board_viewed') &&
    executionSheetSource.includes('post_opened') &&
    executionSheetSource.includes('recruitment_list_viewed') &&
    executionSheetSource.includes('recruitment_opened') &&
    executionSheetSource.includes('user_restricted') &&
    executionSheetSource.includes('user_banned'),
  'Launch QA execution sheet should include rows for the currently tracked non-minimum analytics events.'
);

assert(
  reviewBriefSource.includes('43-launch-qa-execution-sheet-review-brief-validation.md') &&
    reviewBriefSource.includes('### 1. 핵심 발견사항') &&
    reviewBriefSource.includes('### 7. 최종 판단'),
  'Launch QA execution sheet review brief should keep an explicit answer location and fixed response format.'
);

console.log('Launch QA execution sheet regression check passed.');
