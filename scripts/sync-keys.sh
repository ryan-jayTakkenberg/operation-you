#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# Verspreidt de Anthropic key uit de root .env naar web + mobile.
# Eén bron van waarheid:  .env  (ANTHROPIC_API_KEY=...)
# Draai vanuit waar dan ook:  ./scripts/sync-keys.sh
# ─────────────────────────────────────────────────────────────
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT/.env"

if [ ! -f "$ENV_FILE" ]; then
  echo "✗ Geen .env gevonden. Doe:  cp .env.example .env  en vul je key in." >&2
  exit 1
fi

# Lees ANTHROPIC_API_KEY, strip eventuele quotes/spaties.
KEY="$(grep -E '^[[:space:]]*ANTHROPIC_API_KEY[[:space:]]*=' "$ENV_FILE" | head -1 | cut -d= -f2-)"
KEY="$(printf '%s' "$KEY" | sed -E 's/^[[:space:]]*//; s/[[:space:]]*$//; s/^"//; s/"$//; s/^'\''//; s/'\''$//')"

if [ -z "$KEY" ]; then
  echo "✗ ANTHROPIC_API_KEY is leeg in .env." >&2
  exit 1
fi

# ── Web (no-build) → js/config.local.js ──
cat > "$ROOT/frontend/js/config.local.js" <<EOF
// AUTO-GEGENEREERD door scripts/sync-keys.sh — niet handmatig bewerken.
// Bron: root .env (ANTHROPIC_API_KEY). Gitignored.
window.LOCAL_API_KEY = '$KEY';
EOF

# ── Mobile (Expo) → mobile/.env (EXPO_PUBLIC_ prefix is verplicht) ──
printf 'EXPO_PUBLIC_ANTHROPIC_API_KEY=%s\n' "$KEY" > "$ROOT/mobile/.env"

echo "✓ web    → frontend/js/config.local.js"
echo "✓ mobile → mobile/.env  (EXPO_PUBLIC_ANTHROPIC_API_KEY)"
echo
echo "Web: hard refresh in de browser (Cmd+Shift+R)."
echo "Mobile: herstart met cache-clear →  cd mobile && npx expo start -c"
