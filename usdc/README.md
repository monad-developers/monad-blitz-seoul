## TestUSDC (tUSDC)

- 6 decimal ERC20, mint/burn restricted to the owner.
- Constructor mints an initial supply to `initialOwner` (scaled by 1e6 internally).
- Simple enough for CCIP pools or local treasuries when native USDC mint/burn is unavailable.

## Deploying to each chain

The repo includes a generic Forge script plus a convenience shell runner.

### 1. Configure `.env`

```
PRIVATE_KEY=0x...

RPC_MONAD=https://...
MONAD_USDC_OWNER=0x...
MONAD_USDC_SUPPLY=1000000   # whole tokens, script multiplies by 1e6

RPC_ARBI=https://...
ARBI_USDC_OWNER=0x...
ARBI_USDC_SUPPLY=1000000

# Repeat for AVAL, BASE, ETH, OP ...
```

### 2. Run helper script per chain

```bash
cd usdc
bash script/deploy_usdc.sh monad
bash script/deploy_usdc.sh arbitrum-sepolia
bash script/deploy_usdc.sh avalanche-fuji
# ... (base, eth-sepolia, op-sepolia)
```

The script injects `USDC_OWNER` and `USDC_INITIAL_SUPPLY` and calls:

```bash
forge script script/DeployTestUSDC.s.sol:DeployTestUSDC \
  --rpc-url <rpc> --private-key <pk> --broadcast
```

### Manual invocation

When you only need a single deployment:

```bash
USDC_OWNER=0x... \
USDC_INITIAL_SUPPLY=1000000 \
forge script script/DeployTestUSDC.s.sol:DeployTestUSDC \
  --rpc-url <rpc> --private-key <pk> --broadcast
```

### Build/Test helpers

```bash
forge build
forge test
forge fmt
```
