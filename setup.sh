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
# direnv hook (bashrc / zshrc)
# ============================================================

if ! grep -q 'direnv hook bash' "$HOME/.bashrc" 2>/dev/null; then
  info "direnv フックを ~/.bashrc に追加します"
  cat >> "$HOME/.bashrc" <<'EOF'

# direnv (added by diary-app setup.sh)
eval "$(direnv hook bash)"
EOF
fi

if command -v zsh >/dev/null 2>&1; then
  if ! grep -q 'direnv hook zsh' "$HOME/.zshrc" 2>/dev/null; then
    info "direnv フックを ~/.zshrc に追加します"
    cat >> "$HOME/.zshrc" <<'EOF'

# direnv (added by diary-app setup.sh)
eval "$(direnv hook zsh)"
EOF
  fi
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
# VS Code (Windows-side install via winget if missing)
# ============================================================

VSCODE_AVAILABLE=0
if command -v code >/dev/null 2>&1; then
  VSCODE_AVAILABLE=1
elif command -v winget.exe >/dev/null 2>&1; then
  info "Windows 側に VS Code をインストールします (winget, user scope)"
  if winget.exe install \
      --id Microsoft.VisualStudioCode \
      --silent \
      --scope user \
      --accept-package-agreements \
      --accept-source-agreements; then
    VSCODE_AVAILABLE=1
  else
    warn "winget での VS Code インストールに失敗しました。https://code.visualstudio.com/ から手動でインストールしてください。"
  fi
else
  warn "winget.exe が見つかりません。https://code.visualstudio.com/ から VS Code を手動でインストールしてください。"
fi

# After a fresh winget install, `code` is not yet on the WSL-side PATH
# (WSL imports Windows PATH at shell startup). Route through powershell.exe,
# which reads a fresh Windows PATH from registry on each invocation.
run_code() {
  if command -v code >/dev/null 2>&1; then
    code "$@"
  else
    powershell.exe -NoProfile -Command "code $*"
  fi
}

# ============================================================
# VS Code Extensions
# ============================================================

if [ "$VSCODE_AVAILABLE" = "1" ]; then
  info "VS Code 拡張をインストールします"
  for ext in \
    ms-vscode-remote.remote-wsl \
    esbenp.prettier-vscode \
    dbaeumer.vscode-eslint \
    usernamehw.errorlens \
    expo.vscode-expo-tools \
    mkhl.direnv \
    sst-dev.opencode; do
    run_code --install-extension "$ext" || warn "拡張 $ext のインストールに失敗しました"
  done
else
  warn "VS Code が利用できないため、拡張のインストールをスキップしました。"
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

if [ "$VSCODE_AVAILABLE" = "1" ]; then
  info "VS Code を開きます"
  run_code .
fi

# ============================================================
# Done
# ============================================================

cat <<EOF

✅ セットアップが完了しました。

新しいシェルを起動して、プロジェクトディレクトリに移動した状態にします。
(direnv が走り、Nix シェル経由で 'just' などが使えるようになります)
元のシェルに戻りたいときは 'exit' と入力してください。

次にやること:

  1. VS Code で .env.local を開き、ANTHROPIC_API_KEY を記入する
  2. スマホに Expo Go をインストールする
       iPhone  -> App Store
       Android -> Google Play
  3. このターミナルで:
       just start

プロジェクトの場所: $PROJECT_DIR

EOF

cd "$PROJECT_DIR"
exec "${SHELL:-/bin/bash}" -l
