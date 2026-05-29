# 教員向けセットアップノート

このリポジトリを授業で配布するときに、教員側でやること・気をつけることのメモ。

## リポジトリの初期化

このテンプレートはまだ Expo アプリ本体を含んでいません。
最初に Expo アプリをスキャフォールドして、package.json などをコミットします。

```bash
cd ~/projects/diary-app   # または自分の作業場所
nix develop
pnpm create expo-app . --template default   # TypeScript テンプレート
git add .
git commit -m "scaffold Expo app"
git push origin main
```

> `pnpm create` で既存ファイル (`.envrc`, `flake.nix`, `justfile` 等) と
> 衝突する場合は、必要に応じて手動でマージしてください。

## setup.sh の差し替え

`setup.sh` 冒頭のプレースホルダを置き換えます。

| 変数 | 例 |
| --- | --- |
| `TEACHER_OWNER` | `your-github-org` |
| `OPENCODE_EXTENSION_ID` | `company.opencode` (実際の拡張 ID) |

`README.md` の `YOUR_ORG` も同様に置換してください。

## GitHub での配布

1. GitHub にリポジトリを作成 (Public または生徒がアクセスできる権限)
2. このテンプレートを push
3. 生徒に以下のワンライナーを共有

```
bash <(curl -fsSL https://raw.githubusercontent.com/YOUR_ORG/diary-app/main/setup.sh)
```

## Apple Developer

iPhone への独自ビルド配布 (`eas build --platform ios`) には Apple Developer Program (年間 99 USD) が必要。
**教員 1 名だけ加入**し、EAS の internal distribution で配布 URL を共有するのが現実的。
生徒それぞれに加入させる必要はない。

## Firebase

Expo Go で動かす前提なら **Firebase JS SDK** (`firebase` パッケージ) を採用してください。
`@react-native-firebase/*` を使うと Expo Go では動かず、development build が必要になります。

## 教員 (Mac) の作業フロー

WSL は不要。`flake.nix` が macOS にも対応しているので、以下だけでよい。

```bash
git clone git@github.com:YOUR_ORG/diary-app.git
cd diary-app
direnv allow      # 初回のみ
just install
just start
```

## トラブルシューティング (生徒対応用)

| 症状 | 原因の可能性 | 確認コマンド |
| --- | --- | --- |
| `nix: command not found` | Nix インストール後にシェルを開き直していない | `which nix` / WSL を一度閉じて再度開く |
| `direnv: error` | `direnv allow` 未実行 | `direnv status` |
| Expo Go で繋がらない | LAN モードが学校 Wi-Fi で機能しない | `just start` (tunnel) に切り替え |
| `pnpm install` が極端に遅い | `/mnt/c/...` 配下で作業している | プロジェクトを `~/projects/diary-app` に移動 |
| `gh: command not found` | `setup.sh` のインストールが途中で失敗 | `setup.sh` を再実行 |
| VS Code が Windows モードで開く | WSL 内で `code .` していない | WSL の bash から `cd ~/projects/diary-app && code .` |

## 配布物の更新

授業中に修正を入れた場合:

```bash
# 教員側
git commit -m "fix: ..."
git push origin main

# 生徒側
just sync-upstream
```
