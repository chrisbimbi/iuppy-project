#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

gen_and_copy () {
  local flavor="$1"
  local yaml="$2"

  echo "=== Generating icons for ${flavor} using ${yaml}"
  (cd "$ROOT_DIR" && fvm dart run flutter_launcher_icons -f "$yaml")

  # destino dos recursos do flavor
  local dst="$ROOT_DIR/android/app/src/${flavor}/res"
  mkdir -p "$dst"

  echo "=== Copying mipmap* from main -> ${flavor}"
  rsync -a --delete "$ROOT_DIR/android/app/src/main/res/mipmap"* "$dst"/

  echo "✔ ${flavor} icons placed at android/app/src/${flavor}/res"
}

# gera cada flavor individualmente e copia
gen_and_copy "dev"  "$ROOT_DIR/flutter_launcher_icons-dev.yaml"
gen_and_copy "prod" "$ROOT_DIR/flutter_launcher_icons-prod.yaml"
gen_and_copy "acme" "$ROOT_DIR/flutter_launcher_icons-acme.yaml"

# opcional: deixa o main com o ícone de produção como fallback
echo "=== Restoring main res with PROD icons"
(cd "$ROOT_DIR" && fvm dart run flutter_launcher_icons -f flutter_launcher_icons-prod.yaml)

echo "✅ Done. Check android/app/src/{dev,prod,acme}/res/mipmap-*"