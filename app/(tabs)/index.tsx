import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Ionicons } from '@expo/vector-icons';

import { Brand, CardShadow, Radius, Spacing } from '@/constants/theme';
import { EmptyState } from '@/components/empty-state';
import { FadeInView } from '@/components/fade-in-view';
import { SkeletonFeed } from '@/components/skeleton';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAnalytics } from '@/hooks/use-analytics';
import { useCommunityData } from '@/hooks/use-community-data';
import { useAppSession } from '@/hooks/use-app-session';
import { useThemeColors } from '@/hooks/use-theme-color';
import {
  SUPPORTED_MAJOR_GROUPS,
  getMajorGroupById,
  getUniversityById,
} from '@/lib/community/metadata';
import type { CommunityPost } from '@/types/domain';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const { track } = useAnalytics();
  const { profile, isReadOnly } = useAppSession();
  const { getMajorBoards, getNetworkBoard, getPostsByBoardId, isHydrating, isRefreshing, refresh } = useCommunityData();
  const [selectedMajorId, setSelectedMajorId] = useState<string>('all');
  const currentUniversity = getUniversityById(profile.primaryUniversityId);
  const currentMajorGroup = getMajorGroupById(profile.primaryMajorGroupId);
  const majorBoards = getMajorBoards();
  const networkBoard = getNetworkBoard();
  const networkPosts = getPostsByBoardId(networkBoard?.id).filter(
    (post) => post.postType !== 'recruitment'
  );
  const filteredPosts =
    selectedMajorId === 'all'
      ? networkPosts
      : networkPosts.filter((post) => post.majorGroupId === selectedMajorId);
  const hasTrackedHomeViewRef = useRef(false);
  const scrollY = useRef(new Animated.Value(0)).current;

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [0, -10],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    if (hasTrackedHomeViewRef.current) return;
    track('home_viewed', {
      university_id: profile.primaryUniversityId ?? null,
      major_group: profile.primaryMajorGroupId ?? null,
    });
    hasTrackedHomeViewRef.current = true;
  }, [profile.primaryMajorGroupId, profile.primaryUniversityId, track]);

  const handleSelectMajorFilter = (nextMajorId: string) => {
    if (selectedMajorId === nextMajorId) return;
    setSelectedMajorId(nextMajorId);
    track('major_filter_applied', {
      major_group: nextMajorId === 'all' ? null : nextMajorId,
      source: 'home',
    });
  };

  const renderHeader = useCallback(() => (
    <>
      {/* Welcome */}
      <Animated.View style={[styles.welcomeSection, { opacity: headerOpacity, transform: [{ translateY: headerTranslateY }] }]}>
        <ThemedText type="caption" style={{ color: colors.textTertiary }}>
          {currentUniversity?.name ?? '학교 미지정'} · {currentMajorGroup?.label ?? '전공군 미선택'}
        </ThemedText>
        <ThemedText type="title">안녕하세요, {profile.nickname} 님</ThemedText>
        {isReadOnly ? (
          <View style={[styles.statusBadge, { backgroundColor: colors.warningBackground, borderColor: colors.warningBorder }]}>
            <ThemedText type="caption" style={{ color: colors.warningText }}>읽기 전용</ThemedText>
          </View>
        ) : null}
      </Animated.View>

      {/* Major filter */}
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterRow}
        data={SUPPORTED_MAJOR_GROUPS}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <FilterChip
            label="전체"
            selected={selectedMajorId === 'all'}
            colors={colors}
            onPress={() => handleSelectMajorFilter('all')}
          />
        }
        renderItem={({ item: group }) => (
          <FilterChip
            label={group.label}
            selected={selectedMajorId === group.id}
            accentColor={group.accentColor}
            colors={colors}
            onPress={() => handleSelectMajorFilter(group.id)}
          />
        )}
      />

      {/* Quick actions */}
      <View style={styles.quickActionRow}>
        {networkBoard ? (
          <QuickActionCard
            icon="create-outline"
            iconBg={Brand.primaryMuted}
            title="글쓰기"
            subtitle="통합 홈에 글 작성"
            colors={colors}
            onPress={() => router.push(`/(tabs)/write?boardId=${networkBoard.id}` as never)}
          />
        ) : null}
        <QuickActionCard
          icon="school-outline"
          iconBg="#F59E0B1A"
          title="학교"
          subtitle="학교 게시판 이동"
          colors={colors}
          onPress={() => router.push('./school')}
        />
      </View>

      {/* Major boards */}
      <ThemedView variant="surface" style={styles.card}>
        <ThemedText type="sectionHeader">전공 게시판</ThemedText>
        <View style={styles.boardGrid}>
          {majorBoards.length === 0 ? (
          <EmptyState icon="grid-outline" title="게시판이 없습니다" description="아직 접근 가능한 게시판이 없습니다." />
        ) : majorBoards.map((board) => {
            const mg = getMajorGroupById(board.majorGroupId);
            return (
              <Pressable
                key={board.id}
                style={({ pressed }) => [
                  styles.boardItem,
                  { backgroundColor: colors.surfaceSecondary },
                  CardShadow,
                  pressed && { backgroundColor: colors.surfacePressed },
                ]}
                onPress={() => router.push(`/(tabs)/boards/${board.id}` as never)}>
                <View style={[styles.boardDot, { backgroundColor: mg?.accentColor ?? Brand.primary }]} />
                <View style={{ flex: 1 }}>
                  <ThemedText type="defaultSemiBold" style={{ fontSize: 14 }}>
                    {mg?.label ?? board.title}
                  </ThemedText>
                  <ThemedText type="caption" style={{ color: colors.textTertiary }} numberOfLines={1}>
                    {board.description}
                  </ThemedText>
                </View>
                <ThemedText style={{ color: colors.textTertiary, fontSize: 18 }}>›</ThemedText>
              </Pressable>
            );
          })}
        </View>
      </ThemedView>

      {/* Feed title */}
      <View style={styles.feedSection}>
        <ThemedText type="subtitle">
          {selectedMajorId === 'all' ? '최신 글' : `${getMajorGroupById(selectedMajorId)?.label} 글`}
        </ThemedText>
      </View>
    </>
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ), [colors, currentMajorGroup, currentUniversity, headerOpacity, headerTranslateY, isReadOnly, majorBoards, networkBoard, profile.nickname, router, selectedMajorId]);

  const renderItem = useCallback(({ item: post, index }: { item: CommunityPost; index: number }) => {
    const mg = getMajorGroupById(post.majorGroupId);
    return (
      <FadeInView delay={index * 50}>
        <Pressable
          style={({ pressed }) => [
            styles.feedCard,
            { backgroundColor: colors.surface, borderColor: colors.cardBorder },
            pressed && { backgroundColor: colors.surfacePressed },
          ]}
          onPress={() => router.push(`/(tabs)/posts/${post.id}` as never)}>
          <ThemedText type="defaultSemiBold" numberOfLines={2}>{post.title}</ThemedText>
          <ThemedText type="caption" style={{ color: colors.textSecondary }} numberOfLines={2}>
            {post.summary}
          </ThemedText>
          <View style={styles.feedMeta}>
            {mg ? (
              <View style={[styles.metaBadge, { backgroundColor: mg.accentColor + '1A' }]}>
                <ThemedText style={{ color: mg.accentColor, fontWeight: '600', fontSize: 11 }}>
                  {mg.shortLabel}
                </ThemedText>
              </View>
            ) : null}
            <ThemedText type="caption" style={{ color: colors.textTertiary }}>
              댓글 {post.commentCount}
            </ThemedText>
            <ThemedText type="caption" style={{ color: colors.textTertiary }}>
              {post.createdLabel}
            </ThemedText>
          </View>
        </Pressable>
      </FadeInView>
    );
  }, [colors, router]);

  const renderEmpty = useCallback(() => {
    if (!networkBoard) {
      return <EmptyState icon="grid-outline" title="게시판이 없습니다" description="아직 접근 가능한 게시판이 없습니다." />;
    }
    return <EmptyState icon="chatbubble-outline" title="아직 글이 없습니다" description="첫 글을 올려 커뮤니티를 시작해 보세요." />;
  }, [networkBoard]);

  if (isHydrating) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.content, { paddingTop: insets.top + Spacing.lg }]}>
          <SkeletonFeed />
        </View>
      </View>
    );
  }

  return (
    <Animated.FlatList
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.lg }]}
      data={filteredPosts}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      ListHeaderComponent={renderHeader}
      ListEmptyComponent={renderEmpty}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} tintColor={colors.textTertiary} />}
      onScroll={Animated.event(
        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
        { useNativeDriver: true }
      )}
      scrollEventThrottle={16}
    />
  );
}

/* ─── Sub-components ─── */

function FilterChip({
  label, selected, accentColor, colors, onPress,
}: {
  label: string;
  selected: boolean;
  accentColor?: string;
  colors: ReturnType<typeof useThemeColors>;
  onPress: () => void;
}) {
  const activeColor = accentColor ?? colors.chipSelectedText;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.filterChip,
        { backgroundColor: colors.chipBackground, borderColor: colors.chipBorder },
        selected && {
          backgroundColor: (accentColor ?? Brand.primary) + '1A',
          borderColor: (accentColor ?? Brand.primary) + '50',
        },
        pressed && { opacity: 0.7 },
      ]}>
      {accentColor ? <View style={[styles.chipDot, { backgroundColor: accentColor }]} /> : null}
      <ThemedText
        type="defaultSemiBold"
        style={[
          { fontSize: 13, color: colors.textSecondary },
          selected && { color: activeColor },
        ]}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

function QuickActionCard({
  icon, iconBg, title, subtitle, colors, onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  title: string;
  subtitle: string;
  colors: ReturnType<typeof useThemeColors>;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.quickAction,
        { backgroundColor: colors.surface, borderColor: colors.cardBorder },
        pressed && { backgroundColor: colors.surfacePressed },
      ]}
      onPress={onPress}>
      <View style={[styles.quickActionIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={20} color={Brand.primary} />
      </View>
      <ThemedText type="defaultSemiBold" style={{ fontSize: 14 }}>{title}</ThemedText>
      <ThemedText type="caption" style={{ color: colors.textTertiary }} numberOfLines={1}>
        {subtitle}
      </ThemedText>
    </Pressable>
  );
}

/* ─── Styles ─── */

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    padding: Spacing.xl,
    paddingBottom: Spacing.xxxl,
    gap: Spacing.lg,
  },
  welcomeSection: { gap: Spacing.xs },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.sm,
    borderWidth: 1,
    marginTop: Spacing.xs,
  },
  filterScroll: { marginHorizontal: -Spacing.xl, paddingHorizontal: Spacing.xl },
  filterRow: { gap: Spacing.sm },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  chipDot: { width: 8, height: 8, borderRadius: 4 },
  quickActionRow: { flexDirection: 'row', gap: Spacing.md },
  quickAction: {
    flex: 1,
    gap: Spacing.sm,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  quickActionIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
  },
  boardGrid: { gap: Spacing.sm },
  boardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.md,
  },
  boardDot: { width: 10, height: 10, borderRadius: 5 },
  feedSection: { gap: Spacing.sm },
  feedCard: {
    gap: Spacing.sm,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  feedMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  metaBadge: {
    paddingVertical: 2,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.sm,
  },
});
