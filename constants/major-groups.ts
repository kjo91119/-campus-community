import type { MajorGroup } from '@/types/domain';

export const MAJOR_GROUPS: MajorGroup[] = [
  {
    id: 'physical-therapy',
    slug: 'physical-therapy',
    label: '물리치료',
    shortLabel: '물치',
    description: '실습, 치료기법, 병원 취업 준비가 활발한 전공군',
    accentColor: '#4B82C3',
    sortOrder: 1,
    isLaunchGroup: true,
  },
  {
    id: 'occupational-therapy',
    slug: 'occupational-therapy',
    label: '작업치료',
    shortLabel: '작치',
    description: '재활, 평가, 작업치료 실습 정보가 많이 오가는 전공군',
    accentColor: '#2C9A7A',
    sortOrder: 2,
    isLaunchGroup: true,
  },
  {
    id: 'radiology',
    slug: 'radiology',
    label: '방사선',
    shortLabel: '방사',
    description: '촬영, 장비, 병원 실습과 국시 정보 수요가 큰 전공군',
    accentColor: '#AA6B2D',
    sortOrder: 3,
    isLaunchGroup: true,
  },
  {
    id: 'clinical-pathology',
    slug: 'clinical-pathology',
    label: '임상병리',
    shortLabel: '임병',
    description: '검사실 실습, 국시, 취업 정보 교류가 많은 전공군',
    accentColor: '#8B4CB8',
    sortOrder: 4,
    isLaunchGroup: true,
  },
];

export const MAJOR_GROUP_LABELS = MAJOR_GROUPS.reduce<Record<string, string>>((acc, group) => {
  acc[group.id] = group.label;
  return acc;
}, {});
