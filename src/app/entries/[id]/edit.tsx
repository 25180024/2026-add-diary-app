import { useEffect, useState } from 'react';
import {
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';

import { fetchEntryById } from '../../../services/entries';
import { uploadImage, deleteImage } from '../../../services/storage';
import { useEntries } from '../../../store/entries';
import { EmojiPicker } from '../../../components/EmojiPicker';
import { ImagePickerGrid } from '../../../components/ImagePickerGrid';
import { PAPER, INK, SUB, ACCENT, BORDER } from '../../../constants/colors';
import type { Entry } from '../../../types/entry';

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

export default function EditEntry() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { updateEntry } = useEntries();

  const [original, setOriginal] = useState<Entry | null>(null);
  const [isLoadingEntry, setIsLoadingEntry] = useState(true);

  // フォーム状態
  const [icon, setIcon] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [date, setDate] = useState<Date>(new Date());
  const [images, setImages] = useState<string[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 既存エントリをロードして初期値をセット
  useEffect(() => {
    if (!id) return;
    fetchEntryById(id)
      .then((entry) => {
        setOriginal(entry);
        setIcon(entry.icon);
        setTitle(entry.title);
        setBody(entry.body);
        setDate(entry.date);
        setImages(entry.images);
      })
      .catch((err: unknown) => {
        Alert.alert(
          'エラー',
          err instanceof Error ? err.message : '取得に失敗しました',
        );
        router.back();
      })
      .finally(() => setIsLoadingEntry(false));
  }, [id]);

  const canSave =
    icon.trim().length > 0 &&
    title.trim().length > 0 &&
    body.trim().length > 0 &&
    !isSaving;

  const handleDateChange = (_: unknown, selected?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (selected) setDate(selected);
  };

  const handleSave = async () => {
    if (!canSave || !id || !original) return;
    setIsSaving(true);
    try {
      // 削除された画像を Storage から消す
      const removedUrls = original.images.filter(
        (url) => !images.includes(url),
      );
      await Promise.all(removedUrls.map((url) => deleteImage(url)));

      // 新しく追加されたローカル URI を Storage にアップロード
      const isLocalUri = (uri: string) =>
        uri.startsWith('file://') || uri.startsWith('content://') || uri.startsWith('/');

      const uploadedImages = await Promise.all(
        images.map(async (uri) => {
          if (isLocalUri(uri)) return uploadImage(id, uri);
          return uri; // 既存の Storage URL はそのまま
        }),
      );

      await updateEntry(id, {
        icon,
        title: title.trim(),
        body: body.trim(),
        date,
        images: uploadedImages,
      });

      router.back();
    } catch (err) {
      Alert.alert(
        'エラー',
        err instanceof Error ? err.message : '保存に失敗しました',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const dateLabel = `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}(${WEEKDAYS[date.getDay()]})`;

  if (isLoadingEntry) {
    return (
      <SafeAreaView style={styles.center} edges={['top']}>
        <ActivityIndicator color={ACCENT} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.cancel}>キャンセル</Text>
        </Pressable>
        <Text style={styles.headerTitle}>日記を編集</Text>
        <Pressable onPress={handleSave} hitSlop={12} disabled={!canSave}>
          <Text style={[styles.save, !canSave && styles.saveDisabled]}>
            {isSaving ? '保存中…' : '保存'}
          </Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* 気分 (アイコン) */}
          <Text style={styles.sectionLabel}>気分</Text>
          <View style={styles.section}>
            <EmojiPicker selected={icon} onSelect={setIcon} />
          </View>

          {/* 日付 */}
          <Text style={styles.sectionLabel}>日付</Text>
          <Pressable
            style={styles.dateBtn}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.dateBtnText}>{dateLabel}</Text>
          </Pressable>
          {showDatePicker && (
            <DateTimePicker
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              value={date}
              onChange={handleDateChange}
              locale="ja-JP"
            />
          )}
          {Platform.OS === 'ios' && showDatePicker && (
            <Pressable
              style={styles.datePickerDone}
              onPress={() => setShowDatePicker(false)}
            >
              <Text style={styles.datePickerDoneText}>完了</Text>
            </Pressable>
          )}

          {/* タイトル */}
          <TextInput
            style={styles.titleInput}
            placeholder="タイトル"
            placeholderTextColor="#B5AC9F"
            value={title}
            onChangeText={setTitle}
            returnKeyType="next"
          />

          <View style={styles.divider} />

          {/* 本文 */}
          <TextInput
            style={styles.bodyInput}
            placeholder="今日のこと..."
            placeholderTextColor="#B5AC9F"
            value={body}
            onChangeText={setBody}
            multiline
            textAlignVertical="top"
          />

          <View style={styles.divider} />

          {/* 画像 */}
          <Text style={styles.sectionLabel}>画像（任意）</Text>
          <ImagePickerGrid images={images} onChange={setImages} />
        </ScrollView>
      </KeyboardAvoidingView>
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
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: INK,
    letterSpacing: 2,
  },
  cancel: {
    fontSize: 15,
    color: SUB,
  },
  save: {
    fontSize: 15,
    color: ACCENT,
    fontWeight: '600',
  },
  saveDisabled: {
    color: '#C9C0B2',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  sectionLabel: {
    fontSize: 12,
    color: SUB,
    letterSpacing: 2,
    marginTop: 20,
    marginBottom: 12,
  },
  section: {
    marginBottom: 4,
  },
  dateBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 4,
  },
  dateBtnText: {
    fontSize: 15,
    color: INK,
  },
  datePickerDone: {
    alignSelf: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 4,
  },
  datePickerDoneText: {
    fontSize: 15,
    color: ACCENT,
    fontWeight: '600',
  },
  titleInput: {
    fontSize: 20,
    fontWeight: '600',
    color: INK,
    paddingVertical: 10,
    marginTop: 8,
  },
  divider: {
    height: 1,
    backgroundColor: BORDER,
    marginVertical: 8,
  },
  bodyInput: {
    fontSize: 15,
    color: INK,
    lineHeight: 24,
    minHeight: 200,
    paddingTop: 10,
    paddingBottom: 10,
  },
});
