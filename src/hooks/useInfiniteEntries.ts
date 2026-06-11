import { useState, useEffect, useCallback } from 'react';
import type { QueryDocumentSnapshot } from 'firebase/firestore';

import { fetchEntries } from '../services/entries';
import type { Entry } from '../types/entry';

type UseInfiniteEntriesResult = {
  entries: Entry[];
  loadMore: () => Promise<void>;
  isLoading: boolean;
  hasMore: boolean;
  reload: () => void;
};

/**
 * 無限スクロール用フック。
 * - 初回マウント時に最初の 20 件を取得
 * - loadMore() 呼び出し時に次の 20 件を追加取得（startAfter カーソル）
 */
export function useInfiniteEntries(): UseInfiniteEntriesResult {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [cursor, setCursor] = useState<QueryDocumentSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  // 初回ロード（または reload() が呼ばれたとき）
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      setIsLoading(true);
      setEntries([]);
      setCursor(null);
      setHasMore(true);
      try {
        const { entries: fetched, lastDoc } = await fetchEntries();
        if (!cancelled) {
          setEntries(fetched);
          setCursor(lastDoc);
          setHasMore(lastDoc !== null && fetched.length >= 20);
        }
      } catch (err) {
        console.error('[useInfiniteEntries] fetch error:', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void init();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore || cursor === null) return;

    setIsLoading(true);
    try {
      const { entries: next, lastDoc } = await fetchEntries(cursor);
      setEntries((prev) => [...prev, ...next]);
      setCursor(lastDoc);
      setHasMore(lastDoc !== null && next.length >= 20);
    } catch (err) {
      console.error('[useInfiniteEntries] loadMore error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [cursor, hasMore, isLoading]);

  const reload = useCallback(() => {
    setReloadKey((k) => k + 1);
  }, []);

  return { entries, loadMore, isLoading, hasMore, reload };
}
