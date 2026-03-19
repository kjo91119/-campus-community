import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BOARD_SCOPE_LABELS, POST_CATEGORY_LABELS } from '@/constants/community';
import { Brand, Radius, Spacing } from '@/constants/theme';
import { EmptyState } from '@/components/empty-state';
import { SkeletonFeed } from '@/components/skeleton';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useCommunityData } from '@/hooks/use-community-data';
import { useThemeColors } from '@/hooks/use-theme-color';
import { getMajorGroupById, getUniversityById } from '@/lib/community/metadata';

function getParamValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default function BoardScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ boardId: string }>();
  const boardId = getParamValue(params.boardId);
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const {
    getBoardById,
    getPostsByBoardId,
    getReadAccessForBoard,
    getWriteAccessForBoard,
    isHydrating,
    isRefreshing,
    refresh,
  } = useCommunityData();
  const board = getBoardById(boardId);
  const readAccess = getReadAccessForBoard(boardId);
  const posts = getPostsByBoardId(boardId);
  const writeAccess = getWriteAccessForBoard(boardId);
  const university = getUniversityById(board?.universityId);
  const majorGroup = getMajorGroupById(board?.majorGroupId);

  if (isHydrating) {
    return (
      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.lg }]}>
        <SkeletonFeed />
      </ScrollView>
    );
  }

  if (!board) {
    return (
      <View style={[styles.fallback, { backgroundColor: colors.background, paddingTop: insets.top + Spacing.lg }]}>
        <ThemedText type="title">게시판을 찾을 수 없습니다.</ThemedText>
        <Pressable
          style={({ pressed }) => [
            styles.secondaryButton,
            { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
            pressed && { opacity: 0.85 },
          ]}
          onPress={() => router.back()}>
          <ThemedText type="defaultSemiBold">이전 화면으로 돌아가기</ThemedText>
        </Pressable>
      </View>
    );
  }

  if (!readAccess.ok) {
    return (
      <View style={[styles.fallback, { backgroundColor: colors.background, paddingTop: insets.top + Spacing.lg }]}>
        <ThemedText type="title">이 게시판은 볼 수 없습니다.</ThemedText>
        <ThemedText style={{ color: colors.textSecondary }}>{readAccess.message}</ThemedText>
        <Pressable
          style={({ pressed }) => [
            styles.secondaryButton,
            { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
            pressed && { opacity: 0.85 },
          ]}
          onPress={() => router.replace('/(tabs)' as never)}>
          <ThemedText type="defaultSemiBold">홈으로 돌아가기</ThemedText>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.lg }]}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} tintColor={colors.textTertiary} />}>
      {/* Board header */}
      <ThemedView variant="surface" style={styles.card}>
        <ThemedText type="title">{board.title}</ThemedText>
        <ThemedText>{board.description}</ThemedText>
        <View style={styles.badgeRow}>
          <View style={[styles.badge, { backgroundColor: Brand.primaryMuted }]}>
            <ThemedText type="caption" style={{ color: Brand.primary }}>
              {BOARD_SCOPE_LABELS[board.scopeType]}
            </ThemedText>
          </View>
        </View>
        {majorGroup ? (
          <ThemedText type="caption" style={{ color: colors.textSecondary }}>전공군: {majorGroup.label}</ThemedText>
        ) : null}
        {university ? (
          <ThemedText type="caption" style={{ color: colors.textSecondary }}>학교: {university.name}</ThemedText>
        ) : null}
      </ThemedView>

      {/* Write access */}
      <ThemedView variant="surface" style={styles.card}>
        <ThemedText type="sectionHeader">작성 상태</ThemedText>
        {writeAccess.ok ? (
          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && { opacity: 0.85 },
            ]}
            onPress={() => router.push(`/(tabs)/write?boardId=${board.id}` as never)}>
            <ThemedText style={styles.primaryButtonText}>이 게시판에 글쓰기</ThemedText>
          </Pressable>
        ) : (
          <ThemedText type="caption" style={{ color: colors.textSecondary }}>{writeAccess.message}</ThemedText>
        )}
      </ThemedView>

      {/* Post list */}
      <View style={styles.listSection}>
        <ThemedText type="sectionHeader" style={{ paddingHorizontal: Spacing.xs }}>게시글 목록</ThemedText>
        {posts.length === 0 ? (
          <EmptyState icon="document-text-outline" title="아직 글이 없습니다" description="첫 글을 올려 흐름을 확인해 보세요." />
        ) : (
          posts.map((post) => (
            <Pressable
              key={post.id}
              style={({ pressed }) => [
                styles.postCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.cardBorder,
                },
                pressed && { opacity: 0.85 },
              ]}
              onPress={() =>
                router.push(
                  post.recruitmentId
                    ? (`/(tabs)/recruitments/${post.recruitmentId}` as never)
                    : (`/(tabs)/posts/${post.id}` as never)
                )
              }>
              <ThemedText type="defaultSemiBold">{post.title}</ThemedText>
              <ThemedText type="caption" style={{ color: colors.textSecondary }}>{post.summary}</ThemedText>
              <View style={styles.postMeta}>
                <View style={[styles.badge, { backgroundColor: Brand.primaryMuted }]}>
                  <ThemedText type="caption" style={{ color: Brand.primary }}>
                    {POST_CATEGORY_LABELS[post.category as keyof typeof POST_CATEGORY_LABELS] ?? post.category}
                  </ThemedText>
                </View>
                <ThemedText type="caption" style={{ color: colors.textTertiary }}>
                  댓글 {post.commentCount} · {post.createdLabel}
                </ThemedText>
              </View>
            </Pressable>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
    gap: Spacing.lg,
  },
  fallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xxl,
    gap: Spacing.lg,
  },
  card: {
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
  },
  listSection: {
    gap: Spacing.md,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  badge: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.sm,
  },
  postCard: {
    gap: Spacing.sm,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  postMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  primaryButton: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.lg,
    backgroundColor: Brand.primary,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  secondaryButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    alignItems: 'center',
  },
});
