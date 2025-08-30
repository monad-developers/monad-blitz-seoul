# 🏛️ Monaddit (모나딧)

> **"실명제는 의미 없다. 익명성은 지키면서 — 스테이킹이 진짜 책임을 만든다."**

## 🎯 Overview

Monaddit is a Reddit-style on-chain community platform built on Monad L1 testnet, where economic incentives ensure responsible content creation. Users stake MDT tokens (ERC-20) to post content, and malicious behavior results in slashing through community-driven moderation games. Gas fees are paid in Monad native coin, while staking, bonds, and rewards use MDT tokens.

**Key Innovation**: Hybrid on-chain/off-chain architecture where content text is stored in PostgreSQL for efficiency, while content hashes are anchored on-chain for integrity and economic accountability.

### ✨ Key Features

- **🔒 Stake-based Posting**: Deposit MDT tokens (ERC-20) to create posts and comments
- **⚖️ Optimistic Moderation**: Content publishes immediately with 7-day challenge window
- **🎲 Jury System**: Commit-reveal voting by randomly selected staked moderators
- **💎 Reputation SBTs**: Non-transferable tokens tracking karma and dispute history
- **💸 Slashing Mechanism**: Economic penalties distributed 40/30/20/10 (challenger/jury/stakers/burn)
- **🏆 Staking Rewards**: Good users earn weekly rewards from 20% of slashing penalties
- **🔄 Bond Lifecycle**: Withdraw bonds after 7 days if unchallenged

## 🛠 Tech Stack

- **Smart Contracts**: Foundry (Solidity ^0.8.x)
- **Frontend**: Scaffold-ETH 2, Next.js 15, TypeScript, React 19
- **Backend**: Rust with Axum web framework
- **Database**: PostgreSQL (content storage), Redis (queues/caching)
- **Web3**: Wagmi v2, Viem, RainbowKit, Alloy-rs (backend)
- **Blockchain**: Monad Testnet (EVM-compatible)
- **Styling**: Tailwind CSS, DaisyUI/shadcn-ui
- **State Management**: Zustand
- **Storage Strategy**:
  - Content text → PostgreSQL (off-chain)
  - Content hash → Blockchain (on-chain anchoring)
  - Evidence/snapshots → IPFS (optional)

## 📜 Deployed Contracts (Monad Testnet)

| Contract | Address |
|----------|---------|
| **MdtToken** | `0x5DBEed591792cB042e7DBA157f99f2e14FFF2ab0` |
| **StakingVault** | `0x7fC178D288a2de094926b07A443ebE35f42038C7` |
| **ContentRegistry** | `0x3F6Fd0C3995B6fb6c0563E65bf9f44a754261FF5` |
| **ModerationGame** | `0xF6876ddc90AFE7753B23398cE104C2592dDeA997` |
| **ReputationSBT** | `0x6b7a5C5De9d65617fC42E2A46B1b5A2E65c82184` |
| **StakingRewards** | `0xB1f4B9D360d87A07733B0ea1f4bd0083bcC97Df2` |
| **Treasury** | `0x8d066C45178B35b2E85272de3892AC6EF4Af1722` |

**Network Details:**
- Chain: Monad Testnet
- Chain ID: 10143
- RPC URL: https://testnet-rpc.monad.xyz

## 📋 Requirements

Before you begin, ensure you have:

- [Node.js (>= v20.18.3)](https://nodejs.org/en/download/)
- [Yarn](https://yarnpkg.com/getting-started/install)
- [Git](https://git-scm.com/downloads)
- [Foundry](https://book.getfoundry.sh/getting-started/installation)
- [Rust](https://rustup.rs/) (for backend)
- [PostgreSQL](https://www.postgresql.org/download/)
- [Redis](https://redis.io/download/)
- Monad testnet RPC access
- Monad native coins from faucet (for gas)
- tMDT tokens (testnet MDT) obtained via MdtToken contract

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/pdao-monad-blitz-seoul/monaddit.git
cd monaddit
yarn install
```

### 2. Environment Setup

Configure Monad testnet in your environment files:

**`packages/foundry/.env`**:
```env
MONAD_RPC_URL=https://testnet-rpc.monad.xyz
MONAD_CHAIN_ID=10143
PRIVATE_KEY=your_deployment_key
```

**`packages/nextjs/.env.local`**:
```env
NEXT_PUBLIC_MONAD_RPC_URL=https://testnet-rpc.monad.xyz
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id
NEXT_PUBLIC_BACKEND_URL=http://localhost:8787
```

**`packages/backend/.env`**:
```env
DATABASE_URL=postgres://user:pass@localhost:5432/monaddit
REDIS_URL=redis://localhost:6379
MONAD_RPC_URL=https://testnet-rpc.monad.xyz
BACKEND_PORT=8787
```

### 3. Local Development

```bash
# Terminal 1: Start local Anvil chain (for testing)
yarn chain

# Terminal 2: Deploy contracts
yarn deploy

# Terminal 3: Start backend services
cd packages/backend
cargo run

# Terminal 4: Start frontend
yarn start
```

Visit `http://localhost:3000` to see the app.

### 4. Testnet Deployment

```bash
# Deploy to Monad testnet
yarn deploy --network monad

# Verify contracts
yarn verify --network monad
```

## 🏗 Architecture

### Smart Contracts

1. **MdtToken.sol**
   - ERC-20 token with permit functionality (symbol: MDT)
   - Testnet token (tMDT) for development
   - Mint/burn functions for demo phase
   - Optional: votes extension for governance

2. **StakingVault.sol**
   - Manages user stakes and bonds (in MDT tokens)
   - Handles slashing operations
   - Enforces minimum stake requirements (10 tMDT)
   - Tracks stake age for eligibility

3. **ContentRegistry.sol**
   - Records content hash and URI (not full text)
   - Manages challenge lifecycle with 7-day window
   - Tracks content status (published/disputed/resolved)
   - Enables bond withdrawal after challenge period

4. **ModerationGame.sol**
   - Implements commit-reveal voting mechanism
   - Random jury selection from staked moderators
   - Executes verdict with reward/slashing distribution
   - Anti-griefing measures (14-day max lock, 5-day rechallenge cooldown)

5. **ReputationSBT.sol**
   - Non-transferable reputation tokens
   - Tracks karma, dispute rate, win/loss ratio
   - Influences voting weight and slashing caps
   - Determines staking reward eligibility

6. **StakingRewards.sol**
   - Accumulates 20% of slashing penalties
   - Weekly epoch distribution to eligible stakers
   - Eligibility: min stake, age, no recent violations
   - Distribution proportional to stake × reputation

7. **Treasury.sol**
   - Manages community funds and governance
   - Handles bounty payments

### Economic Model

| Parameter | Value (Testnet) | Description |
|-----------|-----------------|-------------|
| Minimum Stake | 10 tMDT | Required to participate |
| Content Bond | 0.1 tMDT | Locked per post/comment, withdrawable after 7 days |
| Challenge Bond | 0.2 tMDT | Required to initiate dispute |
| Challenge Window | 7 days | Period for challenging content |
| Max Slashing | 20% | Per incident cap |
| Distribution | 40/30/20/10 | Challenger/Jury/StakingRewards/Burn |
| Reward Epoch | 7 days | Weekly staking rewards distribution |
| Max Lock Period | 14 days | Auto-acquittal if exceeded |
| Rechallenge Cooldown | 5 days | Prevents spam on same content |
| Acquittal Cooldown | 48 hours | Optional withdrawal delay |

## 🎮 User Flow

1. **Join**: Connect wallet → Get tMDT from faucet/mint → Stake 10 tMDT → Receive reputation SBT
2. **Post**: Create content → Backend stores text → 0.1 tMDT bond locks → Hash published on-chain
3. **Interact**: Upvote/downvote, comment, or challenge content
4. **Challenge**: Submit evidence → Auto-score from backend → Jury commit-reveal vote
5. **Resolution**:
   - **If guilty**: Bond slashed → 40% challenger, 30% jury, 20% staking pool, 10% burn
   - **If innocent**: Challenge bond slashed → Content creator compensated
6. **Bond Withdrawal**: After 7 days without challenges → Withdraw bond
7. **Staking Rewards**: Weekly distribution to eligible stakers from penalty pool

## 🧪 Testing

```bash
# Run all tests
yarn test

# Run with gas reporting
forge test --gas-report

# Run specific test
forge test --match-test testStaking -vvv
```

## 📚 Project Structure

```
monaddit/
├── packages/
│   ├── foundry/          # Smart contracts
│   │   ├── contracts/    # Solidity contracts
│   │   ├── script/       # Deployment scripts
│   │   ├── test/         # Contract tests
│   │   └── foundry.toml  # Foundry config
│   ├── nextjs/           # Frontend
│   │   ├── app/          # Next.js app router
│   │   ├── components/   # React components
│   │   ├── hooks/        # Custom hooks
│   │   └── utils/        # Utilities
│   └── backend/          # Rust backend
│       ├── src/
│       │   ├── api/      # HTTP endpoints
│       │   ├── workers/  # Background tasks
│       │   ├── db/       # Database models
│       │   └── chain/    # Alloy-rs bindings
│       ├── migrations/   # SQL migrations
│       └── Cargo.toml    # Rust dependencies
├── README.md
├── CLAUDE.md            # AI assistant context
└── package.json         # Monorepo config
```

## 🗄️ Content Storage Architecture

### Hybrid On-chain/Off-chain Design
- **Off-chain (PostgreSQL)**: Full content text, metadata, user interactions
- **On-chain (Blockchain)**: Content hash (keccak256), URI, bonds, status
- **Benefits**: Gas efficiency, scalability, content integrity

### Content Publishing Flow
1. User writes content in frontend
2. Frontend sends text to backend `/api/content`
3. Backend stores in PostgreSQL, returns hash
4. Frontend publishes hash to `ContentRegistry` contract
5. Backend listener updates content status from chain events

## 🛡 Security Considerations

- **Commit-Reveal Voting**: Prevents vote manipulation and front-running
- **Randomized Juries**: Reduces collusion risk through random selection
- **Merkle Proofs**: Efficient and tamper-proof evidence verification
- **Time Locks**: 7-day challenge window, 14-day max lock for anti-griefing
- **Stake Age**: Sybil resistance through minimum 7-day stake age requirement
- **Content Integrity**: Off-chain storage with on-chain hash anchoring
- **Economic Security**: Slashing mechanisms create real economic consequences
- **Token Separation**: Gas fees in Monad native coin, staking/rewards in MDT token

## 🚧 Development Roadmap

### Phase 1: Core Infrastructure (Days 0-1)
- ✅ Scaffold-ETH 2 setup with Monad testnet
- ⬜ Core smart contracts (MdtToken, StakingVault, ContentRegistry, ModerationGame)
- ⬜ Rust backend with PostgreSQL integration
- ⬜ Basic frontend with wallet connection

### Phase 2: Complete System (Day 2)
- ⬜ Jury commit-reveal mechanism
- ⬜ StakingRewards contract with weekly epochs
- ⬜ ReputationSBT implementation
- ⬜ Backend workers for chain events
- ⬜ Frontend bond withdrawal UI

### Phase 3: Polish & Demo (Day 3)
- ⬜ Auto-scoring integration (ML model)
- ⬜ Gas optimization
- ⬜ Demo scenario implementation
- ⬜ Testnet deployment

### Future Enhancements
- VRF for truly random jury selection
- Policy pack marketplace
- Mobile app
- Cross-chain support

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📄 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Scaffold-ETH 2](https://scaffoldeth.io)
- Powered by [Monad](https://monad.xyz)
- Inspired by decentralized governance experiments

---

**⚠️ Disclaimer**: This is a hackathon project using testnet tokens. Not audited for production use.
