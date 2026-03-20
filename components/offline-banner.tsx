import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { useNetworkStatus } from '@/hooks/use-network-status';
import { useThemeColors } from '@/hooks/use-theme-color';

export function OfflineBanner() {
  const { isOnline } = useNetworkStatus();
  const colors = useThemeColors();

  if (isOnline) {
    return null;
  }

  return (
    <View
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      style={[
        styles.banner,
        {
          backgroundColor: colors.warningBackground,
          borderColor: colors.warningBorder,
        },
      ]}>
      <Ionicons name="cloud-offline-outline" size={16} color={colors.warningText} />
      <ThemedText type="caption" style={{ color: colors.warningText, fontWeight: '600' }}>
        오프라인 상태입니다
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderRadius: 0,
  },
});
