#!/usr/bin/env bash
# register-name.sh — Register a Canton name via the CNS Registrar SDK
set -euo pipefail

CANTON_HOST="${CANTON_HOST:-localhost}"
CANTON_PORT="${CANTON_PORT:-7575}"
AUTH_TOKEN="${AUTH_TOKEN:-}"
CNS_AUTHORITY="${CNS_AUTHORITY:-}"

usage() {
  echo "Usage: $0 --name <name.canton> --owner <party-id> [--ttl-days <n>]"
  echo ""
  echo "Environment:"
  echo "  CANTON_HOST     Canton JSON API host (default: localhost)"
  echo "  CANTON_PORT     Canton JSON API port (default: 7575)"
  echo "  AUTH_TOKEN      JWT for the Canton JSON API"
  echo "  CNS_AUTHORITY   CNS authority party ID"
  exit 1
}

NAME=""
OWNER=""
TTL_DAYS=365

while [[ $# -gt 0 ]]; do
  case "$1" in
    --name)      NAME="$2";     shift 2 ;;
    --owner)     OWNER="$2";    shift 2 ;;
    --ttl-days)  TTL_DAYS="$2"; shift 2 ;;
    *) usage ;;
  esac
done

[[ -z "$NAME"  ]] && { echo "Error: --name is required";  usage; }
[[ -z "$OWNER" ]] && { echo "Error: --owner is required"; usage; }
[[ -z "$CNS_AUTHORITY" ]] && { echo "Error: CNS_AUTHORITY env var is required"; usage; }

TTL_SECONDS=$(( TTL_DAYS * 86400 ))
NOW=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
EXPIRES=$(date -u -d "+${TTL_DAYS} days" +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null \
          || date -u -v+${TTL_DAYS}d +"%Y-%m-%dT%H:%M:%SZ")

echo "Registering '$NAME' → $OWNER (TTL: $TTL_DAYS days)"

curl -sf \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  "http://${CANTON_HOST}:${CANTON_PORT}/v1/create" \
  -d @- << JSON
{
  "templateId": "CNS:NameRecord:NameRecordContract",
  "payload": {
    "record": {
      "name":         "$NAME",
      "partyId":      "$OWNER",
      "owner":        "$OWNER",
      "registrar":    "$CNS_AUTHORITY",
      "ttlSeconds":   $TTL_SECONDS,
      "registeredAt": "$NOW",
      "expiresAt":    "$EXPIRES"
    },
    "authority": "$CNS_AUTHORITY"
  }
}
JSON

echo ""
echo "Name '$NAME' registered successfully."
