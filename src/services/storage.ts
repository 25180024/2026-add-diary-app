import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';

import { storage } from './firebase';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

/**
 * ローカル URI の画像を Firebase Storage にアップロードし、公開 URL を返す
 * @param entryId - 日記 ID（パス: entries/{entryId}/{filename}）
 * @param uri - ローカル画像 URI
 */
export async function uploadImage(entryId: string, uri: string): Promise<string> {
  const response = await fetch(uri);
  const blob = await response.blob();

  if (blob.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(
      `ファイルサイズが上限（10MB）を超えています: ${(blob.size / 1024 / 1024).toFixed(1)}MB`,
    );
  }

  const filename = `${Date.now()}.jpg`;
  const storageRef = ref(storage, `entries/${entryId}/${filename}`);

  await uploadBytes(storageRef, blob);
  return getDownloadURL(storageRef);
}

/**
 * Storage URL に対応するファイルを削除する
 * @param url - Firebase Storage の公開 URL
 */
export async function deleteImage(url: string): Promise<void> {
  const storageRef = ref(storage, url);
  await deleteObject(storageRef);
}
