#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# Diary App Hands-on Setup Script
#
# Usage (in WSL Ubuntu):
#   bash <(curl -fsSL https://raw.githubusercontent.com/ncc-toda/2026-add-diary-app/main/setup.sh)
#
# Optional: put the project somewhere other than ~/projects/2026-add-diary-app
#   PROJECT_DIR=~/work/diary-app bash <(curl -fsSL ...)
# ============================================================

# ----- configurable -----------------------------------------

# Allow override from environment (see usage above)
PROJECT_PARENT_DIR="${PROJECT_PARENT_DIR:-$HOME/projects}"
PROJECT_DIR="${PROJECT_DIR:-$PROJECT_PARENT_DIR/2026-add-diary-app}"

# ----- helpers ----------------------------------------------

info() { echo ""; echo "==> $*"; }
warn() { echo ""; echo "[warn] $*"; }
fail() { echo ""; echo "[error] $*"; exit 1; }

# ============================================================
# WSL sanity check (not fatal; teacher Mac will skip)
# ============================================================

if ! grep -qi microsoft /proc/version 2>/dev/null; then
  warn "WSL ではないようです。macOS の場合はこのスクリプトは想定外です。"
fi

# ============================================================
# apt packages
# ============================================================

info "apt パッケージをインストールします"
sudo apt update
sudo apt install -y \
  git \
  curl \
  unzip \
  xz-utils \
  ca-certificates \
  direnv

# ============================================================
# GitHub CLI
# ============================================================

if ! command -v gh >/dev/null 2>&1; then
  info "GitHub CLI (gh) をインストールします"

  curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg \
    | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
  sudo chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg

  echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" \
    | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null

  sudo apt update
  sudo apt install gh -y
fi

# ============================================================
# GitHub Login
# ============================================================

info "GitHub にログインします (初回のみブラウザ認証)"
gh auth status >/dev/null 2>&1 || gh auth login

# ============================================================
# Fork + Clone (idempotent)
# ============================================================

mkdir -p "$(dirname "$PROJECT_DIR")"

REPO="ncc-toda/2026-add-diary-app"
REPO_OWNER="${REPO%%/*}"

if [ ! -d "$PROJECT_DIR/.git" ]; then
  current_user="$(gh api user -q .login 2>/dev/null || true)"

  if [ -n "$current_user" ] && [ "$current_user" = "$REPO_OWNER" ]; then
    info "リポジトリオーナー ($current_user) でログイン中のため fork はスキップし clone します -> $PROJECT_DIR"
    gh repo clone "$REPO" "$PROJECT_DIR" -- --single-branch
  else
    info "リポジトリを fork して clone します -> $PROJECT_DIR"
    gh repo fork "$REPO" \
      --clone \
      --default-branch-only \
      -- "$PROJECT_DIR"
  fi
else
  info "リポジトリは既に存在します: $PROJECT_DIR"
fi

cd "$PROJECT_DIR"

# ============================================================
# Nix
# ============================================================

if ! command -v nix >/dev/null 2>&1; then
  info "Nix をインストールします (Determinate Systems installer)"

  curl --proto '=https' --tlsv1.2 -sSf -L \
    https://install.determinate.systems/nix \
    | sh -s -- install --no-confirm

  # 現プロセスで Nix を有効化
  if [ -f /nix/var/nix/profiles/default/etc/profile.d/nix-daemon.sh ]; then
    # shellcheck disable=SC1091
    . /nix/var/nix/profiles/default/etc/profile.d/nix-daemon.sh
  fi
fi

# ============================================================
# direnv hook (bashrc)
# ============================================================

if ! grep -q 'direnv hook bash' "$HOME/.bashrc" 2>/dev/null; then
  info "direnv フックを ~/.bashrc に追加します"
  cat >> "$HOME/.bashrc" <<'EOF'

# direnv (added by diary-app setup.sh)
eval "$(direnv hook bash)"
EOF
fi

# ============================================================
# .env.local 雛形作成 (中身は手動編集)
# ============================================================

if [ ! -f ".env.local" ]; then
  cat > .env.local <<'EOF'
# Anthropic API Key (for opencode VS Code extension)
# Get yours from https://console.anthropic.com/
ANTHROPIC_API_KEY=
EOF
  chmod 600 .env.local
  info ".env.local の雛形を作成しました。後で VS Code で開いて API Key を記入してください。"
fi

# ============================================================
# direnv allow
# ============================================================

direnv allow .

# ============================================================
# VS Code Extensions
# ============================================================

if command -v code >/dev/null 2>&1; then
  info "VS Code 拡張をインストールします"
  code --install-extension ms-vscode-remote.remote-wsl   || true
  code --install-extension esbenp.prettier-vscode        || true
  code --install-extension dbaeumer.vscode-eslint        || true
  code --install-extension usernamehw.errorlens          || true
  code --install-extension expo.vscode-expo-tools        || true
  code --install-extension mkhl.direnv                   || true
  code --install-extension sst-dev.opencode              || true
else
  warn "code コマンドが見つかりません。VS Code の 'Shell Command: Install code command in PATH' を実行してください。"
fi

# ============================================================
# pnpm install (Nix shell 内で実行)
# ============================================================

if [ -f "package.json" ]; then
  info "依存パッケージをインストールします"
  nix develop --command just install
else
  warn "package.json がまだありません。Expo アプリをスキャフォールド後に 'just install' を実行してください。"
fi

# ============================================================
# Open VS Code (WSL Remote として起動)
# ============================================================

if command -v code >/dev/null 2>&1; then
  info "VS Code を開きます"
  code .
fi

# ============================================================
# Done
# ============================================================

cat <<EOF

✅ セットアップが完了しました。

次にやること:

  1. VS Code で .env.local を開き、ANTHROPIC_API_KEY を記入する
  2. スマホに Expo Go をインストールする
       iPhone  -> App Store
       Android -> Google Play
  3. VS Code のターミナルで:
       just start

プロジェクトの場所: $PROJECT_DIR

EOF
