#!/bin/bash
set -e
set -o pipefail

# ==============================================================================
# Canton Name Service (CNS) - Name Registration Script
#
# Registers a new human-readable name and maps it to a Canton Party ID.
# This script interacts with the Canton ledger's JSON API.
#
# Prerequisites:
#   - Daml SDK (with `dpm` command) installed and in PATH.
#   - `jq` command-line JSON processor installed.
#   - The CNS project must be built (`dpm build`) to create the DAR file.
#   - A running Canton ledger with the CNS DAR deployed.
#   - A valid JWT for a party who will be the owner of the name.
# ==============================================================================

# --- Help and Usage ---
usage() {
  cat <<EOF
Usage: $0 --name <name> --target <party-id> --owner <owner-party-id> --token <jwt> [--host <host>] [--port <port>]

Registers a new name in the Canton Name Service.

Required Arguments:
  --name        The human-readable name to register (e.g., 'alice.canton').
  --target      The party ID the name should resolve to.
  --owner       The party ID that will own and manage this name registration.
  --token       The JWT for authenticating with the ledger. Must contain an 'actAs'
                claim for the specified owner party.

Optional Arguments:
  --host        Ledger hostname (default: localhost).
  --port        Ledger JSON API port (default: 7575).
  -h, --help    Show this help message.

Example:
  export ALICE_JWT=\$(./scripts/get-token.sh Alice)
  ./scripts/register-name.sh \\
    --name "alice.canton" \\
    --target "Alice::1220a5e5..." \\
    --owner "Alice::1220a5e5..." \\
    --token "\$ALICE_JWT"
EOF
  exit 1
}

# --- Default values ---
LEDGER_HOST="localhost"
LEDGER_PORT="7575"
NAME=""
TARGET_PARTY=""
OWNER_PARTY=""
JWT=""

# --- Argument Parsing ---
while [[ $# -gt 0 ]]; do
  key="$1"
  case $key in
    --name)       NAME="$2"; shift; shift;;
    --target)     TARGET_PARTY="$2"; shift; shift;;
    --owner)      OWNER_PARTY="$2"; shift; shift;;
    --host)       LEDGER_HOST="$2"; shift; shift;;
    --port)       LEDGER_PORT="$2"; shift; shift;;
    --token)      JWT="$2"; shift; shift;;
    -h|--help)    usage;;
    *)            echo "Unknown option: $1"; usage;;
  esac
done

# --- Validate required arguments ---
if [ -z "$NAME" ] || [ -z "$TARGET_PARTY" ] || [ -z "$OWNER_PARTY" ] || [ -z "$JWT" ]; then
  echo "Error: Missing one or more required arguments." >&2
  echo "" >&2
  usage
fi

# --- Check for dependencies ---
if ! command -v dpm &> /dev/null; then
    echo "Error: 'dpm' command not found. Please install the Daml SDK and ensure it's in your PATH." >&2
    exit 1
fi
if ! command -v jq &> /dev/null; then
    echo "Error: 'jq' command not found. Please install jq to parse JSON responses." >&2
    exit 1
fi

# --- Dynamically find the main package ID from the built DAR ---
echo "🔎 Locating CNS package..."
DAR_FILE=$(find .daml/dist -name "cns-*.dar" -print -quit)
if [ -z "$DAR_FILE" ]; then
  echo "Error: Could not find a 'cns-*.dar' file in the '.daml/dist/' directory." >&2
  echo "Hint: Run 'dpm build' in the project root first." >&2
  exit 1
fi

PACKAGE_ID=$(dpm damlc inspect-dar --json "$DAR_FILE" | jq -r .main_package_id)
if [ -z "$PACKAGE_ID" ] || [ "$PACKAGE_ID" == "null" ]; then
  echo "Error: Could not extract main_package_id from '$DAR_FILE'." >&2
  exit 1
fi
echo "   Found package ID: $PACKAGE_ID"

# Assuming the main registry template is `CNS.Registry:NameRegistration`
TEMPLATE_ID="${PACKAGE_ID}:CNS.Registry:NameRegistration"

# --- Construct JSON payload for the create command ---
# The registration contract sets the owner as the initial observer for privacy.
JSON_PAYLOAD=$(jq -n \
                  --arg tplid "$TEMPLATE_ID" \
                  --arg name "$NAME" \
                  --arg owner "$OWNER_PARTY" \
                  --arg target "$TARGET_PARTY" \
                  '{templateId: $tplid, payload: {name: $name, owner: $owner, target: $target, observers: [$owner]}}')

URL="http://${LEDGER_HOST}:${LEDGER_PORT}/v1/create"

echo ""
echo "➡️  Submitting registration for '$NAME'..."
echo "   - Owner: $OWNER_PARTY"
echo "   - Target Party: $TARGET_PARTY"
echo "   - Ledger: $URL"
echo "   - Template: $TEMPLATE_ID"

# --- Send request to ledger ---
# The `--fail` or `-f` option makes curl exit with non-zero status on HTTP errors (>=400)
response=$(curl --fail -s -X POST "$URL" \
  -H "Authorization: Bearer ${JWT}" \
  -H "Content-Type: application/json" \
  -d "$JSON_PAYLOAD")

# --- Process response ---
# At this point, if curl succeeded, we have a response from the JSON API.
# This response can still represent a ledger-level error (e.g., duplicate key).
# A successful response has a `status` of 200 and a `result` object.
# An error response has a `status` != 200 and an `errors` array.

if echo "$response" | jq -e '.status == 200' > /dev/null; then
  contract_id=$(echo "$response" | jq -r '.result.contractId')
  echo ""
  echo "✅ Success! Name registered on the ledger."
  echo "   Contract ID: $contract_id"
else
  echo "" >&2
  echo "❌ Error: The ledger rejected the command." >&2
  echo "   Response from JSON API:" >&2
  echo "$response" | jq . >&2
  exit 1
fi