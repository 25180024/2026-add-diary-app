/**
 * entries ストア
 *
 * Firestore 連携版。addEntry / updateEntry / deleteEntry は
 * services/entries.ts を経由して Firestore を操作する。
 * UI 向けの状態（ローカルキャッシュ）は useInfiniteEntries / useEntrySearch
 * フックが担うため、このコンテキストはシンプルに保つ。
 */
import {
  createContext,
  useContext,
  type ReactNode,
} from 'react';

import {
  createEntry as svcCreate,
  updateEntry as svcUpdate,
  deleteEntry as svcDelete,
} from '../services/entries';
import type { Entry, EntryInput } from '../types/entry';

type EntriesContextValue = {
  /** エントリ追加（Firestore に保存し、作成済み Entry を返す） */
  addEntry: (input: EntryInput) => Promise<Entry>;
  /** エントリ更新（Firestore を更新する） */
  updateEntry: (id: string, input: Partial<EntryInput>) => Promise<void>;
  /** エントリ削除（Firestore から削除する） */
  deleteEntry: (id: string) => Promise<void>;
};

const EntriesContext = createContext<EntriesContextValue | null>(null);

export function EntriesProvider({ children }: { children: ReactNode }) {
  const value: EntriesContextValue = {
    addEntry: (input) => svcCreate(input),
    updateEntry: (id, input) => svcUpdate(id, input),
    deleteEntry: (id) => svcDelete(id),
  };

  return (
    <EntriesContext.Provider value={value}>{children}</EntriesContext.Provider>
  );
}

export function useEntries() {
  const ctx = useContext(EntriesContext);
  if (!ctx) {
    throw new Error('useEntries must be used inside <EntriesProvider>');
  }
  return ctx;
}

// Entry 型を再エクスポートして後方互換を維持
export type { Entry };
