/**
 * Entry 型定義
 *
 * - `id` はオプション（新規作成時は未設定、Firestoreから取得後はあり）
 * - `date`, `createdAt`, `updatedAt` は Date 型（Timestamp への変換は services/ 層で担う）
 */
export type Entry = {
  id?: string;
  icon: string;
  title: string;
  body: string;
  date: Date;
  images: string[];
  createdAt: Date;
  updatedAt: Date;
};

/**
 * 新規作成・更新時の入力型（id / createdAt / updatedAt は呼び出し元が指定しない）
 */
export type EntryInput = {
  icon: string;
  title: string;
  body: string;
  date: Date;
  images: string[];
};
