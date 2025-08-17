import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default function MyPageScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText>My Page</ThemedText>
    </ThemedView>
  );
}
