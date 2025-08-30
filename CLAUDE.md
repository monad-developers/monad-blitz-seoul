# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview: Monaddit (모나딧)

**Tagline**: "실명제는 의미 없다. 익명성은 지키면서 — 스테이킹이 진짜 책임을 만든다."

**Monaddit** is a Reddit-style on-chain community platform built on Monad L1 testnet, using economic incentives to ensure responsible content creation through staking mechanisms.

### Tech Stack
- **Smart Contracts**: Foundry (Solidity ^0.8.x)
- **Frontend**: Scaffold-ETH 2 with Next.js 15, TypeScript, React 19
- **Web3 Integration**: Wagmi v2, Viem, RainbowKit
- **Styling**: Tailwind CSS with DaisyUI/shadcn-ui
- **Chain**: Monad Testnet (EVM-compatible)
- **State Management**: Zustand
- **Backend (Off-chain)**: Rust + Axum for content storage and auto-scoring
  - Database: PostgreSQL for content text/metadata
  - Queue: Redis for rate limiting and job processing
  - Chain Integration: Alloy-rs for event listening
- **Storage Strategy**:
  - Content text → PostgreSQL (off-chain)
  - Content hash → Blockchain (on-chain anchoring)
  - Evidence/snapshots → IPFS (optional)

## Essential Commands

### Development Workflow
```bash
# Start local blockchain (Anvil)
yarn chain

# Deploy contracts to local network
yarn deploy

# Start frontend development server
yarn start

# Run smart contract tests
yarn foundry:test
# Or directly in foundry package:
forge test
```

### Code Quality
```bash
# Format all code
yarn format

# Lint all code
yarn lint

# Type checking for frontend
yarn next:check-types

# Format smart contracts only
yarn foundry:format

# Lint smart contracts only
yarn foundry:lint
```

### Build & Deployment
```bash
# Build frontend for production
yarn next:build

# Deploy contracts to specific network
yarn deploy --network <network-name>

# Verify contracts on Etherscan
yarn verify --network <network-name>
```

## Core Mechanisms & Smart Contract Architecture

### Key Smart Contracts to Implement

1. **MdtToken.sol** (NEW)
   - ERC-20 token with permit functionality (symbol: MDT)
   - Testnet token (tMDT) for development
   - Mint/burn functions for demo phase
   - Optional: votes extension for governance

2. **StakingVault.sol**
   - User stake management (deposit/withdraw MDT tokens)
   - Content bond reservation and slashing mechanisms
   - Minimum stake requirements (10 MDT)
   - Stake age tracking for eligibility

3. **ContentRegistry.sol**
   - Content publishing with bonds (0.1 tMDT per post/comment)
   - **On-chain storage**: Only content hash and optional URI (not full text)
   - **Off-chain storage**: Full text stored in PostgreSQL via Rust backend
   - Challenge/dispute initiation and tracking
   - Bond lifecycle management:
     - `lockUntil = block.timestamp + challengeWindow (7 days)`
     - After 7 days without formal challenges → withdrawable
     - If challenged → locked until dispute resolution
   - `withdrawBond(contentId)` for unchallenged content after 7 days
   - Status tracking: published/disputed/resolved

4. **ModerationGame.sol**
   - Jury selection from staked moderator pool
   - Commit-reveal voting mechanism
   - Evidence merkle root storage
   - Verdict execution and reward/slashing distribution
   - Anti-griefing: max lock period (14 days), rechallenge cooldown (5 days)

5. **ReputationSBT.sol**
   - Non-transferable reputation tokens
   - Tracks: Karma, dispute rate, win/loss ratio, stake age
   - Influences: governance weight, slashing caps, fee discounts
   - Eligibility criteria for staking rewards

6. **StakingRewards.sol** (NEW)
   - Accumulates 20% of slashing penalties for good users
   - Eligibility requirements:
     - Minimum stake ≥ 10 MDT
     - Stake age ≥ 7 days
     - No guilty verdicts in last 14 days
     - No active disputes
     - Karma ≥ 0
   - Weekly epoch distribution (7 days)
   - Distribution formula: `userShare ∝ stakeAmount × repMultiplier`
   - Functions: `accrue()`, `checkpoint()`, `claim()`, `isEligible()`

7. **Treasury.sol**
   - Fee and penalty distribution management
   - Community treasury for governance
   - Bounty payment system

### Economic Parameters (Testnet)

| Parameter | Value | Description |
|-----------|-------|-------------|
| User minimum stake | 10 tMDT | Required to participate |
| Content bond | 0.1 tMDT | Locked per post/comment, withdrawable after 7 days |
| Challenge bond | 0.2 tMDT | Required to initiate dispute |
| Challenge window | 7 days | Period for challenging content |
| Max slashing | 20% | Per incident cap |
| Distribution | 40/30/20/10 | Challenger/Jury/StakingRewards/Burn |
| Reward epoch | 7 days | Staking rewards distribution cycle |
| Max lock period | 14 days | Auto-acquittal if exceeded |
| Rechallenge cooldown | 5 days | Prevents spam on same content |
| Cooldown after acquittal | 48 hours | Optional withdrawal delay |

### Bond Lifecycle & Timing

1. **Publication**: Content posted → bond locked for 7 days
2. **No challenges**: After 7 days → `withdrawBond()` available
3. **Challenge received**: Bond locked → dispute resolution
   - **Acquitted**: Immediate or 48h cooldown withdrawal
   - **Guilty**: Bond slashed per verdict
4. **Anti-griefing**: Max 14-day lock, then auto-acquittal

### Smart Contracts (`packages/foundry/`)
- **Contracts**: Located in `contracts/` - implement Monaddit core logic
- **Deployment**: Scripts in `script/` for Monad testnet deployment
- **Testing**: Comprehensive tests using Foundry (unit/fuzzing/gas optimization)
- **Configuration**: Update `foundry.toml` with Monad RPC endpoints
- **ABIs**: Auto-sync to frontend via generation scripts

### Frontend (`packages/nextjs/`)
- **App Router**: Next.js 15 app router in `app/` directory
- **Key Pages to Implement**:
  - `/` - Reddit-style community feed with posts/comments
  - `/post/[id]` - Individual post with comments and moderation UI
  - `/profile` - User dashboard showing:
    - Reputation metrics and SBT
    - Stakes and bond status
    - Dispute history
    - **Withdrawable bonds** (7+ days old, unchallenged)
    - **Claimable staking rewards**
  - `/moderation` - Jury voting interface (commit/reveal)
  - `/communities` - Community list and creation
  - `/rewards` - Staking rewards dashboard and claim interface
  - `/debug` - Contract interaction for testing
- **Components to Build**:
  - Post/Comment forms with bond display
  - Bond withdrawal UI for eligible content
  - Staking rewards claim button
  - Challenge/dispute modal with evidence submission
  - Reputation badge display (SBT visualization)
  - Slashing animation and notifications
  - Jury voting interface (commit/reveal phases)
  - Countdown timers for challenge windows
- **Hooks**: Custom hooks for Monaddit contracts
- **State Management**: Zustand for global state (user stakes, reputation, active disputes, withdrawable bonds)

### Backend Architecture (`packages/backend/`)
- **Framework**: Rust with Axum web framework
- **Runtime**: Tokio for async operations
- **Database**: PostgreSQL with SQLx for content storage
- **Queue**: Redis for rate limiting and job queues
- **Chain Integration**: Alloy-rs for blockchain interaction
- **Key Endpoints**:
  - `/api/content` - Store/retrieve content text
  - `/api/score` - Auto-scoring with ML model
  - `/api/webhook/*` - Chain event handlers
  - `/api/claim` - Staking rewards processing
- **Workers**:
  - Event listener for ContentRegistry events
  - Jury vote resolution worker
  - Epoch rollup batch for rewards
- **Security**: HMAC signatures, CORS, API keys

### Key Integration Points

1. **Contract-Frontend Bridge**:
   - Contracts deployed via Foundry generate ABIs
   - `generateTsAbis.js` creates TypeScript interfaces
   - Frontend auto-imports contract data from `contracts/deployedContracts.ts`

2. **Contract-Backend Bridge**:
   - Alloy-rs `sol!` macro for type-safe contract bindings
   - Event subscription for content publishing
   - Transaction submission for automated operations

3. **Hot Reload**: Frontend automatically updates when contracts are redeployed locally

4. **Network Management**:
   - Local development uses Anvil (Foundry's local chain)
   - Network configurations in `foundry.toml`, `scaffold.config.ts`, and backend `.env`
   - Default target network is Foundry local chain

5. **Wallet Integration**:
   - Burner wallet for local testing
   - RainbowKit for production wallet connections
   - Account management via Foundry keystore system
   - Backend wallet for automated transactions

## Development Roadmap

### Day 0: Setup & Bootstrap
- Configure Monad testnet in `.env` (RPC URL, Chain ID)
- Set up monorepo structure with `packages/backend` for Rust
- Initialize Rust backend with Axum + PostgreSQL + Redis
- Set up ABI synchronization scripts for both frontend and backend
- Design contract interaction flow and content storage strategy

### Day 1: Core Contracts & Backend
- Implement MdtToken, StakingVault, ContentRegistry, ModerationGame contracts
- Bond lifecycle: publish → 7-day window → withdraw/challenge
- Rust backend v0:
  - Content API endpoints (`/api/content`, `/api/score`)
  - PostgreSQL schema for content storage
  - Event listener for ContentRegistry events using Alloy-rs
- Basic flow testing with Foundry

### Day 2: Complete System Integration
- Jury commit/reveal mechanism
- Slashing and reward distribution (40/30/20/10 split)
- StakingRewards epoch and claim logic
- ReputationSBT implementation
- Backend workers:
  - Jury resolution worker
  - Rewards epoch batch processor
  - Redis job queue implementation
- Frontend integration with wagmi/viem hooks
- Bond withdrawal UI

### Day 3: Polish & Demo
- Auto-scorer integration (ONNX runtime or Python microservice)
- Gas optimization
- Backend observability with tracing
- Demo scenario:
  - Post with bond → content stored in Postgres → hash on-chain
  - Challenge flow → auto-score from backend → slashing animation
  - Bond withdrawal after 7 days
  - Staking rewards claim with backend verification
- Testnet deployment scripts for all components

## Development Tips

- **Monad Testnet Config**: Update `foundry.toml` and `scaffold.config.ts` with Monad RPC/Chain ID
- **Testing**: Use tMDT tokens (testnet MDT) - minted via MdtToken contract
- **Gas vs Staking**: Gas fees paid in Monad native coin, staking/bonds/rewards in MDT
- **Moderation Flow**:
  - Optimistic publishing → 7-day challenge window
  - Challenges lock bonds → jury vote → slashing/rewards
  - Unchallenged content → withdrawable bonds after 7 days
- **Staking Rewards**:
  - 20% of slashing goes to reward pool
  - Weekly distribution to eligible stakers
  - Eligibility: min stake, age, no recent violations
- **Security**:
  - Commit-reveal for votes
  - Merkle proofs for evidence
  - Randomized jury selection
  - Time-based anti-griefing measures
- Environment variables:
  - `.env` in foundry: `MONAD_RPC_URL`, `MONAD_CHAIN_ID`, deployment keys
  - `.env.local` in nextjs: API keys, backend URL, IPFS config
  - `.env` in backend:
    - `DATABASE_URL=postgres://user:pass@localhost:5432/monadit`
    - `REDIS_URL=redis://localhost:6379`
    - `MONAD_RPC_URL`, `BACKEND_PORT=8787`
    - `WALLET_PRIVATE_KEY` (for automated txs)

## Key Implementation Notes

- **Optimistic Moderation**: Content publishes immediately with economic stakes at risk
- **Token Economics**:
  - Gas fees: Monad native coin (from testnet faucet)
  - Staking/bonds/rewards: MDT token (ERC-20)
  - Bond amounts: 0.1 tMDT creates skin-in-the-game, withdrawable if good behavior
- **Slashing Game**: Both challengers and content creators stake tokens at risk
- **Positive Incentives**: Good users earn from staking rewards pool (20% of slashing)
- **Reputation System**: SBT-based, affects voting weight, slashing limits, and reward eligibility
- **Anti-Abuse**:
  - Sybil resistance via stake age requirements
  - False report penalties (challenger bond slashing)
  - Time limits prevent indefinite locks
  - Rechallenge cooldowns prevent spam

## Contract Interfaces

```solidity
interface IMdtToken {
  function mint(address to, uint256 amount) external;
  function burn(uint256 amount) external;
  function permit(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s) external;
}

interface IStakingVault {
  function deposit(uint256 amount) external; // deposits MDT tokens
  function withdraw(uint256 amount) external;
  function reserveForContent(bytes32 contentId, uint256 amount) external;
  function slash(address user, uint256 amount) external;
}

interface IContentRegistry {
  function publish(bytes32 contentHash, uint256 bond, string calldata uri) external returns (uint256 contentId);
  function challenge(uint256 contentId, uint8 reason, uint256 bond) external;
  function resolve(uint256 contentId, bool guilty) external;
  function withdrawBond(uint256 contentId) external; // withdraw after 7 days without challenges
}

interface IModerationGame {
  function commitVote(uint256 contentId, bytes32 commitment) external;
  function revealVote(uint256 contentId, bool vote, bytes32 salt) external;
}

interface IStakingRewards {
  function accrue(uint256 amount) external; // called on slashing (20% of penalties)
  function checkpoint() external; // epoch transition (weekly)
  function claim(address user) external returns (uint256);
  function isEligible(address user) external view returns (bool);
}
```

## Demo Scenario Script

1. **Onboarding**: Connect wallet → Get tMDT from faucet/mint → Stake 10 tMDT → Create profile (SBT)
2. **Content Creation**: Post normal and malicious comments (show 0.1 tMDT bonds)
3. **Challenge Flow**: Report malicious content → Auto-score popup → Jury vote
4. **Slashing**: Verdict animation → 40% to challenger, 30% to jury, 20% to rewards pool
5. **Bond Withdrawal**: Show 7-day old content → Click withdraw → Receive bond back
6. **Staking Rewards**: Eligible user claims accumulated rewards from pool
7. **Tagline Display**: "인터넷 실명제가 의미 없었다 — 스테이킹이 진짜 책임을 만든다."

## Backend Implementation Notes

### Rust Backend Structure (`packages/backend/`)
```
backend/
├── src/
│   ├── main.rs           # Axum server entry point
│   ├── api/              # HTTP endpoints
│   │   ├── content.rs    # Content CRUD
│   │   ├── score.rs      # ML scoring
│   │   └── webhook.rs    # Chain event handlers
│   ├── workers/          # Background tasks
│   │   ├── listener.rs   # Chain event listener
│   │   └── rewards.rs    # Epoch processor
│   ├── db/               # Database models
│   └── chain/            # Alloy-rs bindings
├── migrations/           # SQL migrations
└── Cargo.toml
```

### Key Backend Responsibilities
1. **Content Storage**: Store full text in PostgreSQL, return hash for on-chain anchoring
2. **Event Processing**: Listen to ContentRegistry events, update content status
3. **Auto-scoring**: Run toxicity models (ONNX or external service) on new content
4. **Reward Distribution**: Calculate and process weekly staking rewards
5. **API Gateway**: Serve content to frontend, handle authentication

### Content Flow
1. User submits content via frontend
2. Frontend calls backend `/api/content` to store text
3. Backend stores in PostgreSQL, returns content hash
4. Frontend publishes hash to ContentRegistry contract with bond
5. Backend listener catches Published event, updates DB status
6. If challenged, backend provides evidence/snapshots for jury
