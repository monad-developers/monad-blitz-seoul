# Monaddit Backend

Rust backend service for Monaddit - handles off-chain content storage, blockchain event listening, and API endpoints.

## Prerequisites

- Rust 1.75+
- PostgreSQL 14+
- Redis 6+
- Access to Monad testnet RPC

## Setup

1. **Install dependencies**:
```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install PostgreSQL
sudo apt-get install postgresql postgresql-contrib

# Install Redis
sudo apt-get install redis-server
```

2. **Setup database**:
```bash
# Create database
sudo -u postgres psql
CREATE DATABASE monaddit;
CREATE USER monaddit WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE monaddit TO monaddit;
\q
```

3. **Configure environment**:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Run migrations**:
```bash
sqlx migrate run
```

## Running

### Development
```bash
cargo run
```

### Production
```bash
cargo build --release
./target/release/monaddit-backend
```

## API Endpoints

### Health
- `GET /health` - Health check
- `GET /chain/status` - Blockchain connection status

### Content
- `POST /api/content` - Create new content
- `GET /api/content/:id` - Get content by ID
- `GET /api/contents` - List contents
- `GET /api/stats` - Get statistics

### Scoring
- `POST /api/score` - Score content for toxicity
- `POST /api/score/batch` - Batch score multiple contents

### User
- `GET /api/user/:address` - Get user profile
- `POST /api/user/:address` - Update user profile

### Vote
- `POST /api/vote/:content_id` - Vote on content

## Architecture

```
src/
├── api/           # HTTP endpoints
├── chain/         # Blockchain interaction (Alloy - Read-only)
├── db/            # Database queries
├── models/        # Data models
├── workers/       # Background workers
└── main.rs        # Entry point
```

## Key Features

- **Hybrid Storage**: Content text in PostgreSQL, hash on blockchain
- **Event Listening**: Real-time blockchain event processing (read-only)
- **Toxicity Scoring**: Basic keyword-based scoring (ML model ready)
- **Rewards Worker**: Monitoring rewards epochs
- **Alloy Integration**: Type-safe contract reading (no private key needed)

## Important Notes

- **No Private Key Required**: Backend only reads blockchain data
- **User Transactions**: All write operations (publish, challenge, vote) are done by users directly from frontend
- **Backend Role**: Store content, listen to events, provide API, calculate scores

## Development

### Testing
```bash
cargo test
```

### Linting
```bash
cargo clippy
```

### Formatting
```bash
cargo fmt
```

## Environment Variables

See `.env.example` for required configuration.

Key variables:
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `MONAD_RPC_URL` - Monad testnet RPC endpoint
- `WALLET_PRIVATE_KEY` - Private key for transactions
- Contract addresses (set after deployment)