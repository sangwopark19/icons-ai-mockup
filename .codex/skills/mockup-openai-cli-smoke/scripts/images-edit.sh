#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  OPENAI_API_KEY=... images-edit.sh --prompt "..." --image in1.png [--image in2.png ...] --out out.png [--mask mask.png] [--quality high]

Notes:
  - Uses POST /v1/images/edits with model=gpt-image-2
  - Multiple --image arguments are allowed
  - If --mask is used, the mask must match the edited image size/format and include alpha
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
QUALITY="high"
MASK=""
IMAGES=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    --prompt)
      PROMPT="${2:-}"
      shift 2
      ;;
    --image)
      IMAGES+=("${2:-}")
      shift 2
      ;;
    --out)
      OUT="${2:-}"
      shift 2
      ;;
    --mask)
      MASK="${2:-}"
      shift 2
      ;;
    --quality)
      QUALITY="${2:-}"
      shift 2
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage
      exit 1
      ;;
  esac
done

if [[ -z "$PROMPT" || -z "$OUT" || "${#IMAGES[@]}" -eq 0 ]]; then
  usage
  exit 1
fi

tmp_json="$(mktemp)"
tmp_headers="$(mktemp)"
trap 'rm -f "$tmp_json" "$tmp_headers"' EXIT

curl_args=(
  -sS
  -D "$tmp_headers"
  -o "$tmp_json"
  -X POST "https://api.openai.com/v1/images/edits"
  -H "Authorization: Bearer $OPENAI_API_KEY"
  -F "model=gpt-image-2"
  -F "quality=$QUALITY"
  -F "prompt=$PROMPT"
)

for image in "${IMAGES[@]}"; do
  curl_args+=(-F "image[]=@$image")
done

if [[ -n "$MASK" ]]; then
  curl_args+=(-F "mask=@$MASK")
fi

curl "${curl_args[@]}"

request_id="$(grep -i '^x-request-id:' "$tmp_headers" | awk '{print $2}' | tr -d '\r' || true)"
echo "x-request-id: ${request_id:-unknown}" >&2

jq -e '.data[0].b64_json' "$tmp_json" >/dev/null
jq -r '.data[0].b64_json' "$tmp_json" | base64 --decode > "$OUT"
echo "saved: $OUT"
