import { MAJOR_GROUPS } from '@/constants/major-groups';
import { SUPPORTED_UNIVERSITIES } from '@/constants/universities';

export { SUPPORTED_UNIVERSITIES };
export const SUPPORTED_MAJOR_GROUPS = MAJOR_GROUPS;

export function getUniversityById(universityId?: string) {
  return SUPPORTED_UNIVERSITIES.find((university) => university.id === universityId);
}

export function findUniversityByEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  const domain = normalized.split('@')[1];

  if (!domain) {
    return undefined;
  }

  return SUPPORTED_UNIVERSITIES.find((university) => university.emailDomain === domain);
}

export function getMajorGroupById(majorGroupId?: string) {
  return SUPPORTED_MAJOR_GROUPS.find((group) => group.id === majorGroupId);
}
