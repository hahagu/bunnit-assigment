import Calendar from '@/components/Calendar';
import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default function CalendarScreen() {
  return (
    <Calendar />
  );
}
