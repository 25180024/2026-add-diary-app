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
  ca-certificates

# ============================================================
# direnv (upstream binary — apt's version on Ubuntu 22.04 ships 2.28,
# which lacks `use_flake` (added in 2.30). Install latest into
# /usr/local/bin so it takes precedence over any apt copy.
# ============================================================

info "direnv (最新版) をインストールします"
curl -sfL https://direnv.net/install.sh | sudo bash

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
# VS Code resolution
#
# Cannot rely on `command -v code` alone: students may have
# appendWindowsPath=false in /etc/wsl.conf, which hides Windows PATH
# from WSL even when VS Code is fully installed. Probe well-known
# /mnt/c paths in that case.
#
# Same for winget.exe (lives under WindowsApps).
#
# Must invoke the WSL-side `code` bash wrapper (NOT cmd.exe /c code) so
# VS Code engages Remote-WSL when opening project files.
# ============================================================

WIN_CMD="/mnt/c/Windows/System32/cmd.exe"

get_win_username() {
  if [ -x "$WIN_CMD" ]; then
    "$WIN_CMD" /c "echo %USERNAME%" 2>/dev/null | tr -d '\r\n '
  fi
}

find_code_bin() {
  if command -v code >/dev/null 2>&1; then
    command -v code
    return 0
  fi
  local win_user
  win_user="$(get_win_username)"
  local candidates=(
    "/mnt/c/Program Files/Microsoft VS Code/bin/code"
    "/mnt/c/Program Files (x86)/Microsoft VS Code/bin/code"
  )
  if [ -n "$win_user" ]; then
    candidates+=("/mnt/c/Users/$win_user/AppData/Local/Programs/Microsoft VS Code/bin/code")
  fi
  for c in "${candidates[@]}"; do
    if [ -x "$c" ]; then
      echo "$c"
      return 0
    fi
  done
  return 1
}

find_winget_bin() {
  if command -v winget.exe >/dev/null 2>&1; then
    command -v winget.exe
    return 0
  fi
  local win_user
  win_user="$(get_win_username)"
  if [ -n "$win_user" ]; then
    local path="/mnt/c/Users/$win_user/AppData/Local/Microsoft/WindowsApps/winget.exe"
    if [ -x "$path" ]; then
      echo "$path"
      return 0
    fi
  fi
  return 1
}

CODE_BIN="$(find_code_bin || true)"

VSCODE_AVAILABLE=0
if [ -n "$CODE_BIN" ]; then
  VSCODE_AVAILABLE=1
  info "VS Code を検出しました: $CODE_BIN"
else
  WINGET_BIN="$(find_winget_bin || true)"
  if [ -n "$WINGET_BIN" ]; then
    info "Windows 側に VS Code をインストールします (winget, user scope)"
    if "$WINGET_BIN" install \
        --id Microsoft.VisualStudioCode \
        --silent \
        --scope user \
        --accept-package-agreements \
        --accept-source-agreements; then
      CODE_BIN="$(find_code_bin || true)"
      if [ -n "$CODE_BIN" ]; then
        VSCODE_AVAILABLE=1
      else
        warn "VS Code をインストールしましたが code 実行ファイルを見つけられませんでした。"
      fi
    else
      warn "winget での VS Code インストールに失敗しました。https://code.visualstudio.com/ から手動でインストールしてください。"
    fi
  else
    warn "VS Code も winget も見つかりません。https://code.visualstudio.com/ から VS Code を手動でインストールしてください。"
  fi
fi

run_code() {
  if [ -n "$CODE_BIN" ]; then
    "$CODE_BIN" "$@"
  else
    return 1
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

# Drop the user into a fresh interactive shell rooted at PROJECT_DIR.
# Strategy:
#   - Detect the actual interactive shell via $PPID (the script's parent).
#     $SHELL alone is unreliable: it's the login shell from /etc/passwd,
#     not necessarily the shell the student is sitting in.
#   - Source the user's existing rc, THEN cd $PROJECT_DIR. This way our cd
#     wins even if the user's rc does `cd ~` or exports HOME mid-rc.
#   - For bash use --rcfile; for zsh use ZDOTDIR. We also pre-set ZDOTDIR
#     before sourcing .bashrc, so a .bashrc that ends with `exec zsh`
#     still lands in our cd-injected zsh rc.

ZSH_RC_DIR="$(mktemp -d /tmp/diary-app-zsh.XXXXXX)"
cat > "$ZSH_RC_DIR/.zshrc" <<RC
[ -f "\$HOME/.zshrc" ] && . "\$HOME/.zshrc"
cd "$PROJECT_DIR"
RC

PARENT_SHELL=""
if command -v ps >/dev/null 2>&1; then
  PARENT_SHELL="$(ps -o comm= -p "$PPID" 2>/dev/null | tr -d ' \n' || true)"
fi
TARGET_SHELL_NAME="${PARENT_SHELL:-$(basename "${SHELL:-/bin/bash}")}"
TARGET_SHELL_BIN="$(command -v "$TARGET_SHELL_NAME" 2>/dev/null || echo "${SHELL:-/bin/bash}")"

case "$(basename "$TARGET_SHELL_BIN")" in
  zsh)
    ZDOTDIR="$ZSH_RC_DIR" exec "$TARGET_SHELL_BIN" -i
    ;;
  bash)
    BASH_RC="$(mktemp /tmp/diary-app-bashrc.XXXXXX)"
    cat > "$BASH_RC" <<RC
export ZDOTDIR="$ZSH_RC_DIR"
[ -f "\$HOME/.bashrc" ] && . "\$HOME/.bashrc"
cd "$PROJECT_DIR"
RC
    exec "$TARGET_SHELL_BIN" --rcfile "$BASH_RC" -i
    ;;
  *)
    exec "$TARGET_SHELL_BIN"
    ;;
esac
