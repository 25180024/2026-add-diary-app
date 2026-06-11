import { useState, useEffect } from 'react';

import { searchEntriesByDateRange } from '../services/entries';
import type { Entry } from '../types/entry';

type DateRange = {
  start: Date;
  end: Date;
};

type UseEntrySearchResult = {
  /** 検索クエリ文字列 */
  query: string;
  setQuery: (q: string) => void;
  /** 日付範囲 */
  dateRange: DateRange | null;
  setDateRange: (range: DateRange | null) => void;
  /** 検索結果エントリ（検索モード時のみ有効） */
  searchResults: Entry[];
  /** 検索モード中かどうか */
  isSearching: boolean;
  /** 検索実行中（日付範囲クエリ中）かどうか */
  isSearchLoading: boolean;
  /** 検索条件をすべてクリア */
  clearSearch: () => void;
};

/**
 * 検索フック。
 * - query が空かつ dateRange 未設定なら isSearching = false（通常モード）
 * - query が入力されたらクライアントサイドでタイトル・本文の部分一致フィルタ
 * - dateRange が指定されたら searchEntriesByDateRange を呼んでフィルタ
 *
 * @param allEntries 通常モード時の全エントリ（useInfiniteEntries から渡す）
 */
export function useEntrySearch(allEntries: Entry[]): UseEntrySearchResult {
  const [query, setQuery] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | null>(null);
  const [searchResults, setSearchResults] = useState<Entry[]>([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);

  const isSearching = query.trim().length > 0 || dateRange !== null;

  useEffect(() => {
    if (!isSearching) {
      setSearchResults([]);
      return;
    }

    // 日付範囲検索（Firestore クエリ）
    if (dateRange !== null) {
      let cancelled = false;
      setIsSearchLoading(true);

      searchEntriesByDateRange(dateRange.start, dateRange.end)
        .then((results) => {
          if (cancelled) return;
          // クエリ文字列が追加で指定されていればクライアント側フィルタも適用
          const q = query.trim().toLowerCase();
          const filtered =
            q.length > 0
              ? results.filter(
                  (e) =>
                    e.title.toLowerCase().includes(q) ||
                    e.body.toLowerCase().includes(q),
                )
              : results;
          setSearchResults(filtered);
        })
        .catch((err) => {
          console.error('[useEntrySearch] dateRange search error:', err);
        })
        .finally(() => {
          if (!cancelled) setIsSearchLoading(false);
        });

      return () => {
        cancelled = true;
      };
    }

    // テキスト検索のみ（クライアントサイドフィルタ）
    const q = query.trim().toLowerCase();
    const filtered = allEntries.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.body.toLowerCase().includes(q),
    );
    setSearchResults(filtered);
  }, [query, dateRange, allEntries, isSearching]);

  const clearSearch = () => {
    setQuery('');
    setDateRange(null);
    setSearchResults([]);
  };

  return {
    query,
    setQuery,
    dateRange,
    setDateRange,
    searchResults,
    isSearching,
    isSearchLoading,
    clearSearch,
  };
}
