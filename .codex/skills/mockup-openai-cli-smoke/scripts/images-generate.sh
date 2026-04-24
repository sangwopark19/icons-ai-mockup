#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  OPENAI_API_KEY=... images-generate.sh --prompt "..." --out out.png [--size 1024x1024] [--quality medium] [--background opaque]

Notes:
  - Uses POST /v1/images/generations with model=gpt-image-2
  - gpt-image-2 does not support background=transparent
  - Requires curl and jq
EOF
}

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "Missing required command: $1" >&2
    exit 1
  }
}

if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  usage
  exit 0
fi

need_cmd curl
need_cmd jq

: "${OPENAI_API_KEY:?OPENAI_API_KEY is required}"

PROMPT=""
OUT=""
SIZE="1024x1024"
QUALITY="medium"
BACKGROUND="opaque"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --prompt)
      PROMPT="${2:-}"
      shift 2
      ;;
    --out)
      OUT="${2:-}"
      shift 2
      ;;
    --size)
      SIZE="${2:-}"
      shift 2
      ;;
    --quality)
      QUALITY="${2:-}"
      shift 2
      ;;
    --background)
      BACKGROUND="${2:-}"
      shift 2
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage
      exit 1
      ;;
  esac
done

if [[ -z "$PROMPT" || -z "$OUT" ]]; then
  usage
  exit 1
fi

if [[ "$BACKGROUND" == "transparent" ]]; then
  echo 'background=transparent is not supported for gpt-image-2' >&2
  exit 1
fi

tmp_json="$(mktemp)"
tmp_headers="$(mktemp)"
trap 'rm -f "$tmp_json" "$tmp_headers"' EXIT

curl -sS \
  -D "$tmp_headers" \
  -o "$tmp_json" \
  -X POST "https://api.openai.com/v1/images/generations" \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"model\": \"gpt-image-2\",
    \"prompt\": $(jq -Rn --arg v "$PROMPT" '$v'),
    \"size\": $(jq -Rn --arg v "$SIZE" '$v'),
    \"quality\": $(jq -Rn --arg v "$QUALITY" '$v'),
    \"background\": $(jq -Rn --arg v "$BACKGROUND" '$v')
  }"

request_id="$(grep -i '^x-request-id:' "$tmp_headers" | awk '{print $2}' | tr -d '\r' || true)"
echo "x-request-id: ${request_id:-unknown}" >&2

jq -e '.data[0].b64_json' "$tmp_json" >/dev/null
jq -r '.data[0].b64_json' "$tmp_json" | base64 --decode > "$OUT"
echo "saved: $OUT"
