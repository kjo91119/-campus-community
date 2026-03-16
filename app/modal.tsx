import { Link } from 'expo-router';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function ModalScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">빠른 안내</ThemedText>
      <ThemedText style={styles.description}>
        이 모달은 추후 공지, 필터, 작성 옵션처럼 짧은 보조 흐름을 담는 용도로 사용할 수 있습니다.
      </ThemedText>
      <Link href="/" dismissTo style={styles.link}>
        <ThemedText type="link">게시판으로 돌아가기</ThemedText>
      </Link>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  description: {
    opacity: 0.8,
  },
  link: {
    paddingVertical: 15,
  },
});
