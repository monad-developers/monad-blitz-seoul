-- Create contents table
CREATE TABLE IF NOT EXISTS contents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id BIGINT UNIQUE NOT NULL, -- on-chain content ID
    author_address VARCHAR(42) NOT NULL,
    content_hash VARCHAR(66) NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    uri TEXT,
    content_type VARCHAR(20) NOT NULL DEFAULT 'post', -- post, comment
    parent_id UUID REFERENCES contents(id),
    community_id VARCHAR(100),
    bond_amount NUMERIC(78, 0) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'published', -- published, challenged, disputed, resolved
    published_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    lock_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_contents_author ON contents(author_address);
CREATE INDEX idx_contents_status ON contents(status);
CREATE INDEX idx_contents_community ON contents(community_id);
CREATE INDEX idx_contents_parent ON contents(parent_id);
CREATE INDEX idx_contents_published_at ON contents(published_at DESC);

-- Create challenges table
CREATE TABLE IF NOT EXISTS challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID NOT NULL REFERENCES contents(id),
    challenger_address VARCHAR(42) NOT NULL,
    reason VARCHAR(50) NOT NULL,
    evidence TEXT,
    bond_amount NUMERIC(78, 0) NOT NULL,
    resolved BOOLEAN DEFAULT FALSE,
    guilty BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_challenges_content ON challenges(content_id);
CREATE INDEX idx_challenges_challenger ON challenges(challenger_address);
CREATE INDEX idx_challenges_resolved ON challenges(resolved);

-- Create votes table (upvotes/downvotes)
CREATE TABLE IF NOT EXISTS votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID NOT NULL REFERENCES contents(id),
    voter_address VARCHAR(42) NOT NULL,
    vote_type VARCHAR(10) NOT NULL, -- upvote, downvote
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(content_id, voter_address)
);

CREATE INDEX idx_votes_content ON votes(content_id);
CREATE INDEX idx_votes_voter ON votes(voter_address);

-- Create users table (cache for on-chain data)
CREATE TABLE IF NOT EXISTS users (
    address VARCHAR(42) PRIMARY KEY,
    username VARCHAR(100),
    sbt_token_id BIGINT,
    karma INTEGER DEFAULT 100,
    total_stake NUMERIC(78, 0) DEFAULT 0,
    reputation_multiplier INTEGER DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_karma ON users(karma DESC);

-- Create toxicity_scores table
CREATE TABLE IF NOT EXISTS toxicity_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID NOT NULL REFERENCES contents(id),
    score FLOAT NOT NULL,
    model_version VARCHAR(50),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_toxicity_content ON toxicity_scores(content_id);
CREATE INDEX idx_toxicity_score ON toxicity_scores(score);

-- Create chain_events table (for event tracking)
CREATE TABLE IF NOT EXISTS chain_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    block_number BIGINT NOT NULL,
    transaction_hash VARCHAR(66) NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    contract_address VARCHAR(42) NOT NULL,
    data JSONB NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_chain_events_block ON chain_events(block_number);
CREATE INDEX idx_chain_events_type ON chain_events(event_type);
CREATE INDEX idx_chain_events_processed ON chain_events(processed);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_contents_updated_at BEFORE UPDATE ON contents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();