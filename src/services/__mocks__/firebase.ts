/**
 * Firebase モック
 *
 * Jest テスト時に本物の Firebase SDK の代わりに使用される。
 * services/entries.ts / services/storage.ts がインポートする
 * `db`, `storage`, `auth` を差し替える。
 */

export const db = {};
export const storage = {};
export const auth = {};

export default {};
