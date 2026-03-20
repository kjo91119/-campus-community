import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Brand, Radius, Shadow, Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { useThemeColors } from '@/hooks/use-theme-color';

/* ─── Types ─── */

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

type ToastMessage = {
  id: number;
  text: string;
  variant: ToastVariant;
};

type ToastContextValue = {
  showToast: (text: string, variant?: ToastVariant) => void;
};

/* ─── Context ─── */

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);

  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  return ctx;
}

/* ─── Provider ─── */

let nextToastId = 0;

export function ToastProvider({ children }: PropsWithChildren) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((text: string, variant: ToastVariant = 'success') => {
    const id = ++nextToastId;
    setToasts((prev) => [...prev, { id, text, variant }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

/* ─── Container ─── */

function ToastContainer({
  toasts,
  onRemove,
}: {
  toasts: ToastMessage[];
  onRemove: (id: number) => void;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View
      pointerEvents="box-none"
      style={[styles.container, { bottom: insets.bottom + 60 }]}>
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={() => onRemove(toast.id)} />
      ))}
    </View>
  );
}

/* ─── Individual toast ─── */

const TOAST_DURATION = 3000;

const VARIANT_COLORS: Record<ToastVariant, { bg: string; border: string; text: string }> = {
  success: { bg: Brand.successMuted, border: Brand.success, text: '#065F46' },
  error: { bg: Brand.errorMuted, border: Brand.error, text: '#991B1B' },
  warning: { bg: Brand.warningMuted, border: Brand.warning, text: '#92400E' },
  info: { bg: Brand.infoMuted, border: Brand.info, text: '#1E40AF' },
};

function ToastItem({ toast, onDismiss }: { toast: ToastMessage; onDismiss: () => void }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const colors = useThemeColors();
  const variantColors = VARIANT_COLORS[toast.variant];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 20, duration: 200, useNativeDriver: true }),
      ]).start(() => onDismiss());
    }, TOAST_DURATION);

    return () => clearTimeout(timer);
  }, [onDismiss, opacity, translateY]);

  return (
    <Animated.View
      style={[
        styles.toast,
        {
          backgroundColor: colors.surface,
          borderColor: variantColors.border,
          opacity,
          transform: [{ translateY }],
        },
        Shadow.md,
      ]}>
      <View style={[styles.toastAccent, { backgroundColor: variantColors.border }]} />
      <ThemedText type="defaultSemiBold" style={styles.toastText} numberOfLines={2}>
        {toast.text}
      </ThemedText>
      <Pressable
        accessibilityLabel="닫기"
        accessibilityRole="button"
        hitSlop={8}
        onPress={onDismiss}>
        <ThemedText type="caption" style={{ color: colors.textTertiary }}>
          ✕
        </ThemedText>
      </Pressable>
    </Animated.View>
  );
}

/* ─── Styles ─── */

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: Spacing.lg,
    right: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.sm,
    zIndex: 9999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: 480,
    borderRadius: Radius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  toastAccent: {
    width: 4,
    alignSelf: 'stretch',
  },
  toastText: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    fontSize: 14,
  },
});
