set dotenv-load := true

# ============================================================
# install
# ============================================================

install:
    pnpm install

# ============================================================
# expo
# ============================================================

# default: tunnel mode (works on school networks)
start:
    pnpm exec expo start --tunnel

# local network mode (faster, same Wi-Fi only)
start-lan:
    pnpm exec expo start

# ============================================================
# quality
# ============================================================

check:
    pnpm exec tsc --noEmit
    pnpm exec expo lint

test:
    pnpm test

doctor:
    pnpm dlx expo-doctor

# ============================================================
# auth
# ============================================================

firebase-login:
    firebase login

eas-login:
    eas login

# ============================================================
# build
# ============================================================

build-ios:
    eas build --platform ios --profile preview

build-android:
    eas build --platform android --profile preview

build-list:
    eas build:list

# ============================================================
# git
# ============================================================

sync-upstream:
    git pull upstream main

# ============================================================
# ci
# ============================================================

ci:
    just check
    just test
