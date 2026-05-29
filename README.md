# Diary App Hands-on

React Native + Expo + Firebase を題材にした、AI 駆動開発ハンズオン用テンプレートです。

## 使用技術

- React Native / Expo / Firebase
- TypeScript
- Nix flakes (環境固定)
- direnv (cd で自動有効化)
- pnpm (パッケージマネージャ)
- just (生徒向けコマンドの入口)
- VS Code + opencode 拡張 (AI 駆動開発)

---

## 必要なもの

- Windows PC
- WSL2 Ubuntu (インストール済み前提)
- VS Code (Windows 側にインストール)
- GitHub アカウント
- Anthropic API Key
- iPhone または Android スマートフォン

> 教員 (Mac) は WSL 不要。`flake.nix` が `aarch64-darwin` にも対応しているので、`nix develop` だけで同じ環境に入れます。

---

## 初回セットアップ (生徒向け)

WSL の Ubuntu を開いて、以下を 1 行だけ実行します。

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/YOUR_ORG/diary-app/main/setup.sh)
```

`setup.sh` がやること:

1. apt パッケージ (git / curl / direnv 等) のインストール
2. GitHub CLI (`gh`) のインストール
3. GitHub ログイン (初回のみブラウザ認証)
4. リポジトリの fork + clone (`~/projects/diary-app` に配置)
5. Nix のインストール
6. direnv フックの設定
7. `.env.local` の雛形作成
8. VS Code 拡張のインストール
9. `pnpm install`
10. VS Code 起動

---

## Anthropic API Key の設定

セットアップ後、VS Code で `.env.local` を開いて、以下のように記入します。

```
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxx
```

このファイルは `.gitignore` で除外されているので、誤って push されません。
direnv が `cd` 時に自動で環境変数として読み込みます。

---

## Expo Go のインストール

スマホに Expo Go をインストールしてください。

- iPhone: App Store → "Expo Go"
- Android: Google Play → "Expo Go"

---

## 開発開始

VS Code 左下に `WSL: Ubuntu` と表示されていることを確認したら、ターミナルで:

```bash
just start
```

QR コードが表示されたら、Expo Go で読み取ります。

> デフォルトは tunnel モードです (学校 Wi-Fi でも繋がりやすいため)。
> 同一 Wi-Fi で速度を出したい場合は `just start-lan` を使ってください。

---

## 2 回目以降

WSL の Ubuntu を開いて:

```bash
cd ~/projects/diary-app
code .
```

VS Code のターミナルで:

```bash
just start
```

---

## よく使うコマンド

| コマンド | 説明 |
| --- | --- |
| `just start` | Expo を tunnel モードで起動 |
| `just start-lan` | Expo を LAN モードで起動 |
| `just check` | TypeScript 型チェック + ESLint |
| `just test` | テスト実行 |
| `just doctor` | `expo-doctor` で環境診断 |
| `just build-ios` | EAS で iOS 実機向けビルド |
| `just build-android` | EAS で Android 実機向けビルド |
| `just sync-upstream` | 教員リポジトリの更新を取得 |

---

## VS Code の使い方

- 必ず WSL 側のプロジェクトを開いてください (`code .` を WSL から実行)
- 左下に `WSL: Ubuntu` と表示されていれば OK
- Windows 側 (`/mnt/c/...`) から開くと Node / Expo の挙動が不安定になります

---

## プロジェクトの配置場所

### 標準: `~/projects/diary-app`

`setup.sh` は自動的に `~/projects/diary-app` に配置します。
特にこだわりがなければ、この場所をそのまま使ってください。

### 任意のディレクトリに置きたい場合

`PROJECT_DIR` 環境変数で上書きできます。

```bash
PROJECT_DIR=~/work/my-diary bash <(curl -fsSL https://raw.githubusercontent.com/YOUR_ORG/diary-app/main/setup.sh)
```

または親ディレクトリだけ変えるなら:

```bash
PROJECT_PARENT_DIR=~/work bash <(curl -fsSL https://raw.githubusercontent.com/YOUR_ORG/diary-app/main/setup.sh)
# -> ~/work/diary-app に配置される
```

**注意点 (任意ディレクトリにする人向け)**

- **Windows 側 (`/mnt/c/...`) には絶対に置かないでください。**
  Node の `node_modules` やファイル監視 (Metro / watchman) が極端に遅くなり、
  授業中に動作不能になることがあります。
  必ず WSL の Linux ファイルシステム (`/home/<user>/...`) 配下に置いてください。
- パスにスペースや日本語を含めない方が安全です。
- 教員が共有する手順書 (講師がトラブルシュート時に確認するコマンド例) は
  `~/projects/diary-app` を前提に書かれていることがあります。
  違うパスにした場合は、その都度読み替えてください。

---

## Git

- `origin` ... 自分の fork リポジトリ (push してよい)
- `upstream` ... 教員リポジトリ (push 不可、pull のみ)

授業中に教員が修正を入れた場合は:

```bash
just sync-upstream
```

`commit` は自由に行って構いません。`push` も自分の fork に対してだけなら自由です。

---

## トラブルシューティング

まずはこれを実行してください。

```bash
just doctor
```

そのうえで、以下の出力を教員に共有してください。

```bash
pwd
which node && node -v
which pnpm && pnpm -v
which nix && nix --version
direnv status
git remote -v
```

詳細は [`docs/teacher-setup-notes.md`](docs/teacher-setup-notes.md) を参照。
