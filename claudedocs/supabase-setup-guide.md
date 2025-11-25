# Supabase 설정 가이드

## 1. Supabase 프로젝트 생성

### 1.1 계정 생성 및 프로젝트 생성
1. https://supabase.com 접속
2. "Start your project" 클릭
3. GitHub 계정으로 로그인
4. "New project" 클릭
5. 프로젝트 정보 입력:
   - Name: `minecraft-pfp` (원하는 이름)
   - Database Password: 강력한 비밀번호 생성 (자동 생성 권장)
   - Region: 가장 가까운 지역 선택 (Northeast Asia - Seoul)
   - Pricing Plan: Free (무료)
6. "Create new project" 클릭

### 1.2 환경 변수 확인
프로젝트 생성 후:
1. Settings → API 메뉴로 이동
2. 다음 정보 복사:
   - **Project URL**: `NEXT_PUBLIC_SUPABASE_URL`
   - **Project API keys → anon public**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## 2. 데이터베이스 설정

### 2.1 SQL Editor에서 스키마 실행
1. Supabase 대시보드 → SQL Editor
2. "New query" 클릭
3. `src/lib/db/schema.sql` 파일 내용 복사
4. 붙여넣기 후 "Run" 클릭

또는 직접 실행:

```sql
-- 스킨 테이블
CREATE TABLE IF NOT EXISTS skins (
    id SERIAL PRIMARY KEY,
    address VARCHAR(42) UNIQUE NOT NULL,
    traits JSONB NOT NULL,
    image_url TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    generation_method VARCHAR(20) NOT NULL CHECK (generation_method IN ('ai', 'procedural')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 주소 인덱스
CREATE INDEX IF NOT EXISTS idx_skins_address ON skins(LOWER(address));

-- 생성 히스토리 테이블
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
```

### 2.2 테이블 확인
1. Table Editor 메뉴로 이동
2. `skins`, `generation_history` 테이블이 생성되었는지 확인

---

## 3. Storage 설정

### 3.1 Storage Bucket 생성
1. Storage 메뉴로 이동
2. "Create a new bucket" 클릭
3. Bucket 정보 입력:
   - Name: `skins`
   - Public bucket: **체크** ✅ (공개 접근 허용)
4. "Create bucket" 클릭

### 3.2 Storage Policy 설정 (자동 생성됨)
Public bucket으로 생성했으므로, 읽기는 자동으로 허용됩니다.

추가로 업로드 정책이 필요하면:
1. Storage → `skins` 버킷 선택
2. Policies 탭
3. "New policy" 클릭
4. Template: "Allow public uploads"
5. "Review" → "Save policy"

또는 SQL로 직접 설정:
```sql
-- 모든 사용자가 업로드 가능하도록 설정
CREATE POLICY "Public Access"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'skins');
```

---

## 4. 로컬 개발 환경 설정

### 4.1 환경 변수 설정
`.env.local` 파일 생성 (이미 있으면 수정):

```env
# Anthropic API Key
ANTHROPIC_API_KEY=sk-ant-...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# 컨트랙트 주소 (선택)
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
```

### 4.2 개발 서버 재시작
```bash
# 개발 서버가 실행 중이면 중지 후 재시작
pnpm dev
```

---

## 5. 테스트

### 5.1 API 테스트
브라우저에서 개발 서버 접속 후:
1. 지갑 연결 (또는 기본 주소 사용)
2. 스킨이 생성되는지 확인
3. 새로고침 후 같은 주소로 다시 접속
4. 캐시된 스킨이 로드되는지 확인

### 5.2 Supabase 대시보드에서 확인

**데이터베이스:**
1. Table Editor → `skins` 테이블
2. 생성된 레코드 확인 (address, traits, image_url 등)

**스토리지:**
1. Storage → `skins` 버킷
2. `skins/0x...png` 파일이 업로드되었는지 확인
3. 이미지 클릭 → "Get URL" → 브라우저에서 이미지 확인

**히스토리:**
1. Table Editor → `generation_history` 테이블
2. 생성 로그 확인 (성공/실패, 에러 메시지)

---

## 6. Vercel 배포

### 6.1 환경 변수 설정
Vercel 대시보드:
1. 프로젝트 선택
2. Settings → Environment Variables
3. 다음 변수 추가:
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   NEXT_PUBLIC_SUPABASE_URL=https://...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   NEXT_PUBLIC_CONTRACT_ADDRESS=0x... (선택)
   ```

### 6.2 배포
```bash
git add .
git commit -m "feat: Supabase 기반 스킨 캐싱 시스템 구현"
git push
```

Vercel이 자동으로 배포를 시작합니다.

---

## 7. 유용한 SQL 쿼리

### 7.1 모든 스킨 조회
```sql
SELECT address, generation_method, created_at
FROM skins
ORDER BY created_at DESC;
```

### 7.2 특정 주소 스킨 조회
```sql
SELECT *
FROM skins
WHERE LOWER(address) = LOWER('0x...');
```

### 7.3 생성 히스토리 조회
```sql
SELECT address, generation_method, success, created_at
FROM generation_history
ORDER BY created_at DESC
LIMIT 100;
```

### 7.4 실패한 생성 조회
```sql
SELECT address, error_message, created_at
FROM generation_history
WHERE success = false
ORDER BY created_at DESC;
```

### 7.5 통계
```sql
-- 총 스킨 수
SELECT COUNT(*) as total_skins FROM skins;

-- AI vs 프로세듀럴 비율
SELECT generation_method, COUNT(*) as count
FROM skins
GROUP BY generation_method;

-- 성공률
SELECT
    COUNT(CASE WHEN success THEN 1 END) * 100.0 / COUNT(*) as success_rate
FROM generation_history;
```

---

## 8. Storage 관리

### 8.1 Storage 용량 확인
1. Storage 메뉴 → `skins` 버킷
2. 우측 상단에 용량 표시 확인
3. Free tier: 1GB

### 8.2 이미지 삭제 (필요시)
```typescript
import { deleteSkinImage } from '@/lib/db/client';

// 특정 이미지 삭제
await deleteSkinImage('skins/0x1234...png');
```

또는 대시보드에서:
1. Storage → `skins` 버킷
2. 파일 선택 → Delete

---

## 9. 문제 해결

### 9.1 "Missing Supabase environment variables" 에러
**원인**: 환경 변수 미설정
**해결책**:
- `.env.local` 파일에 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` 확인
- 개발 서버 재시작

### 9.2 Storage 업로드 실패
**원인**: Bucket이 public이 아니거나 Policy 미설정
**해결책**:
- Storage → `skins` 버킷 → Configuration → Public bucket 확인
- Policies 탭에서 업로드 정책 추가

### 9.3 Database 연결 오류
**원인**: 잘못된 API key 또는 URL
**해결책**:
- Settings → API에서 올바른 값 복사
- anon key 사용 (service_role key 아님!)

---

## 10. Supabase Free Tier 제한

| 리소스 | 무료 한도 |
|--------|----------|
| Database | 500MB |
| Storage | 1GB |
| Bandwidth | 2GB/월 |
| Row count | 무제한 |
| API Requests | 무제한 |

**예상 사용량** (1000명 기준):
- Database: ~10MB (메타데이터만)
- Storage: ~1GB (1MB/스킨)
- **결론**: 무료 tier로 충분!

---

## 추가 참고

- [Supabase 공식 문서](https://supabase.com/docs)
- [Supabase Storage 가이드](https://supabase.com/docs/guides/storage)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
