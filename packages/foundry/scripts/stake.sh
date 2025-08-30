#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Contract addresses (update these after deployment)
MDT_TOKEN="0x5FbDB2315678afecb367f032d93F642f64180aa3"
STAKING_VAULT="0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"

# Default values
RPC_URL="http://localhost:8545"
PRIVATE_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
USER_ADDRESS="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"

# Amount to stake (in MDT, will be converted to wei)
AMOUNT=${1:-100}
AMOUNT_WEI=$(echo "$AMOUNT * 10^18" | bc)

echo -e "${BLUE}=== MDT Staking Script ===${NC}"
echo "Staking $AMOUNT MDT tokens..."
echo ""

# Step 1: Check current balance
echo -e "${BLUE}Checking MDT balance...${NC}"
BALANCE=$(cast call $MDT_TOKEN "balanceOf(address)" $USER_ADDRESS --rpc-url $RPC_URL)
BALANCE_MDT=$(echo "$BALANCE / 10^18" | bc)
echo "Current balance: $BALANCE_MDT MDT"
echo ""

# Check if balance is sufficient
if [ "$BALANCE_MDT" -lt "$AMOUNT" ]; then
    echo -e "${RED}Error: Insufficient balance. You have $BALANCE_MDT MDT but need $AMOUNT MDT${NC}"
    echo "Please get more MDT tokens first."
    exit 1
fi

# Step 2: Approve StakingVault
echo -e "${BLUE}Approving StakingVault to spend $AMOUNT MDT...${NC}"
cast send $MDT_TOKEN \
    "approve(address,uint256)" \
    $STAKING_VAULT \
    $AMOUNT_WEI \
    --private-key $PRIVATE_KEY \
    --rpc-url $RPC_URL
echo -e "${GREEN}✓ Approved${NC}"
echo ""

# Step 3: Deposit to StakingVault
echo -e "${BLUE}Staking $AMOUNT MDT...${NC}"
cast send $STAKING_VAULT \
    "deposit(uint256)" \
    $AMOUNT_WEI \
    --private-key $PRIVATE_KEY \
    --rpc-url $RPC_URL
echo -e "${GREEN}✓ Staked successfully!${NC}"
echo ""

# Step 4: Check stake info
echo -e "${BLUE}Checking stake info...${NC}"
STAKE_INFO=$(cast call $STAKING_VAULT "getStakeInfo(address)" $USER_ADDRESS --rpc-url $RPC_URL)
echo "Stake info (raw): $STAKE_INFO"
echo ""

echo -e "${GREEN}=== Staking Complete ===${NC}"
echo "You have successfully staked $AMOUNT MDT tokens!"
echo "You can now create posts with 0.1 MDT bonds."
echo ""
echo "To stake a different amount, run: ./stake.sh <amount>"
echo "Example: ./stake.sh 50"