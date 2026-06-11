# 開発タスクリスト（実装計画）

仕様書 `docs/spec.md` をもとにした、開発工程全体のタスクリストです。
各フェーズを順番に進めることで、動作するアプリを段階的に完成させます。

---

## フェーズ 0 — 前提確認・環境整備

- [ ] `just check` でTypeScript・ESLintが通ることを確認する
- [ ] `just test` で既存テストがパスすることを確認する
- [ ] `.env` ファイルを作成し、Firebase設定値（APIキー等）を記載する（`.gitignore` に追加済みであることを確認）

---

## フェーズ 1 — 型定義・共通基盤

### 1-1. Entry型の再定義

- [ ] `src/types/entry.ts` を新規作成する
  - `icon`, `title`, `body`, `date`, `images`, `createdAt`, `updatedAt` を含む型を定義
  - `id` はオプション（新規作成時は未設定、Firestoreから取得後はあり）
  - `date`, `createdAt`, `updatedAt` は `Date` 型で扱う（Firestoreの `Timestamp` は `services/` 層で変換）

### 1-2. カラー定数の共通化

- [ ] `src/constants/colors.ts` を新規作成する
  - `PAPER`, `INK`, `SUB`, `ACCENT`, `CARD`, `BORDER` をまとめて export
  - `index.tsx` / `new.tsx` の重複定義を削除して `colors.ts` からインポートするよう修正

---

## フェーズ 2 — Firebase 連携基盤

### 2-1. パッケージ追加

- [ ] `firebase` パッケージを pnpm でインストールする
- [ ] `expo-image-picker` を pnpm でインストールする
- [ ] `@react-native-community/datetimepicker` を pnpm でインストールする

### 2-2. Firebase 初期化

- [ ] `src/services/firebase.ts` を作成する
  - `initializeApp`, `getFirestore`, `getStorage` を初期化
  - Firestoreオフラインキャッシュ（`persistentLocalCache`）を有効化
  - Firebase Auth インスタンスも初期化しておく（認証機能の将来対応）
  - `.env` の環境変数から設定値を読み込む

### 2-3. Firestore CRUD サービス

- [ ] `src/services/entries.ts` を作成する
  - `fetchEntries(limit, cursor?)` — ページネーション付きで取得（`orderBy date desc`, `startAfter`）
  - `fetchEntryById(id)` — 1件取得
  - `createEntry(input)` — 作成（`serverTimestamp()` で `createdAt`/`updatedAt` をセット）
  - `updateEntry(id, input)` — 更新（`updatedAt` を更新）
  - `deleteEntry(id)` — 削除
  - `searchEntriesByDateRange(start, end)` — 日付範囲クエリ
  - Firestoreの `Timestamp` ↔ `Date` 変換をこの層で吸収する

### 2-4. Firebase Storage サービス

- [ ] `src/services/storage.ts` を作成する
  - `uploadImage(entryId, uri)` — ローカルURIを受け取り、`entries/{entryId}/{filename}` にアップロードして公開URLを返す
  - `deleteImage(url)` — Storage URLを受け取り、対応ファイルを削除する
  - ファイルサイズの上限チェック（10MB）

---

## フェーズ 3 — 状態管理・カスタムフック

### 3-1. entries ストアの刷新

- [ ] `src/store/entries.tsx` を Firestore連携版に書き直す
  - `addEntry`, `updateEntry`, `deleteEntry` を `services/entries.ts` を呼ぶ実装に変更
  - ローカルの seed データを削除する

### 3-2. 無限スクロールフック

- [ ] `src/hooks/useInfiniteEntries.ts` を作成する
  - `entries`, `loadMore()`, `isLoading`, `hasMore` を返す
  - 初回マウント時に最初の20件を取得
  - `loadMore()` 呼び出し時に次の20件を追加取得（`startAfter` カーソル）
  - 検索中は無限スクロールを停止する

### 3-3. 検索フック

- [ ] `src/hooks/useEntrySearch.ts` を作成する
  - `query`（文字列）と `dateRange`（開始日・終了日）を状態として保持
  - `query` が空かつ `dateRange` 未設定なら検索モードをオフにして `useInfiniteEntries` の結果を返す
  - `query` が入力されたらクライアントサイドでタイトル・本文の部分一致フィルタリングを実施
  - `dateRange` が指定されたら `searchEntriesByDateRange` を呼んで結果を返す

---

## フェーズ 4 — UI コンポーネント

### 4-1. SearchBar

- [ ] `src/components/SearchBar.tsx` を作成する
  - テキスト入力欄（タイトル・本文の部分一致用）
  - 日付範囲選択ボタン（タップで DatePicker を表示）
  - クリアボタン

### 4-2. EmojiPicker

- [ ] `src/components/EmojiPicker.tsx` を作成する
  - プリセット絵文字（`☀️ ☁️ 🌧 ☕️ 🍜 📚 ✨ 💭` 等）をグリッド表示
  - 選択中の絵文字をハイライト
  - 現在 `new.tsx` に直書きされているモード選択UIをこのコンポーネントに移行する

### 4-3. ImagePickerGrid

- [ ] `src/components/ImagePickerGrid.tsx` を作成する
  - 選択済み画像をグリッドで表示（最大5枚）
  - 追加ボタン（カメラロール選択 / カメラ撮影の選択肢）
  - 5枚に達したら追加ボタンを非活性化
  - 各画像にタップで削除できるオーバーレイを表示

### 4-4. EntryCard

- [ ] `src/components/EntryCard.tsx` を作成する
  - 日付・曜日・絵文字アイコン・タイトル・本文抜粋を表示
  - 現在 `index.tsx` に直書きされているリストアイテムの JSX をこのコンポーネントに切り出す

---

## フェーズ 5 — 画面実装

### 5-1. 日記一覧画面（`src/app/index.tsx`）の改修

- [ ] `useInfiniteEntries` / `useEntrySearch` フックを組み込む
- [ ] `SearchBar` コンポーネントを画面上部に配置する
- [ ] `EntryCard` コンポーネントをリストに使用する
- [ ] `ScrollView` → `FlatList` に変更して無限スクロールを実装する（`onEndReached` で `loadMore()` を呼ぶ）
- [ ] 各カードをタップすると `/entries/[id]` に遷移する
- [ ] `_layout.tsx` に `entries/[id]` のスタック画面を追加する

### 5-2. 日記詳細画面（`src/app/entries/[id]/index.tsx`）の新規作成

- [ ] `src/app/entries/[id]/index.tsx` を作成する
- [ ] URL パラメータ `id` から `fetchEntryById` でデータを取得して表示する
- [ ] 表示項目: アイコン・タイトル・本文・日付・画像（横スクロール）
- [ ] ヘッダーに「編集」ボタンを配置し `/entries/[id]/edit` へ遷移
- [ ] 削除ボタンを配置し、確認ダイアログ（`Alert.alert`）表示後に削除して `/` へ戻る

### 5-3. 日記作成画面（`src/app/new.tsx`）の改修

- [ ] フィールドに `date`（日付ピッカー）・`images`（ImagePickerGrid）を追加する
- [ ] `EmojiPicker` コンポーネントを使うよう差し替える
- [ ] バリデーション: `icon`, `title`, `body`, `date` がすべて入力済みの場合のみ保存ボタンを有効化する
- [ ] 保存時に `services/entries.ts` の `createEntry` を呼び、画像がある場合は `services/storage.ts` の `uploadImage` も呼ぶ
- [ ] フィールド名を `mood` → `icon` にリネームして仕様書に合わせる

### 5-4. 日記編集画面（`src/app/entries/[id]/edit.tsx`）の新規作成

- [ ] `src/app/entries/[id]/edit.tsx` を作成する
- [ ] 既存エントリのデータを初期値として `fetchEntryById` でロードする
- [ ] 作成画面と同じフォームを流用（共通コンポーネントに切り出しても可）
- [ ] 保存時に `updateEntry` を呼び、画像の追加・削除に応じて Storage を更新する
- [ ] キャンセルで詳細画面に戻る

---

## フェーズ 6 — ルーティング整備

- [ ] `src/app/_layout.tsx` に以下の画面を追加登録する
  - `entries/[id]/index`（詳細）
  - `entries/[id]/edit`（編集）

---

## フェーズ 7 — テスト

- [ ] `src/services/__mocks__/firebase.ts` を作成してFirebaseをモックする
- [ ] `src/services/entries.test.ts` を作成する
  - `createEntry` / `updateEntry` / `deleteEntry` / `fetchEntries` の単体テスト
- [ ] `src/services/storage.test.ts` を作成する
  - `uploadImage` の単体テスト（サイズ上限チェックを含む）
- [ ] `src/hooks/useInfiniteEntries.test.ts` を作成する
- [ ] `src/hooks/useEntrySearch.test.ts` を作成する
- [ ] `src/store/entries.test.tsx` を Firestoreモック版に更新する
- [ ] `just test` で全テストがパスすることを確認する

---

## フェーズ 8 — 品質・仕上げ

- [ ] `just check` (TypeScript + ESLint) でエラー・警告がゼロであることを確認する
- [ ] `any` の使用がないことを確認する
- [ ] iOS・Android の両プラットフォームで動作確認する
  - 日記の作成・詳細表示・編集・削除が正常に動作する
  - 無限スクロールが正常に動作する
  - 検索（テキスト・日付範囲）が正常に動作する
  - 画像の追加・表示・削除が正常に動作する
  - オフライン時にキャッシュで閲覧できることを確認する
- [ ] ライト・ダークモード両方で表示崩れがないか確認する

---

## 実装順序の整理

```
フェーズ 0（環境確認）
  ↓
フェーズ 1（型・定数の基盤）
  ↓
フェーズ 2（Firebase 連携）
  ↓
フェーズ 3（状態管理・フック）
  ↓
フェーズ 4（UIコンポーネント）  ← フェーズ 3 と並行可
  ↓
フェーズ 5（画面実装）
  ↓
フェーズ 6（ルーティング整備）
  ↓
フェーズ 7（テスト）
  ↓
フェーズ 8（品質・仕上げ）
```

---

## スコープ外（将来拡張）

- Firebase Auth による認証機能
- ユーザーごとのデータ分離（`users/{uid}/entries`）
- コンポーネントテスト（`@testing-library/react-native`）
- E2E テスト（Detox）
- 日記のエクスポート機能（PDF / テキスト）
- プッシュ通知
