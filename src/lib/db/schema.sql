-- Minecraft PFP 스킨 데이터베이스 스키마 (Supabase)

-- 스킨 메타데이터 및 이미지 URL 저장
CREATE TABLE IF NOT EXISTS skins (
    id SERIAL PRIMARY KEY,
    address VARCHAR(42) UNIQUE NOT NULL,

    -- Traits (JSON으로 저장)
    traits JSONB NOT NULL,

    -- 이미지 URL (Supabase Storage)
    image_url TEXT NOT NULL,
    storage_path TEXT NOT NULL,

    -- 생성 정보
    generation_method VARCHAR(20) NOT NULL CHECK (generation_method IN ('ai', 'procedural')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 주소 인덱스 (빠른 조회)
CREATE INDEX IF NOT EXISTS idx_skins_address ON skins(LOWER(address));

-- 생성 히스토리 (선택사항 - 재생성 추적용)
CREATE TABLE IF NOT EXISTS generation_history (
    id SERIAL PRIMARY KEY,
    address VARCHAR(42) NOT NULL,
    generation_method VARCHAR(20) NOT NULL CHECK (generation_method IN ('ai', 'procedural')),
    success BOOLEAN NOT NULL,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 히스토리 인덱스
CREATE INDEX IF NOT EXISTS idx_history_address ON generation_history(address);
CREATE INDEX IF NOT EXISTS idx_history_created_at ON generation_history(created_at DESC);

-- Row Level Security (RLS) 정책
-- Supabase는 기본적으로 RLS가 활성화되므로, 공개 접근을 위한 정책 추가

-- skins 테이블 정책
ALTER TABLE skins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access" ON skins;
CREATE POLICY "Allow public read access" ON skins
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert access" ON skins;
CREATE POLICY "Allow public insert access" ON skins
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update access" ON skins;
CREATE POLICY "Allow public update access" ON skins
    FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public delete access" ON skins;
CREATE POLICY "Allow public delete access" ON skins
    FOR DELETE USING (true);

-- generation_history 테이블 정책
ALTER TABLE generation_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access" ON generation_history;
CREATE POLICY "Allow public read access" ON generation_history
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert access" ON generation_history;
CREATE POLICY "Allow public insert access" ON generation_history
    FOR INSERT WITH CHECK (true);
