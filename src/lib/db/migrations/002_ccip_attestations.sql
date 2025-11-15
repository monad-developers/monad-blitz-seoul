-- CCIP Attestation 추적 테이블
-- Sepolia에서 Monad로 전송된 NFT 소유권 증명 데이터 저장

CREATE TABLE IF NOT EXISTS ccip_attestations (
    id SERIAL PRIMARY KEY,
    monad_address VARCHAR(42) NOT NULL,
    sepolia_nft_address VARCHAR(42) NOT NULL,
    sepolia_token_id BIGINT NOT NULL,
    ccip_message_id VARCHAR(66) NOT NULL UNIQUE,
    attestation_id VARCHAR(66) NOT NULL UNIQUE,
    source_chain_selector VARCHAR(20) NOT NULL DEFAULT '16015286601757825753',
    sepolia_tx_hash VARCHAR(66) NOT NULL,
    monad_received_at TIMESTAMP,
    status VARCHAR(20) CHECK (status IN ('pending', 'received', 'confirmed', 'completed', 'failed', 'used', 'expired', 'sent')) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP,
    used BOOLEAN DEFAULT false,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_ccip_monad_address ON ccip_attestations(monad_address);
CREATE INDEX IF NOT EXISTS idx_ccip_status ON ccip_attestations(status);
CREATE INDEX IF NOT EXISTS idx_ccip_message_id ON ccip_attestations(ccip_message_id);
CREATE INDEX IF NOT EXISTS idx_ccip_attestation_id ON ccip_attestations(attestation_id);
CREATE INDEX IF NOT EXISTS idx_ccip_created_at ON ccip_attestations(created_at DESC);

-- 자동 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_ccip_attestations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 자동 업데이트 트리거
DROP TRIGGER IF EXISTS trigger_ccip_attestations_updated_at ON ccip_attestations;
CREATE TRIGGER trigger_ccip_attestations_updated_at
    BEFORE UPDATE ON ccip_attestations
    FOR EACH ROW
    EXECUTE FUNCTION update_ccip_attestations_updated_at();

-- skins 테이블이 존재하는 경우 CCIP 관련 필드 추가
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'skins') THEN
        -- has_ccip_attestation 컬럼 추가
        IF NOT EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_name = 'skins' AND column_name = 'has_ccip_attestation'
        ) THEN
            ALTER TABLE skins ADD COLUMN has_ccip_attestation BOOLEAN DEFAULT false;
        END IF;

        -- ccip_attestation_id 컬럼 추가
        IF NOT EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_name = 'skins' AND column_name = 'ccip_attestation_id'
        ) THEN
            ALTER TABLE skins ADD COLUMN ccip_attestation_id INTEGER REFERENCES ccip_attestations(id);
        END IF;

        -- 인덱스 추가
        IF NOT EXISTS (
            SELECT FROM pg_indexes WHERE tablename = 'skins' AND indexname = 'idx_skins_has_ccip'
        ) THEN
            CREATE INDEX idx_skins_has_ccip ON skins(has_ccip_attestation);
        END IF;
    END IF;
END $$;

-- 테이블 생성 확인
COMMENT ON TABLE ccip_attestations IS 'CCIP를 통해 Sepolia에서 Monad로 전송된 NFT 소유권 증명 데이터';
COMMENT ON COLUMN ccip_attestations.monad_address IS 'Monad 네트워크의 사용자 주소';
COMMENT ON COLUMN ccip_attestations.sepolia_nft_address IS 'Sepolia 네트워크의 NFT 컨트랙트 주소';
COMMENT ON COLUMN ccip_attestations.sepolia_token_id IS 'Sepolia NFT 토큰 ID';
COMMENT ON COLUMN ccip_attestations.ccip_message_id IS 'CCIP 메시지 고유 ID';
COMMENT ON COLUMN ccip_attestations.attestation_id IS 'Attestation 고유 ID';
COMMENT ON COLUMN ccip_attestations.source_chain_selector IS 'CCIP 소스 체인 Selector (Sepolia)';
COMMENT ON COLUMN ccip_attestations.sepolia_tx_hash IS 'Sepolia 네트워크에서의 트랜잭션 해시';
COMMENT ON COLUMN ccip_attestations.monad_received_at IS 'Monad에서 attestation을 수신한 시각';
COMMENT ON COLUMN ccip_attestations.status IS 'Attestation 상태: pending(전송중), received(수신완료), used(사용됨), expired(만료됨)';
