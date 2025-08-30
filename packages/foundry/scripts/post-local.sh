#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Contract addresses (local deployment - update after `yarn deploy`)
MDT_TOKEN="0x5FbDB2315678afecb367f032d93F642f64180aa3"
STAKING_VAULT="0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"
CONTENT_REGISTRY="0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"

# Default values for local testing
RPC_URL="http://localhost:8545"
PRIVATE_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
USER_ADDRESS="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"

# Post content
TITLE="${1:-Test Post from Script}"
CONTENT="${2:-This is a test post created directly from the command line using cast commands.}"
BOND_AMOUNT="100000000000000000" # 0.1 MDT in wei

echo -e "${BLUE}=== Monaddit Post Creation Script (Local) ===${NC}"
echo ""

# Step 1: Check if user has staked (minimum 10 MDT required)
echo -e "${BLUE}Checking stake status...${NC}"
STAKE_INFO=$(cast call $STAKING_VAULT "getStakeInfo(address)" $USER_ADDRESS --rpc-url $RPC_URL)
echo "Stake info: $STAKE_INFO"

# Parse the first value (total staked amount)
STAKED_AMOUNT=$(echo $STAKE_INFO | sed 's/\[//g' | sed 's/\]//g' | cut -d',' -f1)
MIN_STAKE="10000000000000000000" # 10 MDT in wei

if [ "$STAKED_AMOUNT" -lt "$MIN_STAKE" ] 2>/dev/null; then
    echo -e "${YELLOW}Warning: You may not have staked the minimum 10 MDT required.${NC}"
    echo "Current stake: $STAKED_AMOUNT wei"
    echo "Run ./scripts/stake.sh first if needed."
fi
echo ""

# Step 2: Create content hash
echo -e "${BLUE}Creating content hash...${NC}"
COMBINED_CONTENT="${TITLE}${CONTENT}${USER_ADDRESS}$(date +%s)"
CONTENT_HASH=$(echo -n "$COMBINED_CONTENT" | cast keccak)
echo "Content hash: $CONTENT_HASH"
echo ""

# Step 3: Approve ContentRegistry to spend 0.1 MDT
echo -e "${BLUE}Approving ContentRegistry to spend 0.1 MDT for bond...${NC}"
cast send $MDT_TOKEN \
    "approve(address,uint256)" \
    $CONTENT_REGISTRY \
    $BOND_AMOUNT \
    --private-key $PRIVATE_KEY \
    --rpc-url $RPC_URL
echo -e "${GREEN}✓ Approved${NC}"
echo ""

# Step 4: Publish content
echo -e "${BLUE}Publishing content to blockchain...${NC}"
echo "Title: $TITLE"
echo "Content Preview: ${CONTENT:0:50}..."
echo "Bond: 0.1 MDT"
echo ""

CONTENT_URI="/api/content/$(date +%s)"

cast send $CONTENT_REGISTRY \
    "publish(bytes32,uint256,string)" \
    $CONTENT_HASH \
    $BOND_AMOUNT \
    "\"$CONTENT_URI\"" \
    --private-key $PRIVATE_KEY \
    --rpc-url $RPC_URL

echo ""
echo -e "${GREEN}✓ Content published successfully!${NC}"
echo ""

# Step 5: Get total posts count
echo -e "${BLUE}Checking total posts...${NC}"
NEXT_ID=$(cast call $CONTENT_REGISTRY "nextContentId()" --rpc-url $RPC_URL)
TOTAL_POSTS=$((NEXT_ID - 1))
echo "Total posts on chain: $TOTAL_POSTS"
echo "Your post ID: $((TOTAL_POSTS))"
echo ""

echo -e "${GREEN}=== Post Creation Complete ===${NC}"
echo -e "${YELLOW}Important Notes:${NC}"
echo "• Your 0.1 MDT bond is locked for 7 days"
echo "• Bond can be withdrawn after 7 days if unchallenged"
echo "• Content hash stored on-chain: $CONTENT_HASH"
echo ""
echo "To check your post:"
echo "cast call $CONTENT_REGISTRY \"getContent(uint256)\" $((TOTAL_POSTS)) --rpc-url $RPC_URL"
echo ""
echo "To create another post:"
echo "./post-local.sh \"Your Title\" \"Your Content\""