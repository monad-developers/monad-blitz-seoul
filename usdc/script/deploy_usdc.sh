#!/usr/bin/env bash
set -euo pipefail

# Deploy TestUSDC to a specified chain.
# Usage: ./script/deploy_usdc.sh <chain>
# Supported chains: monad, arbitrum-sepolia, avalanche-fuji, base-sepolia, eth-sepolia, op-sepolia
#
# .env requirements (per chain):
# PRIVATE_KEY=0x...
# RPC_<CHAIN>, <CHAIN>_USDC_OWNER, <CHAIN>_USDC_SUPPLY (whole tokens)

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env"

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 <chain>"
  exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE"
  exit 1
fi

CHAIN="$1"
set -a
source "$ENV_FILE"
set +a

case "$CHAIN" in
  monad)
    RPC="$RPC_MONAD"
    OWNER="$MONAD_USDC_OWNER"
    SUPPLY="$MONAD_USDC_SUPPLY"
    ;;
  arbitrum-sepolia|arbitrum)
    RPC="$RPC_ARBI"
    OWNER="$ARBI_USDC_OWNER"
    SUPPLY="$ARBI_USDC_SUPPLY"
    ;;
  avalanche-fuji|avalanche|fuji)
    RPC="$RPC_AVAL"
    OWNER="$AVAL_USDC_OWNER"
    SUPPLY="$AVAL_USDC_SUPPLY"
    ;;
  base-sepolia|base)
    RPC="$RPC_BASE"
    OWNER="$BASE_USDC_OWNER"
    SUPPLY="$BASE_USDC_SUPPLY"
    ;;
  eth-sepolia|ethereum-sepolia|sepolia)
    RPC="$RPC_ETH"
    OWNER="$ETH_USDC_OWNER"
    SUPPLY="$ETH_USDC_SUPPLY"
    ;;
  op-sepolia|optimism-sepolia|op)
    RPC="$RPC_OP"
    OWNER="$OP_USDC_OWNER"
    SUPPLY="$OP_USDC_SUPPLY"
    ;;
  *)
    echo "Unsupported chain: $CHAIN"
    echo "Supported chains: monad, arbitrum-sepolia, avalanche-fuji, base-sepolia, eth-sepolia, op-sepolia"
    exit 1
    ;;
esac

: "${PRIVATE_KEY:?PRIVATE_KEY not set}"
: "${RPC:?RPC not set for $CHAIN}"
: "${OWNER:?${CHAIN}_USDC_OWNER not set}"
: "${SUPPLY:?${CHAIN}_USDC_SUPPLY not set}"

cd "$ROOT_DIR"

echo "Deploying TestUSDC to $CHAIN"
echo "RPC=$RPC"
echo "Owner=$OWNER"
echo "Initial supply (whole)=$SUPPLY"

USDC_OWNER="$OWNER" \
USDC_INITIAL_SUPPLY="$SUPPLY" \
forge script script/DeployTestUSDC.s.sol:DeployTestUSDC \
  --rpc-url "$RPC" \
  --private-key "$PRIVATE_KEY" \
  --broadcast
