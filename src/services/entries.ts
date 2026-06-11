import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  startAfter,
  where,
  serverTimestamp,
  Timestamp,
  type DocumentSnapshot,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';

import { db } from './firebase';
import type { Entry, EntryInput } from '../types/entry';

const COLLECTION = 'entries';
const PAGE_SIZE = 20;

// Firestore ドキュメント → Entry 型に変換
function toEntry(docSnap: DocumentSnapshot | QueryDocumentSnapshot): Entry {
  const data = docSnap.data();
  if (!data) throw new Error(`Entry not found: ${docSnap.id}`);

  return {
    id: docSnap.id,
    icon: data.icon as string,
    title: data.title as string,
    body: data.body as string,
    date: (data.date as Timestamp).toDate(),
    images: (data.images as string[]) ?? [],
    createdAt: (data.createdAt as Timestamp).toDate(),
    updatedAt: (data.updatedAt as Timestamp).toDate(),
  };
}

/**
 * ページネーション付きで日記一覧を取得（日付降順）
 * @param cursor - 前ページ最後のドキュメントスナップショット（初回は undefined）
 */
export async function fetchEntries(
  cursor?: QueryDocumentSnapshot,
): Promise<{ entries: Entry[]; lastDoc: QueryDocumentSnapshot | null }> {
  const col = collection(db, COLLECTION);
  const constraints = cursor
    ? [orderBy('date', 'desc'), startAfter(cursor), limit(PAGE_SIZE)]
    : [orderBy('date', 'desc'), limit(PAGE_SIZE)];

  const q = query(col, ...constraints);
  const snapshot = await getDocs(q);

  const entries = snapshot.docs.map(toEntry);
  const lastDoc =
    snapshot.docs.length > 0
      ? snapshot.docs[snapshot.docs.length - 1]
      : null;

  return { entries, lastDoc };
}

/**
 * ID で日記1件を取得
 */
export async function fetchEntryById(id: string): Promise<Entry> {
  const ref = doc(db, COLLECTION, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error(`Entry not found: ${id}`);
  return toEntry(snap);
}

/**
 * 日記を新規作成
 */
export async function createEntry(input: EntryInput): Promise<Entry> {
  const col = collection(db, COLLECTION);
  const docRef = await addDoc(col, {
    icon: input.icon,
    title: input.title,
    body: input.body,
    date: Timestamp.fromDate(input.date),
    images: input.images,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // サーバータイムスタンプは即時反映されないため、作成日時はローカル値で補完
  const now = new Date();
  return {
    id: docRef.id,
    ...input,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * 日記を更新
 */
export async function updateEntry(
  id: string,
  input: Partial<EntryInput>,
): Promise<void> {
  const ref = doc(db, COLLECTION, id);
  await updateDoc(ref, {
    ...(input.icon !== undefined && { icon: input.icon }),
    ...(input.title !== undefined && { title: input.title }),
    ...(input.body !== undefined && { body: input.body }),
    ...(input.date !== undefined && { date: Timestamp.fromDate(input.date) }),
    ...(input.images !== undefined && { images: input.images }),
    updatedAt: serverTimestamp(),
  });
}

/**
 * 日記を削除
 */
export async function deleteEntry(id: string): Promise<void> {
  const ref = doc(db, COLLECTION, id);
  await deleteDoc(ref);
}

/**
 * 日付範囲で日記を検索
 */
export async function searchEntriesByDateRange(
  start: Date,
  end: Date,
): Promise<Entry[]> {
  const col = collection(db, COLLECTION);
  const q = query(
    col,
    where('date', '>=', Timestamp.fromDate(start)),
    where('date', '<=', Timestamp.fromDate(end)),
    orderBy('date', 'desc'),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(toEntry);
}
