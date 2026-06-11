import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  Modal,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

import { INK, SUB, ACCENT, BORDER, CARD, PAPER } from '../constants/colors';

type DateRange = {
  start: Date;
  end: Date;
};

type Props = {
  query: string;
  onQueryChange: (q: string) => void;
  dateRange: DateRange | null;
  onDateRangeChange: (range: DateRange | null) => void;
  onClear: () => void;
};

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

function formatDate(date: Date): string {
  return `${date.getMonth() + 1}/${date.getDate()}(${WEEKDAYS[date.getDay()]})`;
}

export function SearchBar({
  query,
  onQueryChange,
  dateRange,
  onDateRangeChange,
  onClear,
}: Props) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  // 'start' | 'end' のどちらを選択中か
  const [pickingTarget, setPickingTarget] = useState<'start' | 'end'>('start');
  const [pendingStart, setPendingStart] = useState<Date>(new Date());

  const hasSearch = query.trim().length > 0 || dateRange !== null;

  const openStartPicker = () => {
    setPendingStart(dateRange?.start ?? new Date());
    setPickingTarget('start');
    setShowDatePicker(true);
  };

  const handleDateChange = (_: unknown, selected?: Date) => {
    if (!selected) {
      // キャンセル
      if (Platform.OS === 'android') setShowDatePicker(false);
      return;
    }

    if (pickingTarget === 'start') {
      setPendingStart(selected);
      setPickingTarget('end');
      // Android では次のピッカーを即開く
      if (Platform.OS === 'android') {
        // 同一モーダル内で続けて開く
      }
    } else {
      // end を選択完了
      const end = new Date(selected);
      end.setHours(23, 59, 59, 999);
      onDateRangeChange({ start: pendingStart, end });
      setShowDatePicker(false);
    }
  };

  const clearDateRange = () => {
    onDateRangeChange(null);
  };

  return (
    <View style={styles.container}>
      {/* テキスト検索欄 */}
      <View style={styles.inputRow}>
        <Text style={styles.icon}>🔍</Text>
        <TextInput
          style={styles.input}
          placeholder="タイトル・本文を検索"
          placeholderTextColor={SUB}
          value={query}
          onChangeText={onQueryChange}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        {hasSearch && (
          <Pressable onPress={onClear} hitSlop={8} style={styles.clearBtn}>
            <Text style={styles.clearText}>✕</Text>
          </Pressable>
        )}
      </View>

      {/* 日付範囲ボタン */}
      <View style={styles.dateRow}>
        {dateRange ? (
          <Pressable style={styles.dateChip} onPress={openStartPicker}>
            <Text style={styles.dateChipText}>
              {formatDate(dateRange.start)} 〜 {formatDate(dateRange.end)}
            </Text>
            <Pressable onPress={clearDateRange} hitSlop={8}>
              <Text style={styles.dateChipClear}>✕</Text>
            </Pressable>
          </Pressable>
        ) : (
          <Pressable style={styles.dateBtn} onPress={openStartPicker}>
            <Text style={styles.dateBtnText}>日付範囲で絞り込む</Text>
          </Pressable>
        )}
      </View>

      {/* DatePicker モーダル (iOS) / インライン (Android) */}
      {showDatePicker && (
        <Modal
          transparent
          animationType="slide"
          visible={showDatePicker}
          onRequestClose={() => setShowDatePicker(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setShowDatePicker(false)}
          >
            <View style={styles.pickerCard}>
              <Text style={styles.pickerTitle}>
                {pickingTarget === 'start' ? '開始日を選択' : '終了日を選択'}
              </Text>
              <DateTimePicker
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                value={
                  pickingTarget === 'start'
                    ? pendingStart
                    : dateRange?.end ?? new Date()
                }
                onChange={handleDateChange}
                locale="ja-JP"
              />
              {Platform.OS === 'ios' && (
                <Pressable
                  style={styles.pickerDoneBtn}
                  onPress={() => {
                    if (pickingTarget === 'start') {
                      setPickingTarget('end');
                    } else {
                      setShowDatePicker(false);
                    }
                  }}
                >
                  <Text style={styles.pickerDoneText}>
                    {pickingTarget === 'start' ? '次へ' : '完了'}
                  </Text>
                </Pressable>
              )}
            </View>
          </Pressable>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
    gap: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: BORDER,
  },
  icon: {
    fontSize: 16,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: INK,
  },
  clearBtn: {
    padding: 2,
  },
  clearText: {
    fontSize: 14,
    color: SUB,
  },
  dateRow: {
    flexDirection: 'row',
  },
  dateBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: CARD,
  },
  dateBtnText: {
    fontSize: 13,
    color: SUB,
  },
  dateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#FBEFE3',
    borderWidth: 1,
    borderColor: ACCENT,
    gap: 8,
  },
  dateChipText: {
    fontSize: 13,
    color: ACCENT,
    fontWeight: '600',
  },
  dateChipClear: {
    fontSize: 12,
    color: ACCENT,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  pickerCard: {
    backgroundColor: PAPER,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
  },
  pickerTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: INK,
    textAlign: 'center',
    marginBottom: 8,
  },
  pickerDoneBtn: {
    marginTop: 12,
    alignSelf: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: ACCENT,
    borderRadius: 20,
  },
  pickerDoneText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 15,
  },
});
