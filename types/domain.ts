export type EntityId = string;

export type IsoDateString = string;

export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';

export type AccountStatus = 'active' | 'restricted' | 'banned';

export type UserRole = 'user' | 'moderator' | 'admin';

export type VerificationMethod = 'email' | 'student_id_manual';

export type VerificationReviewStatus = 'pending' | 'approved' | 'rejected';

export type BoardScopeType = 'network' | 'major_group' | 'university';

export type BoardVisibility = 'verified_all' | 'verified_same_university';

export type PostCategory = 'practice' | 'exam' | 'career' | 'qna' | 'free' | 'recruitment';

export type PostType = 'general' | 'question' | 'recruitment';

export type PostStatus = 'published' | 'hidden' | 'deleted';

export type CommentStatus = 'published' | 'hidden' | 'deleted';

export type CommentKind = 'general' | 'recruitment_intent';

export type RecruitmentType = 'study' | 'assignment' | 'contest' | 'project';

export type RecruitmentStatus = 'open' | 'closed' | 'completed';

export type RecruitmentMode = 'online' | 'offline' | 'hybrid';

export interface University {
  id: EntityId;
  slug: string;
  name: string;
  emailDomain?: string;
  region?: string;
  isActive: boolean;
}

export interface MajorGroup {
  id: EntityId;
  slug: string;
  label: string;
  shortLabel: string;
  description: string;
  accentColor: string;
  sortOrder: number;
  isLaunchGroup: boolean;
}

export interface Major {
  id: EntityId;
  majorGroupId: EntityId;
  universityId?: EntityId;
  name: string;
  isActive: boolean;
}

export interface Board {
  id: EntityId;
  slug: string;
  title: string;
  description: string;
  scopeType: BoardScopeType;
  visibility: BoardVisibility;
  majorGroupId?: EntityId;
  universityId?: EntityId;
  postTypeDefault?: PostType;
  isActive: boolean;
}

export interface Profile {
  id: EntityId;
  nickname: string;
  role: UserRole;
  verificationStatus: VerificationStatus;
  accountStatus: AccountStatus;
  onboardingCompleted: boolean;
  onboardingCompletedAt?: IsoDateString;
  primaryUniversityId?: EntityId;
  primaryMajorGroupId?: EntityId;
  majorLabel?: string;
  createdAt: IsoDateString;
  updatedAt?: IsoDateString;
}

export type ProfileStorageMode = 'supabase' | 'local_cache' | 'auth_seed';

export interface ProfileSummary {
  id: EntityId;
  nickname: string;
  primaryUniversityId?: EntityId;
  primaryMajorGroupId?: EntityId;
  verificationStatus: VerificationStatus;
}

export interface VerificationRow {
  id: EntityId;
  profileId: EntityId;
  method: VerificationMethod;
  universityId?: EntityId;
  status: VerificationReviewStatus;
  submittedAt: IsoDateString;
  reviewedAt?: IsoDateString;
  reviewerProfileId?: EntityId;
  evidenceUrl?: string;
  rejectionReason?: string;
}

export interface VerificationView {
  submittedLabel?: string;
}

export type VerificationRecord = VerificationRow & VerificationView;

export interface PostRow {
  id: EntityId;
  boardId: EntityId;
  authorProfileId: EntityId;
  title: string;
  body: string;
  category: PostCategory;
  postType: PostType;
  status: PostStatus;
  majorGroupId?: EntityId;
  universityId?: EntityId;
  recruitmentId?: EntityId;
  isAnonymous: boolean;
  commentCount: number;
  createdAt: IsoDateString;
}

export interface CommunityPostView {
  summary: string;
  createdLabel: string;
  authorNickname: string;
  authorMajorGroupId?: EntityId;
  authorUniversityId?: EntityId;
}

export type CommunityPost = PostRow & CommunityPostView;

export interface CommentRow {
  id: EntityId;
  postId: EntityId;
  authorProfileId: EntityId;
  parentCommentId?: EntityId;
  depth: 1 | 2;
  body: string;
  status: CommentStatus;
  kind: CommentKind;
  isAnonymous: boolean;
  createdAt: IsoDateString;
}

export interface CommentView {
  createdLabel: string;
  authorNickname: string;
}

export type Comment = CommentRow & CommentView;

export interface RecruitmentRow {
  id: EntityId;
  postId: EntityId;
  recruitmentType: RecruitmentType;
  status: RecruitmentStatus;
  headcount?: number;
  mode?: RecruitmentMode;
  deadlineAt?: IsoDateString;
  preferredMajorGroupId?: EntityId;
  createdAt: IsoDateString;
}

export interface RecruitmentView {
  title: string;
  summary: string;
  headcountLabel: string;
  deadlineLabel: string;
  commentPrompt: string;
}

export type Recruitment = RecruitmentRow & RecruitmentView;

export type RecruitmentCard = Recruitment;

export interface AppSessionScenario {
  id: string;
  label: string;
  description: string;
  profile: Profile;
  verificationMethod?: VerificationMethod;
  rejectionReason?: string;
  lastSubmittedEmail?: string;
}
