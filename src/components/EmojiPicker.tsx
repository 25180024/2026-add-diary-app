import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ACCENT, BORDER, CARD } from '../constants/colors';

export const PRESET_EMOJIS = ['☀️', '☁️', '🌧', '☕️', '🍜', '📚', '✨', '💭'];

type Props = {
  selected: string;
  onSelect: (emoji: string) => void;
};

/**
 * プリセット絵文字ピッカー。
 * 選択中の絵文字をハイライトで表示する。
 */
export function EmojiPicker({ selected, onSelect }: Props) {
  return (
    <View style={styles.row}>
      {PRESET_EMOJIS.map((emoji) => {
        const active = emoji === selected;
        return (
          <Pressable
            key={emoji}
            onPress={() => onSelect(emoji)}
            style={[styles.chip, active && styles.chipActive]}
          >
            <Text style={styles.emoji}>{emoji}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
  },
  chipActive: {
    borderColor: ACCENT,
    backgroundColor: '#FBEFE3',
  },
  emoji: {
    fontSize: 22,
  },
});
