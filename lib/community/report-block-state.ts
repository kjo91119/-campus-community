import type {
  BlockRecord,
  BlockedProfileEntry,
  ProfileSummary,
  ReportRecord,
} from '@/types/domain';

export function buildBlockedProfileIds({
  blocks,
  blockerProfileId,
}: {
  blocks: BlockRecord[];
  blockerProfileId: string;
}) {
  return new Set(
    blocks
      .filter((block) => block.blockerProfileId === blockerProfileId)
      .map((block) => block.blockedProfileId)
  );
}

export function buildBlockedProfileEntries({
  blocks,
  blockerProfileId,
  resolveProfile,
}: {
  blocks: BlockRecord[];
  blockerProfileId: string;
  resolveProfile: (profileId: string) => ProfileSummary | undefined;
}) {
  const latestBlocks = new Map<string, BlockRecord>();

  blocks.forEach((block) => {
    if (block.blockerProfileId !== blockerProfileId) {
      return;
    }

    const existing = latestBlocks.get(block.blockedProfileId);

    if (!existing || Date.parse(block.createdAt) > Date.parse(existing.createdAt)) {
      latestBlocks.set(block.blockedProfileId, block);
    }
  });

  return [...latestBlocks.values()]
    .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
    .map((block) => {
      const profile = resolveProfile(block.blockedProfileId);

      return {
        profileId: block.blockedProfileId,
        profile,
        displayName: profile?.nickname ?? '차단한 사용자',
        primaryUniversityId: profile?.primaryUniversityId,
        primaryMajorGroupId: profile?.primaryMajorGroupId,
        blockedAt: block.createdAt,
      } satisfies BlockedProfileEntry;
    });
}

export function prependReportRecord(reports: ReportRecord[], nextReport: ReportRecord) {
  return [nextReport, ...reports.filter((report) => report.id !== nextReport.id)];
}

export function prependBlockRecord(blocks: BlockRecord[], nextBlock: BlockRecord) {
  return [nextBlock, ...blocks.filter((block) => block.id !== nextBlock.id)];
}
