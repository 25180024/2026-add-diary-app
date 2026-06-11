import { Pressable, StyleSheet, Text, View, Image, Alert } from 'react-native';
import * as ExpoImagePicker from 'expo-image-picker';

import { ACCENT, BORDER, CARD, SUB } from '../constants/colors';

const MAX_IMAGES = 5;

type Props = {
  images: string[];
  onChange: (images: string[]) => void;
};

/**
 * 画像選択グリッド（最大5枚）。
 * - 追加: カメラロール選択 または カメラ撮影
 * - 削除: 選択済み画像をタップ → 確認なしで削除
 * - 5枚に達したら追加ボタンを無効化
 */
export function ImagePickerGrid({ images, onChange }: Props) {
  const canAdd = images.length < MAX_IMAGES;

  const handleAdd = () => {
    Alert.alert('画像を追加', '追加方法を選んでください', [
      { text: 'カメラロールから選択', onPress: pickFromLibrary },
      { text: 'カメラで撮影', onPress: pickFromCamera },
      { text: 'キャンセル', style: 'cancel' },
    ]);
  };

  const pickFromLibrary = async () => {
    const { status } =
      await ExpoImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'アクセス許可が必要です',
        '写真へのアクセスを許可してください。',
      );
      return;
    }
    const result = await ExpoImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      onChange([...images, result.assets[0].uri]);
    }
  };

  const pickFromCamera = async () => {
    const { status } = await ExpoImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'アクセス許可が必要です',
        'カメラへのアクセスを許可してください。',
      );
      return;
    }
    const result = await ExpoImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      onChange([...images, result.assets[0].uri]);
    }
  };

  const handleRemove = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  return (
    <View style={styles.grid}>
      {images.map((uri, index) => (
        <Pressable
          key={uri}
          style={styles.imageWrapper}
          onPress={() => handleRemove(index)}
        >
          <Image source={{ uri }} style={styles.image} />
          <View style={styles.removeOverlay}>
            <Text style={styles.removeIcon}>✕</Text>
          </View>
        </Pressable>
      ))}

      {canAdd && (
        <Pressable style={styles.addBtn} onPress={handleAdd}>
          <Text style={styles.addIcon}>＋</Text>
          <Text style={styles.addLabel}>追加</Text>
        </Pressable>
      )}
    </View>
  );
}

const CELL_SIZE = 80;

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  imageWrapper: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: 10,
    overflow: 'hidden',
  },
  image: {
    width: CELL_SIZE,
    height: CELL_SIZE,
  },
  removeOverlay: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeIcon: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 12,
  },
  addBtn: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER,
    borderStyle: 'dashed',
    backgroundColor: CARD,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  addIcon: {
    fontSize: 20,
    color: ACCENT,
  },
  addLabel: {
    fontSize: 11,
    color: SUB,
  },
});
