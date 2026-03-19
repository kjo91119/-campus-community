import { useEffect, useRef } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Ionicons } from '@expo/vector-icons';

import { Brand, Radius, Spacing } from '@/constants/theme';
import { EmptyState } from '@/components/empty-state';
import { SkeletonFeed } from '@/components/skeleton';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAnalytics } from '@/hooks/use-analytics';
import { useCommunityData } from '@/hooks/use-community-data';
import { useAppSession } from '@/hooks/use-app-session';
import { useThemeColors } from '@/hooks/use-theme-color';
import { getUniversityById } from '@/lib/community/metadata';

export default function SchoolScreen() {
  const router = useRouter();
  const { track } = useAnalytics();
  const { profile, isReadOnly } = useAppSession();
  const { getPostsByBoardId, getSchoolBoardByUniversityId, getWriteAccessForBoard, isHydrating, isRefreshing, refresh } =
    useCommunityData();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const university = getUniversityById(profile.primaryUniversityId);
  const schoolBoard = getSchoolBoardByUniversityId(profile.primaryUniversityId);
  const schoolPosts = getPostsByBoardId(schoolBoard?.id);
  const writeAccess = getWriteAccessForBoard(schoolBoard?.id);
  const hasTrackedViewRef = useRef(false);

  useEffect(() => {
    if (isHydrating || hasTrackedViewRef.current) {
      return;
    }

    track('school_board_viewed', {
      university_id: profile.primaryUniversityId ?? null,
      board_scope: schoolBoard?.scopeType ?? 'university',
    });
    hasTrackedViewRef.current = true;
  }, [isHydrating, profile.primaryUniversityId, schoolBoard?.scopeType, track]);

  if (isHydrating) {
    return (
      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.lg }]}
      >
        <SkeletonFeed />
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.lg }]}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} tintColor={colors.textTertiary} />}>
      <ThemedView variant="surface" style={styles.card}>
        <ThemedText type="title">학교 게시판</ThemedText>
        <ThemedText type="caption" style={{ color: colors.textSecondary }}>
          같은 학교 인증 사용자만 보는 제한형 게시판 골격입니다. MVP에서는 학교별 1개 보드만
          유지합니다.
        </ThemedText>
      </ThemedView>

      <ThemedView variant="surface" style={styles.card}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="key-outline" size={14} color={colors.textTertiary} />
          <ThemedText type="sectionHeader">접근 상태</ThemedText>
        </View>
        <View style={styles.statusRow}>
          <ThemedText type="caption" style={{ color: colors.textTertiary }}>학교</ThemedText>
          <View style={[styles.badge, { backgroundColor: Brand.secondaryMuted }]}>
            <ThemedText type="defaultSemiBold" style={{ color: Brand.secondary, fontSize: 13 }}>
              {university?.name ?? '학교 미지정'}
            </ThemedText>
          </View>
        </View>
        <View style={styles.statusRow}>
          <ThemedText type="caption" style={{ color: colors.textTertiary }}>인증 상태</ThemedText>
          <View style={[styles.badge, { backgroundColor: Brand.successMuted }]}>
            <ThemedText type="caption" style={{ color: Brand.success, fontSize: 12 }}>
              {profile.verificationStatus}
            </ThemedText>
          </View>
        </View>
        {isReadOnly ? (
          <View style={[styles.warningCard, { backgroundColor: colors.warningBackground, borderColor: colors.warningBorder }]}>
            <ThemedText type="caption" style={{ color: colors.warningText }}>
              읽기 전용 상태에서는 학교 게시판 글쓰기도 잠깁니다.
            </ThemedText>
          </View>
        ) : null}
        {schoolBoard ? (
          <View style={styles.statusRow}>
            <ThemedText type="caption" style={{ color: colors.textTertiary }}>현재 보드</ThemedText>
            <ThemedText type="defaultSemiBold" style={{ fontSize: 13 }}>{schoolBoard.title}</ThemedText>
          </View>
        ) : null}
      </ThemedView>

      <ThemedView variant="surface" style={styles.card}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="grid-outline" size={14} color={colors.textTertiary} />
          <ThemedText type="sectionHeader">학교 보드 액션</ThemedText>
        </View>
        {schoolBoard ? (
          <>
            <Pressable
              style={({ pressed }) => [
                styles.primaryButton,
                { backgroundColor: Brand.primary, opacity: pressed ? 0.85 : 1 },
              ]}
              onPress={() => router.push(`/(tabs)/boards/${schoolBoard.id}` as never)}
            >
              <ThemedText type="defaultSemiBold" style={{ color: '#FFFFFF' }}>
                학교 게시판 열기
              </ThemedText>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.secondaryButton,
                {
                  backgroundColor: pressed ? colors.surfacePressed : colors.surfaceSecondary,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => router.push(`/(tabs)/write?boardId=${schoolBoard.id}` as never)}
            >
              <ThemedText type="defaultSemiBold">학교 게시판에 글쓰기</ThemedText>
            </Pressable>
            {!writeAccess.ok ? (
              <View style={[styles.warningCard, { backgroundColor: colors.warningBackground, borderColor: colors.warningBorder }]}>
                <ThemedText type="caption" style={{ color: colors.warningText }}>
                  {writeAccess.message}
                </ThemedText>
              </View>
            ) : null}
          </>
        ) : (
          <EmptyState icon="school-outline" title="학교 보드가 없습니다" description="학교 보드 설정이 아직 없습니다." />
        )}
      </ThemedView>

      <View style={styles.sectionTitleRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="newspaper-outline" size={14} color={colors.textTertiary} />
          <ThemedText type="sectionHeader">학교 피드</ThemedText>
        </View>
        <ThemedText type="caption" style={{ color: colors.textTertiary }}>
          {schoolPosts.length}건
        </ThemedText>
      </View>

      {schoolPosts.length === 0 ? (
        <EmptyState icon="document-text-outline" title="아직 글이 없습니다" description="첫 글을 올려 같은 학교 흐름을 확인해 보세요." />
      ) : (
        schoolPosts.map((post) => (
          <Pressable
            key={post.id}
            style={({ pressed }) => [
              styles.listCard,
              {
                backgroundColor: pressed ? colors.surfacePressed : colors.surface,
                borderColor: colors.cardBorder,
              },
            ]}
            onPress={() =>
              router.push(
                post.recruitmentId
                  ? (`/(tabs)/recruitments/${post.recruitmentId}` as never)
                  : (`/(tabs)/posts/${post.id}` as never)
              )
            }
          >
            <ThemedText type="defaultSemiBold">{post.title}</ThemedText>
            <ThemedText type="caption" style={{ color: colors.textSecondary }} numberOfLines={2}>
              {post.summary}
            </ThemedText>
            <View style={styles.listCardFooter}>
              <View style={[styles.badge, { backgroundColor: Brand.primaryMuted }]}>
                <ThemedText type="caption" style={{ color: Brand.primary, fontSize: 11 }}>
                  댓글 {post.commentCount}
                </ThemedText>
              </View>
              <ThemedText type="caption" style={{ color: colors.textTertiary }}>
                {post.createdLabel}
              </ThemedText>
            </View>
          </Pressable>
        ))
      )}

      <View style={{ height: Spacing.xxxl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxxl,
    gap: Spacing.md,
  },
  card: {
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  warningCard: {
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  primaryButton: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.lg,
    alignItems: 'center',
  },
  secondaryButton: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    alignItems: 'center',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xs,
    marginTop: Spacing.sm,
  },
  emptyState: {
    padding: Spacing.xxxl,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listCard: {
    gap: Spacing.sm,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  badge: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.sm,
  },
  listCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
});
