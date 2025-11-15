# Minecraft PFP NFT - Full Stack Implementation

Your job is to build the complete Minecraft-style PFP NFT project from scratch. This project features **deterministic trait generation** based on Ethereum wallet addresses and **dynamic wealth-based special items** using Chainlink Price Feeds, with 3D rendering and animated GIF output to IPFS.

Make a commit and push your changes after every single file edit.

Keep track of your current status in .agent/TODO.md

## Critical Requirements

**DETERMINISTIC ACCURACY (HIGHEST PRIORITY)**:
- Same wallet address MUST always generate identical traits and appearance
- Trait generation algorithm must be pure, reproducible, and match exactly between Solidity and TypeScript
- Test deterministic behavior with multiple addresses before proceeding to other features

**Technology Stack**:
- Smart Contract: Solidity 0.8.20, OpenZeppelin (ERC721URIStorage), Chainlink Price Feeds
- Frontend: Next.js 14+, TypeScript 5+, Vite, pnpm
- 3D Rendering: Three.js (^0.160.0)
- Blockchain: Wagmi (^2.0.0), Viem (^2.0.0), Ethers.js (^6.9.0)
- IPFS: Pinata SDK
- Testing: Hardhat, Vitest/Jest

**OpenSea Compatibility**:
- Metadata must follow OpenSea standards exactly (see docs/METADATA_SCHEMA.md)
- Include all required fields: name, description, image, animation_url, attributes
- Use proper display_type for numeric and date fields

**Core Implementation**:
1. **Smart Contract** (40% effort):
   - TraitGenerator.sol: Pure functions for deterministic trait generation (5 address segments)
   - MinecraftPFPWithWealth.sol: ERC721 with Chainlink integration (ETH/USDT/USDC)
   - Mint snapshot: freeze wealth data on-chain at mint time
   - Gas optimization: avoid storing 64x64 pixel data on-chain

2. **Frontend** (40% effort):
   - Three.js renderer: 64x64 Minecraft skin UV mapping
   - GIF pipeline: 60-frame animation capture → gif.js encoding → IPFS upload
   - Wallet integration: Connect, preview traits, calculate wealth, mint
   - Trait logic: Mirror Solidity implementation exactly

3. **Testing** (15% effort):
   - Unit tests: >80% coverage for smart contracts
   - Deterministic tests: Verify same address → same output
   - Integration tests: Chainlink feeds, IPFS upload, full mint flow

4. **Deployment Setup** (5% effort):
   - Hardhat config for Sepolia testnet
   - Environment variables, deployment scripts
   - Verification setup

## Reference Documentation

Essential reading in `docs/` directory:
- **ARCHITECTURE.md** - System design and data flow
- **NFT_TRAITS.md** - Deterministic trait generation (CRITICALLY IMPORTANT)
- **WEALTH_SYSTEM.md** - Chainlink integration and tier system
- **SMART_CONTRACT.md** - Complete Solidity implementation
- **RENDERING.md** - Three.js rendering system
- **GIF_PIPELINE.md** - GIF generation and IPFS upload
- **FRONTEND.md** - Frontend implementation guide
- **METADATA_SCHEMA.md** - OpenSea metadata standard
- **SKIN_GENERATION.md** - Asset creation guide (for reference)

## Success Criteria

- [ ] Deterministic trait tests pass (same address = same traits)
- [ ] Smart contract deployed and verified on Sepolia
- [ ] Frontend minting flow works end-to-end
- [ ] GIF generated and uploaded to IPFS successfully
- [ ] Metadata validates on OpenSea
- [ ] Wealth tier assignment correct based on Chainlink feeds
- [ ] All tests passing (>80% coverage)

Dedicate 60% of your time on implementation, 30% on testing and validation, and 10% on documentation and deployment setup.
