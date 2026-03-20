import { Component, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Brand, Radius, Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';

type Props = {
  children: ReactNode;
  onError?: (error: Error) => void;
};

type State = {
  hasError: boolean;
  error?: Error;
};

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    this.props.onError?.(error);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <View style={[styles.iconCircle, { backgroundColor: Brand.errorMuted }]}>
            <ThemedText style={{ fontSize: 28 }}>!</ThemedText>
          </View>
          <ThemedText type="subtitle" style={{ textAlign: 'center' }}>
            문제가 발생했습니다
          </ThemedText>
          <ThemedText type="caption" style={{ textAlign: 'center', color: '#8C95A1' }}>
            {this.state.error?.message ?? '알 수 없는 오류가 발생했습니다.'}
          </ThemedText>
          <Pressable
            accessibilityLabel="다시 시도"
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.retryButton,
              pressed && { opacity: 0.85 },
            ]}
            onPress={this.handleRetry}>
            <ThemedText type="defaultSemiBold" style={{ color: '#FFFFFF' }}>
              다시 시도
            </ThemedText>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xxl,
    gap: Spacing.md,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  retryButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.lg,
    backgroundColor: Brand.primary,
    marginTop: Spacing.sm,
  },
});
