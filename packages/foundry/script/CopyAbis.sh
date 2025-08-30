#!/bin/bash

# Build contracts first
echo "Building contracts..."
forge build

# Create ABI directory in backend
ABI_DIR="../backend/abis"
mkdir -p $ABI_DIR

# Copy relevant contract ABIs
echo "Copying ABIs to backend..."

# List of contracts to copy
contracts=(
    "MdtToken"
    "StakingVault"
    "ContentRegistry"
    "ModerationGame"
    "ReputationSBT"
    "StakingRewards"
    "Treasury"
)

for contract in "${contracts[@]}"; do
    if [ -f "out/$contract.sol/$contract.json" ]; then
        echo "Copying $contract ABI..."
        cp "out/$contract.sol/$contract.json" "$ABI_DIR/$contract.json"
    else
        echo "Warning: $contract ABI not found"
    fi
done

echo "ABI copy complete!"