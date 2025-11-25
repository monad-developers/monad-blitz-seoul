-- IPFS 업로드 기록 테이블
-- Supabase Dashboard → SQL Editor에서 실행

CREATE TABLE IF NOT EXISTS ipfs_uploads (
    id SERIAL PRIMARY KEY,
    address TEXT NOT NULL UNIQUE,
    gif_cid TEXT NOT NULL,
    metadata_cid TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 주소로 빠른 조회를 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_ipfs_uploads_address ON ipfs_uploads(address);

-- 생성일로 정렬을 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_ipfs_uploads_created_at ON ipfs_uploads(created_at DESC);

-- Row Level Security (RLS) 활성화
ALTER TABLE ipfs_uploads ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽기 가능 (자신의 업로드 기록 확인)
CREATE POLICY "Anyone can view upload records" ON ipfs_uploads
    FOR SELECT
    USING (true);

-- 서버에서만 삽입 가능 (service_role 사용)
-- RLS는 anon key에만 적용되므로, service_role로 insert하면 통과됨

COMMENT ON TABLE ipfs_uploads IS 'IPFS GIF 업로드 기록 (주소당 1회 제한)';
COMMENT ON COLUMN ipfs_uploads.address IS '업로더 지갑 주소 (소문자)';
COMMENT ON COLUMN ipfs_uploads.gif_cid IS 'IPFS GIF CID';
COMMENT ON COLUMN ipfs_uploads.metadata_cid IS 'IPFS 메타데이터 CID';
COMMENT ON COLUMN ipfs_uploads.file_size IS 'GIF 파일 크기 (bytes)';
COMMENT ON COLUMN ipfs_uploads.ip_address IS '업로더 IP 주소';
COMMENT ON COLUMN ipfs_uploads.created_at IS '업로드 시간';
