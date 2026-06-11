import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CARD, INK, SUB } from '../constants/colors';
import type { Entry } from '../types/entry';

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

type Props = {
  entry: Entry;
  onPress: () => void;
};

/**
 * 日記一覧カードコンポーネント。
 * 日付・曜日・アイコン（絵文字）・タイトル・本文抜粋を表示する。
 */
export function EntryCard({ entry, onPress }: Props) {
  const day = String(entry.date.getDate()).padStart(2, '0');
  const weekday = WEEKDAYS[entry.date.getDay()];

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.dateColumn}>
        <Text style={styles.weekday}>{weekday}</Text>
        <Text style={styles.day}>{day}</Text>
      </View>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.icon}>{entry.icon}</Text>
          <Text style={styles.title} numberOfLines={1}>
            {entry.title || '(無題)'}
          </Text>
        </View>
        {entry.body.length > 0 && (
          <Text style={styles.excerpt} numberOfLines={2}>
            {entry.body}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: 16,
    backgroundColor: CARD,
    borderRadius: 14,
    padding: 16,
  },
  dateColumn: {
    alignItems: 'center',
    width: 44,
    paddingTop: 2,
  },
  weekday: {
    fontSize: 11,
    color: SUB,
  },
  day: {
    fontSize: 22,
    fontWeight: '600',
    color: INK,
    marginTop: 2,
  },
  body: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  icon: {
    fontSize: 16,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: INK,
  },
  excerpt: {
    fontSize: 13,
    color: SUB,
    marginTop: 6,
    lineHeight: 20,
  },
});
