#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Contract addresses from Monad testnet deployment
MDT_TOKEN="0x5DBEed591792cB042e7DBA157f99f2e14FFF2ab0"
STAKING_VAULT="0x7fC178D288a2de094926b07A443ebE35f42038C7"
CONTENT_REGISTRY="0x3F6Fd0C3995B6fb6c0563E65bf9f44a754261FF5"

# Default values
RPC_URL="https://testnet-rpc.monad.xyz"
PRIVATE_KEY="${MONAD_PRIVATE_KEY:-0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80}"
USER_ADDRESS="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"

# Post content
TITLE="${1:-Test Post from Script}"
CONTENT="${2:-This is a test post created directly from the command line using cast commands.}"
BOND_AMOUNT="100000000000000000" # 0.1 MDT in wei

echo -e "${BLUE}=== Monaddit Post Creation Script ===${NC}"
echo ""

# Step 1: Check stake status
echo -e "${BLUE}Checking stake status...${NC}"
STAKE_INFO=$(cast call $STAKING_VAULT "getStakeInfo(address)" $USER_ADDRESS --rpc-url $RPC_URL 2>/dev/null)
if [ -z "$STAKE_INFO" ]; then
    echo -e "${RED}Error: Could not fetch stake info. Make sure you have staked at least 10 MDT.${NC}"
    echo "Run ./stake.sh first to stake MDT tokens."
    exit 1
fi
echo "Stake info: $STAKE_INFO"
echo ""

# Step 2: Check MDT balance for bond
echo -e "${BLUE}Checking MDT balance for bond...${NC}"
BALANCE=$(cast call $MDT_TOKEN "balanceOf(address)" $USER_ADDRESS --rpc-url $RPC_URL 2>/dev/null)
if [ -z "$BALANCE" ]; then
    echo -e "${RED}Error: Could not fetch MDT balance.${NC}"
    exit 1
fi
echo "MDT Balance: $BALANCE"
echo ""

# Step 3: Create content hash (using keccak256 of the content)
echo -e "${BLUE}Creating content hash...${NC}"
# Combine title and content for hash
COMBINED_CONTENT="${TITLE}${CONTENT}${USER_ADDRESS}$(date +%s)"
# Use cast to compute keccak256 hash
CONTENT_HASH=$(echo -n "$COMBINED_CONTENT" | cast keccak)
echo "Content hash: $CONTENT_HASH"
echo ""

# Step 4: Approve ContentRegistry to spend 0.1 MDT for bond
echo -e "${BLUE}Approving ContentRegistry to spend 0.1 MDT for bond...${NC}"
APPROVE_TX=$(cast send $MDT_TOKEN \
    "approve(address,uint256)" \
    $CONTENT_REGISTRY \
    $BOND_AMOUNT \
    --private-key $PRIVATE_KEY \
    --rpc-url $RPC_URL 2>&1)

if [[ $APPROVE_TX == *"error"* ]]; then
    echo -e "${RED}Error approving MDT: $APPROVE_TX${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Approved${NC}"
echo ""

# Step 5: Publish content to ContentRegistry
echo -e "${BLUE}Publishing content to blockchain...${NC}"
echo "Title: $TITLE"
echo "Content: $CONTENT"
echo "Bond: 0.1 MDT"
echo ""

# Create a simple URI for the content (in production, this would point to backend)
CONTENT_URI="ipfs://QmTest$(date +%s)"

PUBLISH_TX=$(cast send $CONTENT_REGISTRY \
    "publish(bytes32,uint256,string)" \
    $CONTENT_HASH \
    $BOND_AMOUNT \
    "\"$CONTENT_URI\"" \
    --private-key $PRIVATE_KEY \
    --rpc-url $RPC_URL 2>&1)

if [[ $PUBLISH_TX == *"error"* ]]; then
    echo -e "${RED}Error publishing content: $PUBLISH_TX${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Content published successfully!${NC}"
echo ""

# Step 6: Get the content ID from events (optional)
echo -e "${BLUE}Transaction Details:${NC}"
echo "$PUBLISH_TX" | grep -E "transaction|block|gas"
echo ""

echo -e "${GREEN}=== Post Creation Complete ===${NC}"
echo -e "${YELLOW}Important Notes:${NC}"
echo "• Your 0.1 MDT bond is locked for 7 days"
echo "• If no one challenges your content, you can withdraw the bond after 7 days"
echo "• The content hash is stored on-chain: $CONTENT_HASH"
echo "• Content URI: $CONTENT_URI"
echo ""
echo "To create another post, run:"
echo "./post.sh \"Your Title\" \"Your Content\""