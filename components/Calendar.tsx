import { ThemedView } from "@/components/ThemedView";
import { DateTime } from "luxon";
import { useCallback, useState } from "react";
import { Dimensions, StyleSheet, TouchableOpacity } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
    Extrapolation,
    interpolate,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withTiming
} from "react-native-reanimated";
import { ThemedText } from "./ThemedText";
import { IconSymbol } from "./ui/IconSymbol";

const SWIPE_THRESHOLD = 100;
const { height: screenHeight } = Dimensions.get('window');

export default function Calendar() {
  // 현재 날짜와 선택된 날짜 상태 관리
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isWeeklyView, setIsWeeklyView] = useState(false);

  // 제스처 애니메이션을 위한 변수들
  const translateY = useSharedValue(0);
  const context = useSharedValue({ startY: 0 });

  // 월의 첫째 날과 마지막 날 계산
  const firstDayOfMonth = DateTime.fromJSDate(currentDate).startOf('month');
  const lastDayOfMonth = DateTime.fromJSDate(currentDate).endOf('month');
  const daysInMonth = lastDayOfMonth.day;
  
  // 달력 그리드 계산을 위한 변수들
  const firstDayWeekday = firstDayOfMonth.weekday % 7;
  const daysBeforeMonth = firstDayWeekday;
  const totalCells = Math.ceil((daysBeforeMonth + daysInMonth) / 7) * 7;

  // 주간 뷰를 위한 날짜 배열 생성
  const getWeekDates = useCallback(() => {
    const selectedDateTime = DateTime.fromJSDate(selectedDate);
    const startOfWeek = selectedDateTime.startOf('week');
    const weekDates = [];
    
    for (let i = 0; i < 7; i++) {
      weekDates.push(startOfWeek.plus({ days: i }));
    }
    
    return weekDates;
  }, [selectedDate]);

  // 월간 뷰에서 각 날짜 셀 정보 생성
  const getDayCell = (index: number) => {
    const dayOffset = index - daysBeforeMonth;
    
    if (dayOffset < 0) {
      // 이전 달의 날짜
      const prevMonthDay = firstDayOfMonth.minus({ days: daysBeforeMonth - index });
      return {
        date: prevMonthDay,
        isCurrentMonth: false,
        isToday: false,
        isSelected: false
      };
    } else if (dayOffset >= daysInMonth) {
      // 다음 달의 날짜
      const nextMonthDay = lastDayOfMonth.plus({ days: index - daysBeforeMonth - daysInMonth + 1 });
      return {
        date: nextMonthDay,
        isCurrentMonth: false,
        isToday: false,
        isSelected: false
      };
    } else {
      // 현재 달의 날짜
      const currentDay = firstDayOfMonth.plus({ days: dayOffset });
      const today = DateTime.now().startOf('day');
      const selected = DateTime.fromJSDate(selectedDate).startOf('day');
      
      return {
        date: currentDay,
        isCurrentMonth: true,
        isToday: currentDay.hasSame(today, 'day'),
        isSelected: currentDay.hasSame(selected, 'day')
      };
    }
  };

  // 주간 뷰에서 각 날짜 셀 정보 생성
  const getWeekDayCell = (date: DateTime, index: number) => {
    const today = DateTime.now().startOf('day');
    const selected = DateTime.fromJSDate(selectedDate).startOf('day');
    
    return {
      date,
      isCurrentMonth: date.month === currentDate.getMonth() + 1,
      isToday: date.hasSame(today, 'day'),
      isSelected: date.hasSame(selected, 'day')
    };
  };

  // 뷰 전환 핸들러
  const handleViewSwitch = useCallback(() => {
    setIsWeeklyView(prev => !prev);
  }, []);

  // 제스처 설정 - 위아래로 스와이프하여 뷰 전환
  const panGesture = Gesture.Pan()
    .onStart(() => {
      context.value = { startY: translateY.value };
    })
    .onUpdate((event) => {
      // 월간 뷰에서는 아래로만, 주간 뷰에서는 위로만 제스처 허용
      if ((isWeeklyView && event.translationY > 0) || (!isWeeklyView && event.translationY < 0)) {
        translateY.value = context.value.startY + event.translationY;
      }
    })
    .onEnd((event) => {
      const shouldSwitch = Math.abs(event.translationY) > SWIPE_THRESHOLD;
      
      // 방향 제한: 월간 뷰에서는 아래로만, 주간 뷰에서는 위로만
      const isValidDirection = (isWeeklyView && event.translationY > 0) || (!isWeeklyView && event.translationY < 0);
      
      if (shouldSwitch && isValidDirection) {
        runOnJS(handleViewSwitch)();
      }
      
      translateY.value = withTiming(0, { duration: 200 });
    });

  // 제스처 애니메이션 스타일
  const animatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      Math.abs(translateY.value),
      [0, SWIPE_THRESHOLD],
      [1, 0.5],
      Extrapolation.CLAMP
    );

    return {
      opacity,
      transform: [{ translateY: translateY.value }]
    };
  });

  // 월간 뷰 렌더링
  const renderMonthlyView = () => (
    <>
      <ThemedView style={styles.weekdayHeader}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
          <ThemedView key={index} style={styles.weekdayCell}>
            <ThemedText style={[styles.weekdayText, day === 'Sun' && styles.weekdayTextSunday, day === 'Sat' && styles.weekdayTextSaturday]}>{day}</ThemedText>
          </ThemedView>
        ))}
      </ThemedView>
      
      <ThemedView style={styles.dayGrid}>
        {Array.from({ length: totalCells }).map((_, index) => {
          const dayCell = getDayCell(index);
          return (
            <ThemedView style={styles.dayCell} key={index}>
              <TouchableOpacity 
                onPress={() => {
                  if (dayCell.isCurrentMonth) {
                    setSelectedDate(dayCell.date.toJSDate());
                  }
                }}
                style={[
                  styles.dayButton,
                  dayCell.isSelected && styles.dayButtonSelected,
                ]}
              >
                <ThemedText style={[
                  styles.dayCellText,
                  !dayCell.isCurrentMonth && styles.dayCellTextOtherMonth,
                  dayCell.isSelected && styles.dayCellTextSelected
                ]}>
                  {dayCell.date.day}
                </ThemedText>
              </TouchableOpacity>
            </ThemedView>
          );
        })}
      </ThemedView>
    </>
  );

  // 주간 뷰 렌더링
  const renderWeeklyView = () => {
    const weekDates = getWeekDates();
    
    return (
      <>
        <ThemedView style={styles.weekdayHeader}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
            <ThemedView key={index} style={styles.weekdayCell}>
              <ThemedText style={[styles.weekdayText, day === 'Sun' && styles.weekdayTextSunday, day === 'Sat' && styles.weekdayTextSaturday]}>{day}</ThemedText>
            </ThemedView>
          ))}
        </ThemedView>
        
        <ThemedView style={styles.dayGrid}>
          {weekDates.map((date, index) => {
            const dayCell = getWeekDayCell(date, index);
            return (
              <ThemedView style={styles.dayCell} key={index}>
                <TouchableOpacity 
                  onPress={() => setSelectedDate(date.toJSDate())}
                  style={[
                    styles.dayButton,
                    dayCell.isSelected && styles.dayButtonSelected,
                  ]}
                >
                  <ThemedText style={[
                    styles.dayCellText,
                    !dayCell.isCurrentMonth && styles.dayCellTextOtherMonth,
                    dayCell.isSelected && styles.dayCellTextSelected
                  ]}>
                    {date.day}
                  </ThemedText>
                </TouchableOpacity>
              </ThemedView>
            );
          })}
        </ThemedView>
      </>
    );
  };

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.fullScreenContainer, animatedStyle]}>
        <ThemedView style={styles.container}>
          {/* 상단 네비게이션 바 */}
          <ThemedView style={styles.topBar}>
            <TouchableOpacity onPress={() => setCurrentDate(DateTime.fromJSDate(currentDate).minus({ month: 1 }).toJSDate())}>
              <IconSymbol name="chevron-left" size={24} color="skyblue" />
            </TouchableOpacity>
            <ThemedText style={styles.monthYearText}>
              { DateTime.fromJSDate(currentDate).toFormat('MMMM yyyy') }
            </ThemedText>
            <TouchableOpacity onPress={() => setCurrentDate(DateTime.fromJSDate(currentDate).plus({ month: 1 }).toJSDate())}>
              <IconSymbol name="chevron-right" size={24} color="skyblue" />
            </TouchableOpacity>
          </ThemedView>
          
          {/* 달력 내용 렌더링 */}
          {isWeeklyView ? renderWeeklyView() : renderMonthlyView()}
          
          {/* 뷰 전환 인디케이터 */}
          <ThemedView style={styles.viewIndicator}>
            <ThemedText style={styles.viewIndicatorText}>
              {isWeeklyView ? '주 캘린더' : '월 캘린더'}
            </ThemedText>
            <ThemedText style={styles.viewIndicatorSubtext}>
              {isWeeklyView ? '아래로 스와이프하여 월 캘린더로 전환' : '위로 스와이프하여 주 캘린더로 전환'}
            </ThemedText>
          </ThemedView>
        </ThemedView>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    width: '100%',
    paddingTop: 20, // 상단 여백 추가
  },
  
  topBar: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  monthYearText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
  },
  
  weekdayHeader: {
    flexDirection: 'row',
    width: '100%',
    paddingHorizontal: 16,
  },
  weekdayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weekdayText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  weekdayTextSunday: {
    color: 'red',
  },
  weekdayTextSaturday: {
    color: 'skyblue',
  },

  dayGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    paddingHorizontal: 16,
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayButton: {
    width: '80%',
    height: '80%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 100,
  },
  dayButtonSelected: {
    borderWidth: 2,
    borderColor: 'skyblue',
  },
  dayCellText: {
    fontSize: 16,
    fontWeight: '500',
  },
  dayCellTextOtherMonth: {
    color: '#777',
  },
  dayCellTextSelected: {
    fontWeight: 'bold',
    color: 'skyblue',
  },
  
  viewIndicator: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 20,
  },
  viewIndicatorText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  viewIndicatorSubtext: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
});