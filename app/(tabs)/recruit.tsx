import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  RECRUITMENT_MODE_LABELS,
  RECRUITMENT_STATUS_LABELS,
  RECRUITMENT_TYPE_OPTIONS,
  RECRUITMENT_TYPE_LABELS,
} from '@/constants/community';
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
import { SUPPORTED_MAJOR_GROUPS, getMajorGroupById } from '@/lib/community/metadata';
import type { RecruitmentCard } from '@/types/domain';

export default function RecruitScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const { track } = useAnalytics();
  const { profile, isReadOnly } = useAppSession();
  const { getRecruitments, isHydrating, isRefreshing, refresh } = useCommunityData();
  const [selectedMajorId, setSelectedMajorId] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [includeClosed, setIncludeClosed] = useState(false);
  const recruitments = getRecruitments(selectedMajorId).filter((recruitment) => {
    if (selectedType !== 'all' && recruitment.recruitmentType !== selectedType) return false;
    if (!includeClosed && recruitment.status !== 'open') return false;
    return true;
  });

  const hasTrackedRecruitmentListRef = useRef(false);
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
    if (hasTrackedRecruitmentListRef.current) return;
    track('recruitment_list_viewed', { major_group: profile.primaryMajorGroupId ?? null });
    hasTrackedRecruitmentListRef.current = true;
  }, [profile.primaryMajorGroupId, track]);

  const renderHeader = useCallback(() => (
    <>
      {/* Header */}
      <Animated.View style={[styles.headerSection, { opacity: headerOpacity, transform: [{ translateY: headerTranslateY }] }]}>
        <ThemedText type="title">모집</ThemedText>
        <ThemedText type="caption" style={{ color: colors.textSecondary }}>
          모집 상세에서 참여 의사 댓글을 남기는 흐름으로 시작합니다.
        </ThemedText>
        {isReadOnly ? (
          <View style={[styles.statusBadge, { backgroundColor: colors.warningBackground, borderColor: colors.warningBorder }]}>
            <ThemedText type="caption" style={{ color: colors.warningText }}>읽기 전용</ThemedText>
          </View>
        ) : null}
      </Animated.View>

      {/* Quick actions */}
      <View style={styles.quickActionRow}>
        <Pressable
          style={({ pressed }) => [
            styles.quickAction,
            { backgroundColor: colors.surface, borderColor: colors.cardBorder },
            pressed && { backgroundColor: colors.surfacePressed },
          ]}
          onPress={() => router.push('/(tabs)/recruit-write' as never)}>
          <View style={[styles.quickActionIcon, { backgroundColor: Brand.primaryMuted }]}>
            <Ionicons name="add-circle-outline" size={20} color={Brand.primary} />
          </View>
          <ThemedText type="defaultSemiBold" style={{ fontSize: 14 }}>모집 작성</ThemedText>
          <ThemedText type="caption" style={{ color: colors.textTertiary }} numberOfLines={1}>
            스터디, 과제, 팀 프로젝트
          </ThemedText>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.quickAction,
            { backgroundColor: colors.surface, borderColor: colors.cardBorder },
            pressed && { backgroundColor: colors.surfacePressed },
          ]}
          onPress={() => setSelectedMajorId(profile.primaryMajorGroupId ?? 'all')}>
          <View style={[styles.quickActionIcon, { backgroundColor: '#3B82F61A' }]}>
            <Ionicons name="school-outline" size={20} color="#3B82F6" />
          </View>
          <ThemedText type="defaultSemiBold" style={{ fontSize: 14 }}>내 전공</ThemedText>
          <ThemedText type="caption" style={{ color: colors.textTertiary }} numberOfLines={1}>
            {getMajorGroupById(profile.primaryMajorGroupId)?.label ?? '전공 모집만 보기'}
          </ThemedText>
        </Pressable>
      </View>

      {/* Filters */}
      <ThemedView variant="surface" style={styles.card}>
        <ThemedText type="sectionHeader">모집 유형</ThemedText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.filterRow}>
            <FilterChip
              label="전체 유형"
              selected={selectedType === 'all'}
              colors={colors}
              onPress={() => setSelectedType('all')}
            />
            {RECRUITMENT_TYPE_OPTIONS.map((option) => (
              <FilterChip
                key={option.value}
                label={option.label}
                selected={selectedType === option.value}
                colors={colors}
                onPress={() => setSelectedType(option.value)}
              />
            ))}
          </View>
        </ScrollView>

        <ThemedText type="sectionHeader" style={{ marginTop: Spacing.sm }}>전공군</ThemedText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.filterRow}>
            <FilterChip
              label="전체"
              selected={selectedMajorId === 'all'}
              colors={colors}
              onPress={() => setSelectedMajorId('all')}
            />
            {SUPPORTED_MAJOR_GROUPS.map((group) => (
              <FilterChip
                key={group.id}
                label={group.label}
                selected={selectedMajorId === group.id}
                accentColor={group.accentColor}
                colors={colors}
                onPress={() => setSelectedMajorId(group.id)}
              />
            ))}
          </View>
        </ScrollView>

        <Pressable
          onPress={() => setIncludeClosed((c) => !c)}
          style={({ pressed }) => [
            styles.toggleChip,
            { backgroundColor: colors.chipBackground, borderColor: colors.chipBorder },
            includeClosed && { backgroundColor: colors.chipSelectedBackground, borderColor: colors.chipSelectedBorder },
            pressed && { opacity: 0.7 },
          ]}>
          <ThemedText
            type="caption"
            style={{ fontWeight: '600', color: includeClosed ? colors.chipSelectedText : colors.textSecondary }}>
            {includeClosed ? '마감 포함' : '모집 중만 보기'}
          </ThemedText>
        </Pressable>
      </ThemedView>

      {/* List title */}
      <View style={styles.listSection}>
        <ThemedText type="subtitle">모집 목록</ThemedText>
      </View>
    </>
  ), [colors, headerOpacity, headerTranslateY, includeClosed, isReadOnly, profile.primaryMajorGroupId, router, selectedMajorId, selectedType]);

  const renderItem = useCallback(({ item: recruitment, index }: { item: RecruitmentCard; index: number }) => {
    const mg = getMajorGroupById(recruitment.preferredMajorGroupId);
    return (
      <FadeInView delay={index * 50}>
        <Pressable
          style={({ pressed }) => [
            styles.recruitCard,
            { backgroundColor: colors.surface, borderColor: colors.cardBorder },
            CardShadow,
            pressed && { backgroundColor: colors.surfacePressed },
          ]}
          onPress={() => router.push(`/(tabs)/recruitments/${recruitment.id}` as never)}>
          <ThemedText type="defaultSemiBold" numberOfLines={2}>{recruitment.title}</ThemedText>
          <ThemedText type="caption" style={{ color: colors.textSecondary }} numberOfLines={2}>
            {recruitment.summary}
          </ThemedText>

          <View style={styles.badgeRow}>
            <View style={[styles.badge, { backgroundColor: Brand.primaryMuted }]}>
              <ThemedText style={{ color: Brand.primary, fontSize: 11, fontWeight: '600' }}>
                {RECRUITMENT_TYPE_LABELS[recruitment.recruitmentType]}
              </ThemedText>
            </View>
            <View style={[styles.badge, { backgroundColor: Brand.successMuted }]}>
              <ThemedText style={{ color: Brand.success, fontSize: 11, fontWeight: '600' }}>
                {RECRUITMENT_STATUS_LABELS[recruitment.status]}
              </ThemedText>
            </View>
          </View>

          <View style={styles.metaRow}>
            {mg ? (
              <View style={[styles.badge, { backgroundColor: mg.accentColor + '1A' }]}>
                <ThemedText style={{ color: mg.accentColor, fontSize: 11, fontWeight: '600' }}>
                  {mg.shortLabel ?? mg.label}
                </ThemedText>
              </View>
            ) : null}
            <ThemedText type="caption" style={{ color: colors.textTertiary }}>
              {RECRUITMENT_MODE_LABELS[recruitment.mode ?? 'online']} · {recruitment.headcountLabel} · {recruitment.deadlineLabel}
            </ThemedText>
          </View>
        </Pressable>
      </FadeInView>
    );
  }, [colors, router]);

  const renderEmpty = useCallback(() => (
    <EmptyState
      icon="people-outline"
      title="모집글이 없습니다"
      description="조건에 맞는 모집글이 없습니다. 첫 모집글을 작성해 보세요."
      actionLabel="모집 작성"
      onAction={() => router.push('/(tabs)/recruit-write' as never)}
    />
  ), [router]);

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
      data={recruitments}
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

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    padding: Spacing.xl,
    paddingBottom: Spacing.xxxl,
    gap: Spacing.lg,
  },
  headerSection: { gap: Spacing.xs },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.sm,
    borderWidth: 1,
    marginTop: Spacing.xs,
  },
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
  filterRow: { flexDirection: 'row', gap: Spacing.sm },
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
  toggleChip: {
    alignSelf: 'flex-start',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  listSection: { gap: Spacing.sm },
  recruitCard: {
    gap: Spacing.sm,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  badge: {
    paddingVertical: 2,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
});
