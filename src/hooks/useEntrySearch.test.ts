/**
 * hooks/useEntrySearch.ts のユニットテスト
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useEntrySearch } from './useEntrySearch';
import { searchEntriesByDateRange } from '../services/entries';
import type { Entry } from '../types/entry';

// services/entries をモック
jest.mock('../services/entries', () => ({
  searchEntriesByDateRange: jest.fn(),
}));

const mockSearchByDateRange = searchEntriesByDateRange as jest.MockedFunction<
  typeof searchEntriesByDateRange
>;

function makeEntry(id: string, title: string, body: string, date: Date = new Date()): Entry {
  return {
    id,
    icon: '☀️',
    title,
    body,
    date,
    images: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

const allEntries: Entry[] = [
  makeEntry('1', '今日の出来事', '公園でピクニックをした', new Date('2026-06-01')),
  makeEntry('2', '読書記録', '面白い小説を読んだ', new Date('2026-06-05')),
  makeEntry('3', 'カフェ探訪', 'コーヒーが美味しかった', new Date('2026-06-10')),
];

describe('useEntrySearch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('初期状態では isSearching は false', () => {
    const { result } = renderHook(() => useEntrySearch(allEntries));

    expect(result.current.isSearching).toBe(false);
    expect(result.current.searchResults).toHaveLength(0);
    expect(result.current.query).toBe('');
    expect(result.current.dateRange).toBeNull();
  });

  it('query を設定するとタイトル・本文の部分一致フィルタが動作する', async () => {
    const { result } = renderHook(() => useEntrySearch(allEntries));

    act(() => {
      result.current.setQuery('カフェ');
    });

    await waitFor(() => expect(result.current.isSearching).toBe(true));

    expect(result.current.searchResults).toHaveLength(1);
    expect(result.current.searchResults[0].id).toBe('3');
  });

  it('本文での部分一致も検索できる', async () => {
    const { result } = renderHook(() => useEntrySearch(allEntries));

    act(() => {
      result.current.setQuery('ピクニック');
    });

    await waitFor(() => {
      expect(result.current.searchResults).toHaveLength(1);
    });
    expect(result.current.searchResults[0].id).toBe('1');
  });

  it('大文字小文字を区別しない検索ができる', async () => {
    const entries = [
      makeEntry('x', 'Coffee Time', 'Good coffee'),
    ];
    const { result } = renderHook(() => useEntrySearch(entries));

    act(() => {
      result.current.setQuery('coffee');
    });

    await waitFor(() => {
      expect(result.current.searchResults).toHaveLength(1);
    });
  });

  it('dateRange を設定すると searchEntriesByDateRange が呼ばれる', async () => {
    const dateResults = [allEntries[1], allEntries[2]];
    mockSearchByDateRange.mockResolvedValueOnce(dateResults);

    const { result } = renderHook(() => useEntrySearch(allEntries));

    act(() => {
      result.current.setDateRange({
        start: new Date('2026-06-04'),
        end: new Date('2026-06-11'),
      });
    });

    await waitFor(() => expect(result.current.isSearchLoading).toBe(false));

    expect(mockSearchByDateRange).toHaveBeenCalledTimes(1);
    expect(result.current.searchResults).toHaveLength(2);
    expect(result.current.isSearching).toBe(true);
  });

  it('dateRange と query を組み合わせると日付範囲結果をさらにテキストフィルタする', async () => {
    const dateResults = [allEntries[1], allEntries[2]];
    mockSearchByDateRange.mockResolvedValueOnce(dateResults);

    const { result } = renderHook(() => useEntrySearch(allEntries));

    act(() => {
      result.current.setDateRange({
        start: new Date('2026-06-04'),
        end: new Date('2026-06-11'),
      });
      result.current.setQuery('コーヒー');
    });

    await waitFor(() => expect(result.current.isSearchLoading).toBe(false));

    // dateResults のうち「コーヒー」を含む allEntries[2] だけが残る
    expect(result.current.searchResults).toHaveLength(1);
    expect(result.current.searchResults[0].id).toBe('3');
  });

  it('clearSearch で検索条件がリセットされる', async () => {
    const { result } = renderHook(() => useEntrySearch(allEntries));

    act(() => {
      result.current.setQuery('テスト');
    });
    await waitFor(() => expect(result.current.isSearching).toBe(true));

    act(() => {
      result.current.clearSearch();
    });

    expect(result.current.query).toBe('');
    expect(result.current.dateRange).toBeNull();
    expect(result.current.isSearching).toBe(false);
    expect(result.current.searchResults).toHaveLength(0);
  });

  it('allEntries に一致するものがなければ searchResults は空', async () => {
    const { result } = renderHook(() => useEntrySearch(allEntries));

    act(() => {
      result.current.setQuery('zzz存在しないキーワード');
    });

    await waitFor(() => expect(result.current.isSearching).toBe(true));

    expect(result.current.searchResults).toHaveLength(0);
  });
});
