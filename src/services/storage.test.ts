/**
 * services/storage.ts のユニットテスト
 *
 * Firebase Storage をモックして uploadImage / deleteImage の動作を検証する。
 */

import { uploadImage, deleteImage } from './storage';

// firebase.ts をモック
jest.mock('./firebase', () => ({
  db: {},
  storage: {},
  auth: {},
}));

const mockRef = jest.fn();
const mockUploadBytes = jest.fn();
const mockGetDownloadURL = jest.fn();
const mockDeleteObject = jest.fn();

jest.mock('firebase/storage', () => ({
  ref: (...args: unknown[]) => mockRef(...args),
  uploadBytes: (...args: unknown[]) => mockUploadBytes(...args),
  getDownloadURL: (...args: unknown[]) => mockGetDownloadURL(...args),
  deleteObject: (...args: unknown[]) => mockDeleteObject(...args),
}));

// fetch をモック（ローカル URI からの blob 取得）
const mockBlob = (size: number) => ({ size });
const mockFetch = jest.fn();

global.fetch = mockFetch as typeof global.fetch;

describe('uploadImage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRef.mockReturnValue('mock-storage-ref');
    mockUploadBytes.mockResolvedValue(undefined);
    mockGetDownloadURL.mockResolvedValue('https://storage.example.com/image.jpg');
  });

  it('画像をアップロードして公開 URL を返す', async () => {
    mockFetch.mockResolvedValueOnce({
      blob: async () => mockBlob(1024 * 1024), // 1MB
    });

    const url = await uploadImage('entry-1', 'file://local/photo.jpg');

    expect(mockUploadBytes).toHaveBeenCalledTimes(1);
    expect(mockGetDownloadURL).toHaveBeenCalledTimes(1);
    expect(url).toBe('https://storage.example.com/image.jpg');
  });

  it('10MB を超えるファイルはエラーをスローする', async () => {
    const overSizeBytes = 10 * 1024 * 1024 + 1; // 10MB + 1byte
    mockFetch.mockResolvedValueOnce({
      blob: async () => mockBlob(overSizeBytes),
    });

    await expect(uploadImage('entry-1', 'file://large.jpg')).rejects.toThrow(
      'ファイルサイズが上限（10MB）を超えています',
    );
    expect(mockUploadBytes).not.toHaveBeenCalled();
  });

  it('ちょうど 10MB のファイルはアップロードできる', async () => {
    const exactSizeBytes = 10 * 1024 * 1024; // exactly 10MB
    mockFetch.mockResolvedValueOnce({
      blob: async () => mockBlob(exactSizeBytes),
    });
    mockGetDownloadURL.mockResolvedValue('https://storage.example.com/ok.jpg');

    const url = await uploadImage('entry-2', 'file://exactly10mb.jpg');

    expect(mockUploadBytes).toHaveBeenCalledTimes(1);
    expect(url).toBe('https://storage.example.com/ok.jpg');
  });

  it('正しいパス entries/{entryId}/{filename} に ref を作る', async () => {
    mockFetch.mockResolvedValueOnce({
      blob: async () => mockBlob(100),
    });
    mockGetDownloadURL.mockResolvedValue('https://storage.example.com/x.jpg');

    await uploadImage('my-entry-123', 'file://photo.jpg');

    expect(mockRef).toHaveBeenCalledTimes(1);
    const refPath: string = mockRef.mock.calls[0][1] as string;
    expect(refPath).toMatch(/^entries\/my-entry-123\//);
  });
});

describe('deleteImage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRef.mockReturnValue('mock-storage-ref');
    mockDeleteObject.mockResolvedValue(undefined);
  });

  it('Storage URL に対応するファイルを削除する', async () => {
    const url = 'https://storage.googleapis.com/bucket/entries/entry-1/photo.jpg';
    await deleteImage(url);

    expect(mockRef).toHaveBeenCalledWith({}, url);
    expect(mockDeleteObject).toHaveBeenCalledWith('mock-storage-ref');
  });
});
