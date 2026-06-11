import { useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { useInfiniteEntries } from '../hooks/useInfiniteEntries';
import { useEntrySearch } from '../hooks/useEntrySearch';
import { SearchBar } from '../components/SearchBar';
import { EntryCard } from '../components/EntryCard';
import { PAPER, INK, SUB, ACCENT } from '../constants/colors';
import type { Entry } from '../types/entry';

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

function formatHeader(date: Date) {
  return `${date.getFullYear()}年 ${date.getMonth() + 1}月`;
}

function formatDay(date: Date) {
  return {
    day: String(date.getDate()).padStart(2, '0'),
    weekday: WEEKDAYS[date.getDay()],
  };
}

export default function Index() {
  const today = useMemo(() => new Date(), []);
  const { day: todayDay, weekday: todayWeekday } = formatDay(today);

  const { entries, loadMore, isLoading, reload } = useInfiniteEntries();

  const {
    query,
    setQuery,
    dateRange,
    setDateRange,
    searchResults,
    isSearching,
    clearSearch,
  } = useEntrySearch(entries);

  const displayEntries: Entry[] = isSearching ? searchResults : entries;

  const openNew = () => router.push('/new');

  const handleEndReached = () => {
    if (!isSearching) void loadMore();
  };

  const renderFooter = () => {
    if (!isLoading) return null;
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator color={ACCENT} />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        data={displayEntries}
        keyExtractor={(item) => item.id ?? item.title}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.3}
        ListFooterComponent={renderFooter}
        ListHeaderComponent={
          <>
            {/* ヘッダー */}
            <View style={styles.header}>
              <Text style={styles.headerMonth}>{formatHeader(today)}</Text>
              <Text style={styles.headerTitle}>日記</Text>
            </View>

            {/* 今日のカード */}
            <Pressable style={styles.todayCard} onPress={openNew}>
              <View style={styles.todayDateColumn}>
                <Text style={styles.todayWeekday}>{todayWeekday}</Text>
                <Text style={styles.todayDay}>{todayDay}</Text>
              </View>
              <View style={styles.todayBody}>
                <Text style={styles.todayLabel}>今日の記録</Text>
                <Text style={styles.todayPrompt}>
                  タップして、今日のことを書きとめよう。
                </Text>
              </View>
              <Text style={styles.todayChevron}>＋</Text>
            </Pressable>

            {/* 検索バー */}
            <View style={styles.searchBarWrapper}>
              <SearchBar
                query={query}
                onQueryChange={setQuery}
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
                onClear={clearSearch}
              />
            </View>

            <Text style={styles.sectionLabel}>
              {isSearching
                ? `検索結果 ${displayEntries.length}件`
                : 'これまでの日記'}
            </Text>
          </>
        }
        renderItem={({ item }) => (
          <EntryCard
            entry={item}
            onPress={() => router.push(`/entries/${item.id}` as never)}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>
                {isSearching ? '該当する日記がありません' : 'まだ日記がありません'}
              </Text>
            </View>
          ) : null
        }
        // pull-to-refresh
        refreshing={isLoading && entries.length === 0}
        onRefresh={reload}
      />

      <Pressable style={styles.fab} onPress={openNew}>
        <Text style={styles.fabIcon}>✎</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: PAPER,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  header: {
    paddingTop: 8,
    paddingBottom: 20,
  },
  headerMonth: {
    fontSize: 13,
    color: SUB,
    letterSpacing: 2,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: INK,
    marginTop: 4,
    letterSpacing: 4,
  },
  todayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    gap: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    marginBottom: 16,
  },
  todayDateColumn: {
    alignItems: 'center',
    width: 44,
  },
  todayWeekday: {
    fontSize: 12,
    color: ACCENT,
    fontWeight: '600',
  },
  todayDay: {
    fontSize: 26,
    fontWeight: '700',
    color: INK,
    marginTop: 2,
  },
  todayBody: {
    flex: 1,
  },
  todayLabel: {
    fontSize: 12,
    color: SUB,
    letterSpacing: 1,
  },
  todayPrompt: {
    fontSize: 15,
    color: INK,
    marginTop: 4,
    lineHeight: 22,
  },
  todayChevron: {
    fontSize: 24,
    color: ACCENT,
    fontWeight: '300',
  },
  searchBarWrapper: {
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 12,
    color: SUB,
    letterSpacing: 2,
    marginTop: 12,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  separator: {
    height: 14,
  },
  loadingFooter: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  empty: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: SUB,
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 32,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  fabIcon: {
    color: '#FFFFFF',
    fontSize: 24,
    lineHeight: 26,
  },
});
