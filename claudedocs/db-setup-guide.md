# 데이터베이스 설정 가이드

## 1. Vercel Postgres 설정

### 1.1 Vercel 대시보드에서 Postgres 생성
```bash
# Vercel CLI 사용
vercel postgres create
```

또는 Vercel 대시보드에서:
1. 프로젝트 선택
2. Storage 탭 → Create Database
3. Postgres 선택
4. 데이터베이스 이름 입력 및 생성

### 1.2 환경 변수 자동 설정
Vercel이 자동으로 다음 환경 변수를 추가합니다:
- `POSTGRES_URL`
- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL_NON_POOLING`
- `POSTGRES_USER`
- `POSTGRES_HOST`
- `POSTGRES_PASSWORD`
- `POSTGRES_DATABASE`

### 1.3 로컬 개발 환경 설정
```bash
# Vercel 대시보드에서 환경 변수 복사
# .env.local 파일에 붙여넣기
cp .env.local.example .env.local
# 그리고 실제 값으로 수정
```

---

## 2. Vercel Blob Storage 설정

### 2.1 Vercel 대시보드에서 Blob 생성
```bash
# Vercel CLI 사용
vercel blob create
```

또는 Vercel 대시보드에서:
1. 프로젝트 선택
2. Storage 탭 → Create Store
3. Blob 선택
4. 스토어 이름 입력 및 생성

### 2.2 환경 변수 자동 설정
Vercel이 자동으로 다음 환경 변수를 추가합니다:
- `BLOB_READ_WRITE_TOKEN`

---

## 3. 데이터베이스 초기화

### 3.1 SQL 스키마 실행
1. Vercel 대시보드 → Postgres 데이터베이스 선택
2. Query 탭 클릭
3. `src/lib/db/schema.sql` 파일 내용 복사
4. Query 창에 붙여넣기 후 실행

또는 프로그래매틱 방식:
```typescript
// 한 번만 실행 (초기화용)
import { initializeDatabase } from '@/lib/db/client';

await initializeDatabase();
```

### 3.2 테이블 확인
```sql
-- 테이블 목록 확인
SELECT * FROM information_schema.tables
WHERE table_schema = 'public';

-- skins 테이블 구조 확인
\d skins

-- generation_history 테이블 구조 확인
\d generation_history
```

---

## 4. 테스트

### 4.1 데이터베이스 연결 테스트
```typescript
import { sql } from '@vercel/postgres';

const result = await sql`SELECT NOW()`;
console.log('Database connected:', result.rows[0]);
```

### 4.2 스킨 저장 테스트
```typescript
import { saveSkin } from '@/lib/db/client';

await saveSkin({
    address: '0x1234567890123456789012345678901234567890',
    traits: { /* ... */ },
    imageUrl: 'https://blob.vercel-storage.com/...',
    blobPathname: 'skins/0x1234.png',
    method: 'ai',
});
```

### 4.3 스킨 조회 테스트
```typescript
import { getSkinByAddress } from '@/lib/db/client';

const skin = await getSkinByAddress('0x1234567890123456789012345678901234567890');
console.log('Cached skin:', skin);
```

---

## 5. 문제 해결

### 5.1 데이터베이스 연결 오류
```
Error: connect ECONNREFUSED
```
**해결책:**
- `.env.local` 파일에 `POSTGRES_URL` 확인
- Vercel 대시보드에서 환경 변수 재확인
- 로컬 개발 서버 재시작

### 5.2 Blob 업로드 오류
```
Error: Unauthorized
```
**해결책:**
- `.env.local` 파일에 `BLOB_READ_WRITE_TOKEN` 확인
- 토큰이 만료되지 않았는지 확인
- Vercel 대시보드에서 토큰 재생성

### 5.3 테이블이 존재하지 않음
```
Error: relation "skins" does not exist
```
**해결책:**
- `schema.sql` 실행 확인
- 또는 `initializeDatabase()` 함수 실행

---

## 6. 프로덕션 배포

### 6.1 환경 변수 확인
Vercel 대시보드 → Settings → Environment Variables
- `ANTHROPIC_API_KEY` ✅
- `POSTGRES_URL` ✅ (자동)
- `BLOB_READ_WRITE_TOKEN` ✅ (자동)
- `NEXT_PUBLIC_CONTRACT_ADDRESS` ✅

### 6.2 배포
```bash
git add .
git commit -m "feat: DB 기반 스킨 캐싱 시스템 구현"
git push
vercel --prod
```

### 6.3 배포 후 확인
1. 프로덕션 URL 접속
2. 스킨 생성 테스트
3. Vercel 대시보드 → Postgres → Data 탭에서 레코드 확인
4. Vercel 대시보드 → Blob → Files 탭에서 이미지 확인

---

## 7. 유용한 SQL 쿼리

### 7.1 모든 스킨 조회
```sql
SELECT address, generation_method, created_at
FROM skins
ORDER BY created_at DESC;
```

### 7.2 생성 히스토리 조회
```sql
SELECT address, generation_method, success, created_at
FROM generation_history
ORDER BY created_at DESC
LIMIT 100;
```

### 7.3 실패한 생성 조회
```sql
SELECT address, error_message, created_at
FROM generation_history
WHERE success = false
ORDER BY created_at DESC;
```

### 7.4 통계
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
