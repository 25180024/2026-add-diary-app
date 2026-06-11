/**
 * services/entries.ts のユニットテスト
 *
 * Firebase Firestore をモックして、各 CRUD 関数の動作を検証する。
 */

import {
  fetchEntries,
  fetchEntryById,
  createEntry,
  updateEntry,
  deleteEntry,
  searchEntriesByDateRange,
} from './entries';

// firebase.ts をモック
jest.mock('./firebase', () => ({
  db: {},
  storage: {},
  auth: {},
}));

// Firestore SDK 全体をモック（jest.mock は巻き上げられるので内部で jest.fn() を定義）
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(() => 'mock-collection'),
  doc: jest.fn(() => 'mock-doc-ref'),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  query: jest.fn((...args: unknown[]) => args),
  orderBy: jest.fn(() => 'orderBy'),
  limit: jest.fn(() => 'limit'),
  startAfter: jest.fn(() => 'startAfter'),
  where: jest.fn(() => 'where'),
  serverTimestamp: jest.fn(() => ({ _serverTimestamp: true })),
  Timestamp: {
    fromDate: (d: Date) => ({ toDate: () => d }),
  },
}));

// モック関数をインポートして制御
// eslint-disable-next-line import/first
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  startAfter,
  where,
  serverTimestamp,
} from 'firebase/firestore';

const mockCollection = collection as jest.MockedFunction<typeof collection>;
const mockDoc = doc as jest.MockedFunction<typeof doc>;
const mockGetDoc = getDoc as jest.MockedFunction<typeof getDoc>;
const mockGetDocs = getDocs as jest.MockedFunction<typeof getDocs>;
const mockAddDoc = addDoc as jest.MockedFunction<typeof addDoc>;
const mockUpdateDoc = updateDoc as jest.MockedFunction<typeof updateDoc>;
const mockDeleteDoc = deleteDoc as jest.MockedFunction<typeof deleteDoc>;
const mockStartAfter = startAfter as jest.MockedFunction<typeof startAfter>;
const mockWhere = where as jest.MockedFunction<typeof where>;
const mockServerTimestamp = serverTimestamp as jest.MockedFunction<typeof serverTimestamp>;

const mockTimestamp = {
  toDate: () => new Date('2026-01-01T00:00:00Z'),
};

const mockDocData = {
  icon: '☀️',
  title: 'テストタイトル',
  body: 'テスト本文',
  date: mockTimestamp,
  images: [],
  createdAt: mockTimestamp,
  updatedAt: mockTimestamp,
};

const mockDocSnap = {
  id: 'entry-1',
  exists: () => true,
  data: () => mockDocData,
};

const mockQueryDocSnap = { ...mockDocSnap };
const mockAddDocRef = { id: 'new-entry-id' };

describe('fetchEntries', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCollection.mockReturnValue('mock-collection' as never);
  });

  it('日記一覧を取得して Entry 配列を返す', async () => {
    mockGetDocs.mockResolvedValueOnce({ docs: [mockQueryDocSnap] } as never);

    const result = await fetchEntries();

    expect(mockGetDocs).toHaveBeenCalledTimes(1);
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0].id).toBe('entry-1');
    expect(result.entries[0].icon).toBe('☀️');
    expect(result.lastDoc).toBe(mockQueryDocSnap);
  });

  it('ドキュメントが0件のとき lastDoc は null', async () => {
    mockGetDocs.mockResolvedValueOnce({ docs: [] } as never);

    const result = await fetchEntries();

    expect(result.entries).toHaveLength(0);
    expect(result.lastDoc).toBeNull();
  });

  it('cursor を渡すと startAfter が使われる', async () => {
    mockGetDocs.mockResolvedValueOnce({ docs: [] } as never);

    await fetchEntries(mockQueryDocSnap as never);

    expect(mockStartAfter).toHaveBeenCalledWith(mockQueryDocSnap);
  });
});

describe('fetchEntryById', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDoc.mockReturnValue('mock-doc-ref' as never);
  });

  it('指定した ID の Entry を返す', async () => {
    mockGetDoc.mockResolvedValueOnce(mockDocSnap as never);

    const entry = await fetchEntryById('entry-1');

    expect(mockDoc).toHaveBeenCalledWith({}, 'entries', 'entry-1');
    expect(entry.id).toBe('entry-1');
    expect(entry.title).toBe('テストタイトル');
  });

  it('ドキュメントが存在しない場合エラーをスローする', async () => {
    mockGetDoc.mockResolvedValueOnce({
      exists: () => false,
      id: 'missing',
      data: () => undefined,
    } as never);

    await expect(fetchEntryById('missing')).rejects.toThrow('Entry not found: missing');
  });
});

describe('createEntry', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCollection.mockReturnValue('mock-collection' as never);
  });

  it('Firestore にドキュメントを追加して Entry を返す', async () => {
    mockAddDoc.mockResolvedValueOnce(mockAddDocRef as never);

    const input = {
      icon: '☁️',
      title: '新しい日記',
      body: '本文です',
      date: new Date('2026-06-01'),
      images: [],
    };

    const entry = await createEntry(input);

    expect(mockAddDoc).toHaveBeenCalledTimes(1);
    expect(entry.id).toBe('new-entry-id');
    expect(entry.icon).toBe('☁️');
    expect(entry.title).toBe('新しい日記');
  });
});

describe('updateEntry', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDoc.mockReturnValue('mock-doc-ref' as never);
    mockServerTimestamp.mockReturnValue({ _serverTimestamp: true } as never);
  });

  it('指定フィールドを Firestore で更新する', async () => {
    mockUpdateDoc.mockResolvedValueOnce(undefined);

    await updateEntry('entry-1', { title: '更新後タイトル' });

    expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
    const callArgs = mockUpdateDoc.mock.calls[0][1] as unknown as Record<string, unknown>;
    expect(callArgs.title).toBe('更新後タイトル');
    expect(callArgs.updatedAt).toEqual({ _serverTimestamp: true });
  });
});

describe('deleteEntry', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDoc.mockReturnValue('mock-doc-ref' as never);
  });

  it('指定 ID のドキュメントを削除する', async () => {
    mockDeleteDoc.mockResolvedValueOnce(undefined);

    await deleteEntry('entry-1');

    expect(mockDoc).toHaveBeenCalledWith({}, 'entries', 'entry-1');
    expect(mockDeleteDoc).toHaveBeenCalledTimes(1);
  });
});

describe('searchEntriesByDateRange', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCollection.mockReturnValue('mock-collection' as never);
  });

  it('日付範囲で絞り込んだ Entry 配列を返す', async () => {
    mockGetDocs.mockResolvedValueOnce({ docs: [mockQueryDocSnap] } as never);

    const start = new Date('2026-01-01');
    const end = new Date('2026-01-31');
    const entries = await searchEntriesByDateRange(start, end);

    expect(mockWhere).toHaveBeenCalledTimes(2);
    expect(entries).toHaveLength(1);
    expect(entries[0].id).toBe('entry-1');
  });
});
