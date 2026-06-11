/**
 * entries ストアのユニットテスト
 *
 * services/entries.ts を jest でモックして、
 * EntriesProvider / useEntries の動作を検証する。
 */
import { act, renderHook } from '@testing-library/react-native';
import {
  createEntry as mockCreate,
  updateEntry as mockUpdate,
  deleteEntry as mockDelete,
} from '../services/entries';
import { EntriesProvider, useEntries } from './entries';
import type { Entry } from '../types/entry';

// services/entries をモック
jest.mock('../services/entries', () => ({
  createEntry: jest.fn(),
  updateEntry: jest.fn(),
  deleteEntry: jest.fn(),
}));

const mockCreateEntry = mockCreate as jest.MockedFunction<typeof mockCreate>;
const mockUpdateEntry = mockUpdate as jest.MockedFunction<typeof mockUpdate>;
const mockDeleteEntry = mockDelete as jest.MockedFunction<typeof mockDelete>;

function wrap({ children }: { children: React.ReactNode }) {
  return <EntriesProvider>{children}</EntriesProvider>;
}

const dummyEntry: Entry = {
  id: 'test-1',
  icon: '🧪',
  title: 'テストエントリ',
  body: 'jest からの追加',
  date: new Date(2026, 0, 1),
  images: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('useEntries', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('addEntry は createEntry サービスを呼ぶ', async () => {
    mockCreateEntry.mockResolvedValueOnce(dummyEntry);
    const { result } = renderHook(() => useEntries(), { wrapper: wrap });

    let returned: Entry | undefined;
    await act(async () => {
      returned = await result.current.addEntry({
        icon: '🧪',
        title: 'テストエントリ',
        body: 'jest からの追加',
        date: new Date(),
        images: [],
      });
    });

    expect(mockCreateEntry).toHaveBeenCalledTimes(1);
    expect(returned).toEqual(dummyEntry);
  });

  it('updateEntry は updateEntry サービスを呼ぶ', async () => {
    mockUpdateEntry.mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useEntries(), { wrapper: wrap });

    await act(async () => {
      await result.current.updateEntry('test-1', { title: '更新後タイトル' });
    });

    expect(mockUpdateEntry).toHaveBeenCalledWith('test-1', {
      title: '更新後タイトル',
    });
  });

  it('deleteEntry は deleteEntry サービスを呼ぶ', async () => {
    mockDeleteEntry.mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useEntries(), { wrapper: wrap });

    await act(async () => {
      await result.current.deleteEntry('test-1');
    });

    expect(mockDeleteEntry).toHaveBeenCalledWith('test-1');
  });

  it('throws when used outside the provider', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useEntries())).toThrow(
      /useEntries must be used inside/,
    );
    spy.mockRestore();
  });
});
