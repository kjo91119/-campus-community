import { COMMUNITY_VALIDATION } from '@/constants/community';
import { SUPPORTED_UNIVERSITIES } from '@/lib/community/metadata';

export type ValidationResult = {
  ok: boolean;
  message?: string;
};

export type FieldErrors = Record<string, string>;

export type FormValidationResult = {
  ok: boolean;
  errors: FieldErrors;
};

/* ─── Single field validators ─── */

export function validateEmail(email: string, requireSchoolDomain = false): ValidationResult {
  const trimmed = email.trim();

  if (!trimmed) {
    return { ok: false, message: '이메일을 입력해 주세요.' };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return { ok: false, message: '올바른 이메일 형식이 아닙니다.' };
  }

  if (requireSchoolDomain) {
    const domain = trimmed.split('@')[1]?.toLowerCase();
    const isSupported = SUPPORTED_UNIVERSITIES.some(
      (u) => u.emailDomain?.toLowerCase() === domain,
    );

    if (!isSupported) {
      return { ok: false, message: '지원되는 학교 이메일 도메인이 아닙니다.' };
    }
  }

  return { ok: true };
}

export function validatePassword(password: string): ValidationResult {
  if (password.length < 8) {
    return { ok: false, message: '비밀번호는 8자 이상이어야 합니다.' };
  }

  return { ok: true };
}

export function validateTitle(title: string): ValidationResult {
  if (title.trim().length < COMMUNITY_VALIDATION.titleMinLength) {
    return {
      ok: false,
      message: `제목은 ${COMMUNITY_VALIDATION.titleMinLength}자 이상이어야 합니다.`,
    };
  }

  return { ok: true };
}

export function validateBody(body: string): ValidationResult {
  if (body.trim().length < COMMUNITY_VALIDATION.bodyMinLength) {
    return {
      ok: false,
      message: `본문은 ${COMMUNITY_VALIDATION.bodyMinLength}자 이상이어야 합니다.`,
    };
  }

  return { ok: true };
}

export function validateComment(body: string): ValidationResult {
  if (body.trim().length < COMMUNITY_VALIDATION.commentMinLength) {
    return {
      ok: false,
      message: `댓글은 ${COMMUNITY_VALIDATION.commentMinLength}자 이상이어야 합니다.`,
    };
  }

  return { ok: true };
}

export function validateHeadcount(value: string): ValidationResult {
  const num = parseInt(value, 10);

  if (isNaN(num)) {
    return { ok: false, message: '숫자를 입력해 주세요.' };
  }

  if (num < COMMUNITY_VALIDATION.recruitmentHeadcountMin) {
    return {
      ok: false,
      message: `최소 ${COMMUNITY_VALIDATION.recruitmentHeadcountMin}명 이상이어야 합니다.`,
    };
  }

  if (num > COMMUNITY_VALIDATION.recruitmentHeadcountMax) {
    return {
      ok: false,
      message: `최대 ${COMMUNITY_VALIDATION.recruitmentHeadcountMax}명까지 가능합니다.`,
    };
  }

  return { ok: true };
}

/* ─── Composite validators ─── */

export function validatePostInput(title: string, body: string): FormValidationResult {
  const errors: FieldErrors = {};
  const titleResult = validateTitle(title);
  const bodyResult = validateBody(body);

  if (!titleResult.ok && titleResult.message) errors.title = titleResult.message;
  if (!bodyResult.ok && bodyResult.message) errors.body = bodyResult.message;

  return { ok: Object.keys(errors).length === 0, errors };
}

export function validateRecruitmentInput(
  title: string,
  body: string,
  headcount: string,
): FormValidationResult {
  const errors: FieldErrors = {};
  const titleResult = validateTitle(title);
  const bodyResult = validateBody(body);
  const headcountResult = validateHeadcount(headcount);

  if (!titleResult.ok && titleResult.message) errors.title = titleResult.message;
  if (!bodyResult.ok && bodyResult.message) errors.body = bodyResult.message;
  if (!headcountResult.ok && headcountResult.message) errors.headcount = headcountResult.message;

  return { ok: Object.keys(errors).length === 0, errors };
}
