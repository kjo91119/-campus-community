import type { University } from '@/types/domain';

export const SUPPORTED_UNIVERSITIES: University[] = [
  {
    id: 'yonsei',
    slug: 'yonsei',
    name: '연세대학교',
    emailDomain: 'yonsei.ac.kr',
    region: '서울',
    isActive: true,
  },
  {
    id: 'konyang',
    slug: 'konyang',
    name: '건양대학교',
    emailDomain: 'konyang.ac.kr',
    region: '대전',
    isActive: true,
  },
  {
    id: 'daegu-health',
    slug: 'daegu-health',
    name: '대구보건대학교',
    emailDomain: 'dhc.ac.kr',
    region: '대구',
    isActive: true,
  },
  {
    id: 'eulji',
    slug: 'eulji',
    name: '을지대학교',
    emailDomain: 'eulji.ac.kr',
    region: '경기',
    isActive: true,
  },
];
