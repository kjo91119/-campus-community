import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
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

import { Brand, Radius, Shadow, Spacing } from '@/constants/theme';
import { EmptyState } from '@/components/empty-state';
import { FadeInView } from '@/components/fade-in-view';
import { SearchBar } from '@/components/search-bar';
import { SkeletonFeed } from '@/components/skeleton';
import { ThemedText } from '@/components/themed-text';

import { useAnalytics } from '@/hooks/use-analytics';
import { usePaginatedList } from '@/hooks/use-paginated-list';
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
  const [searchQuery, setSearchQuery] = useState('');
  const currentUniversity = getUniversityById(profile.primaryUniversityId);
  const currentMajorGroup = getMajorGroupById(profile.primaryMajorGroupId);
  const majorBoards = getMajorBoards();
  const networkBoard = getNetworkBoard();
  const networkPosts = getPostsByBoardId(networkBoard?.id).filter(
    (post) => post.postType !== 'recruitment'
  );
  const filteredPosts = networkPosts.filter((post) => {
    if (selectedMajorId !== 'all' && post.majorGroupId !== selectedMajorId) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return post.title.toLowerCase().includes(q) || post.summary?.toLowerCase().includes(q);
    }
    return true;
  });
  const { visibleData: paginatedPosts, hasMore, loadMore } = usePaginatedList(filteredPosts);
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

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleSelectMajorFilter = useCallback((nextMajorId: string) => {
    setSelectedMajorId((prev) => {
      if (prev === nextMajorId) return prev;
      track('major_filter_applied', {
        major_group: nextMajorId === 'all' ? null : nextMajorId,
        source: 'home',
      });
      return nextMajorId;
    });
  }, [track]);

  const renderHeader = useCallback(() => (
    <>
      {/* Welcome — compact */}
      <Animated.View style={[styles.welcomeSection, { opacity: headerOpacity, transform: [{ translateY: headerTranslateY }] }]}>
        <View style={styles.welcomeRow}>
          <View style={{ flex: 1 }}>
            <ThemedText type="subtitle" numberOfLines={1}>
              {profile.nickname} 님
            </ThemedText>
            <ThemedText type="caption" style={{ color: colors.textTertiary }}>
              {currentUniversity?.name ?? '학교 미지정'} · {currentMajorGroup?.label ?? '전공군 미선택'}
            </ThemedText>
          </View>
          {isReadOnly ? (
            <View style={[styles.statusBadge, { backgroundColor: colors.warningBackground, borderColor: colors.warningBorder }]}>
              <ThemedText type="caption" style={{ color: colors.warningText }}>읽기 전용</ThemedText>
            </View>
          ) : null}
        </View>
      </Animated.View>

      {/* Quick actions — compact pills */}
      <View style={styles.quickActionRow}>
        {networkBoard ? (
          <Pressable
            accessibilityLabel="글쓰기"
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.quickPill,
              { backgroundColor: colors.surface, borderColor: colors.cardBorder },
              Shadow.sm,
              pressed && { backgroundColor: colors.surfacePressed },
            ]}
            onPress={() => router.push(`/(tabs)/write?boardId=${networkBoard.id}` as never)}>
            <View style={[styles.quickPillIcon, { backgroundColor: Brand.primaryMuted }]}>
              <Ionicons name="create-outline" size={18} color={Brand.primary} />
            </View>
            <ThemedText type="defaultSemiBold" style={{ fontSize: 13 }}>글쓰기</ThemedText>
          </Pressable>
        ) : null}
        <Pressable
          accessibilityLabel="학교 게시판"
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.quickPill,
            { backgroundColor: colors.surface, borderColor: colors.cardBorder },
            Shadow.sm,
            pressed && { backgroundColor: colors.surfacePressed },
          ]}
          onPress={() => router.push('./school')}>
          <View style={[styles.quickPillIcon, { backgroundColor: '#F59E0B1A' }]}>
            <Ionicons name="school-outline" size={18} color="#F59E0B" />
          </View>
          <ThemedText type="defaultSemiBold" style={{ fontSize: 13 }}>학교</ThemedText>
        </Pressable>
        <Pressable
          accessibilityLabel="모집 탭"
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.quickPill,
            { backgroundColor: colors.surface, borderColor: colors.cardBorder },
            Shadow.sm,
            pressed && { backgroundColor: colors.surfacePressed },
          ]}
          onPress={() => router.push('./recruit')}>
          <View style={[styles.quickPillIcon, { backgroundColor: '#3B82F61A' }]}>
            <Ionicons name="people-outline" size={18} color="#3B82F6" />
          </View>
          <ThemedText type="defaultSemiBold" style={{ fontSize: 13 }}>모집</ThemedText>
        </Pressable>
      </View>

      {/* Search */}
      <SearchBar placeholder="게시글 검색" onSearch={handleSearch} />

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

      {/* Major boards — 2-col grid */}
      <View>
        <SectionTitle label="전공 게시판" colors={colors} />
        <View style={styles.boardGrid}>
          {majorBoards.length === 0 ? (
            <EmptyState icon="grid-outline" title="게시판이 없습니다" description="아직 접근 가능한 게시판이 없습니다." />
          ) : majorBoards.map((board) => {
            const mg = getMajorGroupById(board.majorGroupId);
            return (
              <Pressable
                key={board.id}
                style={({ pressed }) => [
                  styles.boardCard,
                  { backgroundColor: colors.surface, borderColor: colors.cardBorder },
                  Shadow.sm,
                  pressed && { backgroundColor: colors.surfacePressed },
                ]}
                onPress={() => router.push(`/(tabs)/boards/${board.id}` as never)}>
                <View style={[styles.boardAccentBar, { backgroundColor: mg?.accentColor ?? Brand.primary }]} />
                <View style={styles.boardCardBody}>
                  <View style={styles.boardCardHeader}>
                    <View style={[styles.boardIconCircle, { backgroundColor: (mg?.accentColor ?? Brand.primary) + '1A' }]}>
                      <Ionicons name="book-outline" size={14} color={mg?.accentColor ?? Brand.primary} />
                    </View>
                    <ThemedText type="defaultSemiBold" style={{ fontSize: 14, flex: 1 }} numberOfLines={1}>
                      {mg?.label ?? board.title}
                    </ThemedText>
                  </View>
                  <ThemedText type="caption" style={{ color: colors.textTertiary }} numberOfLines={1}>
                    {board.description}
                  </ThemedText>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Feed title */}
      <SectionTitle
        label={selectedMajorId === 'all' ? '최신 글' : `${getMajorGroupById(selectedMajorId)?.label} 글`}
        colors={colors}
      />
    </>
  ), [colors, currentMajorGroup, currentUniversity, handleSearch, handleSelectMajorFilter, headerOpacity, headerTranslateY, isReadOnly, majorBoards, networkBoard, profile.nickname, router, selectedMajorId]);

  const renderItem = useCallback(({ item: post, index }: { item: CommunityPost; index: number }) => {
    const mg = getMajorGroupById(post.majorGroupId);
    const accentColor = mg?.accentColor ?? Brand.primary;
    return (
      <FadeInView delay={index * 50}>
        <Pressable
          accessibilityLabel={`${post.title}, 댓글 ${post.commentCount}개`}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.feedCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.cardBorder,
              borderLeftColor: accentColor,
            },
            Shadow.sm,
            pressed && { backgroundColor: colors.surfacePressed },
          ]}
          onPress={() => router.push(`/(tabs)/posts/${post.id}` as never)}>
          <ThemedText type="defaultSemiBold" style={{ fontSize: 16 }} numberOfLines={2}>{post.title}</ThemedText>
          <ThemedText type="caption" style={{ color: colors.textSecondary }} numberOfLines={2}>
            {post.summary}
          </ThemedText>
          <View style={styles.feedMeta}>
            {mg ? (
              <View style={[styles.metaBadge, { backgroundColor: mg.accentColor + '2A', borderColor: mg.accentColor + '40' }]}>
                <ThemedText style={{ color: mg.accentColor, fontWeight: '600', fontSize: 12 }}>
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
      data={paginatedPosts}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      ListHeaderComponent={renderHeader}
      ListEmptyComponent={renderEmpty}
      ListFooterComponent={hasMore ? <ActivityIndicator style={{ paddingVertical: Spacing.lg }} color={colors.textTertiary} /> : null}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} tintColor={colors.textTertiary} />}
      onEndReached={loadMore}
      onEndReachedThreshold={0.5}
      onScroll={Animated.event(
        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
        { useNativeDriver: true }
      )}
      scrollEventThrottle={16}
    />
  );
}

/* ─── Sub-components ─── */

function SectionTitle({ label, colors }: { label: string; colors: ReturnType<typeof useThemeColors> }) {
  return (
    <View style={styles.sectionTitleRow}>
      <View style={[styles.sectionAccent, { backgroundColor: colors.tint }]} />
      <ThemedText type="subtitle" style={{ fontSize: 16 }}>{label}</ThemedText>
    </View>
  );
}

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
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ selected }}
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

/* ─── Styles ─── */

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
    gap: Spacing.md,
  },
  welcomeSection: { gap: Spacing.xs },
  welcomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.sm,
    borderWidth: 1,
    marginTop: Spacing.xs,
  },
  quickActionRow: { flexDirection: 'row', gap: Spacing.sm },
  quickPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  quickPillIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterScroll: { marginHorizontal: -Spacing.lg, paddingHorizontal: Spacing.lg },
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
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  sectionAccent: {
    width: 3,
    height: 18,
    borderRadius: 2,
  },
  boardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  boardCard: {
    width: '48%',
    flexGrow: 1,
    borderRadius: Radius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  boardAccentBar: {
    height: 4,
  },
  boardCardBody: {
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  boardCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  boardIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedCard: {
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderLeftWidth: 3,
  },
  feedMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  metaBadge: {
    paddingVertical: 3,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.sm,
    borderWidth: 1,
  },
});
