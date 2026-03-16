import type { AccountStatus, VerificationStatus } from '@/types/domain';

export const VERIFICATION_STATUS_LABELS: Record<VerificationStatus, string> = {
  unverified: '미인증',
  pending: '검토 대기',
  verified: '인증 완료',
  rejected: '반려',
};

export const ACCOUNT_STATUS_LABELS: Record<AccountStatus, string> = {
  active: '정상',
  restricted: '읽기 전용',
  banned: '정지',
};

export const MANUAL_VERIFICATION_SLA = {
  acknowledgement: '영업일 기준 24시간 이내 접수 확인',
  resolution: '영업일 기준 72시간 이내 승인 또는 반려',
};

export const REPORT_SLA = {
  urgent: '긴급 신고는 접수 후 6시간 이내 1차 조치',
  standard: '일반 신고는 영업일 기준 24시간 이내 확인, 72시간 내 처리',
};

export const EVIDENCE_RETENTION = {
  default: '최종 승인 또는 반려 후 7일 내 삭제',
  exception: '분쟁 또는 이의제기 시 최대 30일 보관',
};
