/**
 * hooks/useInfiniteEntries.ts のユニットテスト
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useInfiniteEntries } from './useInfiniteEntries';
import { fetchEntries } from '../services/entries';
import type { Entry } from '../types/entry';

// services/entries をモック
jest.mock('../services/entries', () => ({
  fetchEntries: jest.fn(),
}));

const mockFetchEntries = fetchEntries as jest.MockedFunction<typeof fetchEntries>;

function makeEntry(id: string, date: Date = new Date()): Entry {
  return {
    id,
    icon: '☀️',
    title: `タイトル ${id}`,
    body: `本文 ${id}`,
    date,
    images: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

const mockLastDoc = { id: 'last-doc' } as never;

describe('useInfiniteEntries', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('初回マウント時に fetchEntries を呼んでエントリを取得する', async () => {
    const entries = [makeEntry('1'), makeEntry('2')];
    mockFetchEntries.mockResolvedValueOnce({ entries, lastDoc: mockLastDoc });

    const { result } = renderHook(() => useInfiniteEntries());

    // 初期状態は isLoading: true
    expect(result.current.isLoading).toBe(true);
    expect(result.current.entries).toHaveLength(0);

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.entries).toHaveLength(2);
    expect(result.current.entries[0].id).toBe('1');
    expect(mockFetchEntries).toHaveBeenCalledTimes(1);
    // cursor なしで呼ばれる
    expect(mockFetchEntries).toHaveBeenCalledWith(/* no args */);
  });

  it('20件未満のとき hasMore は false になる', async () => {
    const entries = [makeEntry('1')];
    mockFetchEntries.mockResolvedValueOnce({ entries, lastDoc: mockLastDoc });

    const { result } = renderHook(() => useInfiniteEntries());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.hasMore).toBe(false);
  });

  it('lastDoc が null のとき hasMore は false になる', async () => {
    const entries = Array.from({ length: 20 }, (_, i) => makeEntry(String(i)));
    mockFetchEntries.mockResolvedValueOnce({ entries, lastDoc: null });

    const { result } = renderHook(() => useInfiniteEntries());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.hasMore).toBe(false);
  });

  it('loadMore() で次のページを追加取得する', async () => {
    const firstPage = Array.from({ length: 20 }, (_, i) => makeEntry(String(i)));
    const secondPage = [makeEntry('20'), makeEntry('21')];

    mockFetchEntries
      .mockResolvedValueOnce({ entries: firstPage, lastDoc: mockLastDoc })
      .mockResolvedValueOnce({ entries: secondPage, lastDoc: null });

    const { result } = renderHook(() => useInfiniteEntries());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.entries).toHaveLength(20);
    expect(result.current.hasMore).toBe(true);

    await act(async () => {
      await result.current.loadMore();
    });

    expect(result.current.entries).toHaveLength(22);
    expect(result.current.hasMore).toBe(false);
    // 2回目は cursor 付きで呼ばれる
    expect(mockFetchEntries).toHaveBeenCalledWith(mockLastDoc);
  });

  it('hasMore が false のとき loadMore() は fetchEntries を呼ばない', async () => {
    const entries = [makeEntry('1')]; // 20件未満 → hasMore: false
    mockFetchEntries.mockResolvedValueOnce({ entries, lastDoc: mockLastDoc });

    const { result } = renderHook(() => useInfiniteEntries());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.hasMore).toBe(false);

    await act(async () => {
      await result.current.loadMore();
    });

    // 初回の1回だけ呼ばれる
    expect(mockFetchEntries).toHaveBeenCalledTimes(1);
  });

  it('reload() でリストをリセットして再取得する', async () => {
    const entries = [makeEntry('1')];
    mockFetchEntries.mockResolvedValue({ entries, lastDoc: null });

    const { result } = renderHook(() => useInfiniteEntries());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mockFetchEntries).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.reload();
    });

    await waitFor(() => expect(mockFetchEntries).toHaveBeenCalledTimes(2));
  });
});
