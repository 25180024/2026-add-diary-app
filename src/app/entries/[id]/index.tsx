import { useEffect, useState } from 'react';
import {
  Alert,
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';

import { fetchEntryById, deleteEntry } from '../../../services/entries';
import { deleteImage } from '../../../services/storage';
import { PAPER, INK, SUB, ACCENT, BORDER } from '../../../constants/colors';
import type { Entry } from '../../../types/entry';

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

function formatDate(date: Date): string {
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日(${WEEKDAYS[date.getDay()]})`;
}

export default function EntryDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [entry, setEntry] = useState<Entry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    fetchEntryById(id)
      .then(setEntry)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : '取得に失敗しました');
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  const handleDelete = () => {
    Alert.alert('削除しますか？', 'この日記を削除します。元に戻せません。', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '削除',
        style: 'destructive',
        onPress: async () => {
          if (!id || !entry) return;
          try {
            // Storage 画像を先に削除
            await Promise.all(entry.images.map((url) => deleteImage(url)));
            await deleteEntry(id);
            router.replace('/');
          } catch (err) {
            Alert.alert('エラー', err instanceof Error ? err.message : '削除に失敗しました');
          }
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.center} edges={['top']}>
        <ActivityIndicator color={ACCENT} />
      </SafeAreaView>
    );
  }

  if (error || !entry) {
    return (
      <SafeAreaView style={styles.center} edges={['top']}>
        <Text style={styles.errorText}>{error ?? '日記が見つかりません'}</Text>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>戻る</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.navBtn}>‹ 戻る</Text>
        </Pressable>
        <Pressable
          onPress={() => router.push(`/entries/${id}/edit` as never)}
          hitSlop={12}
        >
          <Text style={styles.editBtn}>編集</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* アイコン + 日付 */}
        <View style={styles.metaRow}>
          <Text style={styles.icon}>{entry.icon}</Text>
          <Text style={styles.date}>{formatDate(entry.date)}</Text>
        </View>

        {/* タイトル */}
        <Text style={styles.title}>{entry.title}</Text>

        {/* 区切り線 */}
        <View style={styles.divider} />

        {/* 本文 */}
        <Text style={styles.body}>{entry.body}</Text>

        {/* 画像 */}
        {entry.images.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.imagesScroll}
            contentContainerStyle={styles.imagesContent}
          >
            {entry.images.map((uri) => (
              <Image key={uri} source={{ uri }} style={styles.image} />
            ))}
          </ScrollView>
        )}

        {/* 削除ボタン */}
        <Pressable style={styles.deleteBtn} onPress={handleDelete}>
          <Text style={styles.deleteBtnText}>この日記を削除</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: PAPER,
  },
  center: {
    flex: 1,
    backgroundColor: PAPER,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  errorText: {
    fontSize: 14,
    color: SUB,
  },
  backBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  backBtnText: {
    fontSize: 15,
    color: ACCENT,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
  },
  navBtn: {
    fontSize: 16,
    color: ACCENT,
  },
  editBtn: {
    fontSize: 15,
    color: ACCENT,
    fontWeight: '600',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  icon: {
    fontSize: 28,
  },
  date: {
    fontSize: 14,
    color: SUB,
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: INK,
    lineHeight: 32,
  },
  divider: {
    height: 1,
    backgroundColor: BORDER,
    marginVertical: 16,
  },
  body: {
    fontSize: 16,
    color: INK,
    lineHeight: 28,
  },
  imagesScroll: {
    marginTop: 24,
  },
  imagesContent: {
    gap: 12,
    paddingRight: 8,
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 12,
  },
  deleteBtn: {
    marginTop: 48,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E57373',
    alignItems: 'center',
  },
  deleteBtnText: {
    fontSize: 15,
    color: '#C62828',
    fontWeight: '600',
  },
});
