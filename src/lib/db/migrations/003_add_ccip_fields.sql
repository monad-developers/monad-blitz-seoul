-- CCIP Attestations 테이블에 필드 추가
-- expires_at: attestation 만료 시간
-- used: attestation 사용 여부

ALTER TABLE IF EXISTS ccip_attestations
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP;

ALTER TABLE IF EXISTS ccip_attestations
ADD COLUMN IF NOT EXISTS used BOOLEAN DEFAULT false;

-- 상태 체크 제약 조건 업데이트 (DROP & RECREATE)
ALTER TABLE ccip_attestations
DROP CONSTRAINT IF EXISTS ccip_attestations_status_check;

ALTER TABLE ccip_attestations
ADD CONSTRAINT ccip_attestations_status_check
CHECK (status IN ('pending', 'sent', 'confirmed', 'completed', 'failed', 'received', 'used', 'expired'));

-- 새로운 인덱스 추가 (있을 경우)
CREATE INDEX IF NOT EXISTS idx_ccip_expires_at ON ccip_attestations(expires_at);
CREATE INDEX IF NOT EXISTS idx_ccip_used ON ccip_attestations(used);

-- 컬럼 설명 추가
COMMENT ON COLUMN ccip_attestations.expires_at IS 'Attestation 만료 시간 (기본 7일)';
COMMENT ON COLUMN ccip_attestations.used IS 'Attestation 사용 여부';
