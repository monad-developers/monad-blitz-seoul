#!/usr/bin/env bash
set -euo pipefail

# Deploy Receiver to a destination EVM testnet.
# Usage: ./script/deploy_receiver.sh <chain>
# Supported chains: arbitrum-sepolia, avalanche-fuji, base-sepolia, bnb-testnet, eth-sepolia, op-sepolia
#
# Requires contracts/.env to define:
# - PRIVATE_KEY: broadcaster pk (hex, 0x-prefixed)
# - SOURCE_CHAIN_SELECTOR: uint64 selector for Monad (source)
# - SOURCE_SENDER: source-chain Router address
# - RPC_<CHAIN>, <CHAIN>_ROUTER, <CHAIN>_USDC for each chain (see mapping below)

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env"

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 <chain>"
  exit 1
fi
CHAIN="$1"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE"
  exit 1
fi
set -a
source "$ENV_FILE"
set +a

case "$CHAIN" in
  arbitrum-sepolia|arbitrum)
    RPC="$RPC_ARBI"
    ROUTER="$ARBI_ROUTER"
    USDC="$ARBI_USDC"
    ;;
  avalanche-fuji|fuji|avalanche)
    RPC="$RPC_AVAL"
    ROUTER="$AVAL_ROUTER"
    USDC="$AVAL_USDC"
    ;;
  base-sepolia|base)
    RPC="$RPC_BASE"
    ROUTER="$BASE_ROUTER"
    USDC="$BASE_USDC"
    ;;
  eth-sepolia|ethereum-sepolia|sepolia)
    RPC="$RPC_ETH"
    ROUTER="$ETH_ROUTER"
    USDC="$ETH_USDC"
    ;;
  op-sepolia|optimism-sepolia|op)
    RPC="$RPC_OP"
    ROUTER="$OP_ROUTER"
    USDC="$OP_USDC"
    ;;
  *)
    echo "Unsupported chain: $CHAIN"
    echo "Supported: arbitrum-sepolia, avalanche-fuji, base-sepolia, eth-sepolia, op-sepolia"
    exit 1
    ;;
esac

: "${PRIVATE_KEY:?PRIVATE_KEY not set}"
: "${SOURCE_CHAIN_SELECTOR:?SOURCE_CHAIN_SELECTOR not set}"
: "${SOURCE_SENDER:?SOURCE_SENDER not set}"
: "${RPC:?RPC not set}"
: "${ROUTER:?ROUTER not set}"
: "${USDC:?USDC not set}"

cd "$ROOT_DIR"

echo "Deploying Receiver to $CHAIN"
echo "RPC=$RPC"
echo "ROUTER=$ROUTER"
echo "USDC=$USDC"
echo "SOURCE_CHAIN_SELECTOR=$SOURCE_CHAIN_SELECTOR"
echo "SOURCE_SENDER=$SOURCE_SENDER"

ROUTER="$ROUTER" \
SOURCE_CHAIN_SELECTOR="$SOURCE_CHAIN_SELECTOR" \
SOURCE_SENDER="$SOURCE_SENDER" \
USDC="$USDC" \
forge script script/DeployReceiver.s.sol:DeployReceiver \
  --rpc-url "$RPC" \
  --private-key "$PRIVATE_KEY" \
  --broadcast
