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

const moderationClientSource = read('lib/supabase/moderation.ts');
const communityProviderSource = read('hooks/use-community-data.tsx');
const authIndexSource = read('app/(auth)/index.tsx');
const profileSource = read('app/(tabs)/profile.tsx');
const reportsBlocksSqlSource = read('supabase/sql/06_add_reports_blocks_rpcs.sql');
const moderationActionsSqlSource = read('supabase/sql/07_add_moderation_actions.sql');

assert(
  moderationClientSource.includes('export async function listMyReports') &&
    moderationClientSource.includes('export async function listMyBlocks') &&
    moderationClientSource.includes('export async function submitReport') &&
    moderationClientSource.includes('export async function blockProfileRemote') &&
    moderationClientSource.includes('export async function unblockProfileRemote') &&
    moderationClientSource.includes('export async function applyModerationAction'),
  'Supabase moderation client should expose reports, blocks, and moderation action helpers.'
);

assert(
  communityProviderSource.includes('listMyReports()') &&
    communityProviderSource.includes('listMyBlocks()') &&
    communityProviderSource.includes('submitReport({') &&
    communityProviderSource.includes('blockProfileRemote(profileId)') &&
    communityProviderSource.includes('unblockProfileRemote(profileId)'),
  'Community provider should hydrate and mutate reports/blocks through remote helpers when Supabase is ready.'
);

assert(
  communityProviderSource.includes("remoteResult.errorKind !== 'network'"),
  'Community provider should distinguish server rejection from network fallback for moderation actions.'
);

assert(
  reportsBlocksSqlSource.includes('create table if not exists public.reports') &&
    reportsBlocksSqlSource.includes('create table if not exists public.blocks') &&
    reportsBlocksSqlSource.includes('create or replace function public.submit_report') &&
    reportsBlocksSqlSource.includes('create or replace function public.block_profile') &&
    reportsBlocksSqlSource.includes('create or replace function public.list_my_blocks'),
  'Reports/blocks SQL should define the tables and RPCs.'
);

assert(
  moderationActionsSqlSource.includes('create table if not exists public.moderation_events') &&
    moderationActionsSqlSource.includes('create or replace function public.apply_moderation_action') &&
    moderationActionsSqlSource.includes("p_action_type not in ('report_reviewing', 'report_resolved', 'report_dismissed')") &&
    moderationActionsSqlSource.includes("status = 'resolved'") &&
    moderationActionsSqlSource.includes('and target_type = p_target_type') &&
    moderationActionsSqlSource.includes('and target_id = p_target_id'),
  'Moderation actions SQL should define moderation_events and apply_moderation_action RPC.'
);

assert(
  authIndexSource.includes('읽기 전용 상태') &&
    authIndexSource.includes('계정 이용 정지'),
  'Auth start screen should explain restricted and banned account states.'
);

assert(
  profileSource.includes('세션 및 로컬 데모 상태') &&
    profileSource.includes('로컬') &&
    profileSource.includes('데모 제어입니다.'),
  'Profile screen should clarify that local status toggles are demo-only.'
);

console.log('Moderation server wiring regression check passed.');
