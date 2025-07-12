# Actix를 기반으로 한 백엔드

sqlite3 wallet.db "CREATE TABLE test (id INTEGER);"

## 파일 DB 예시

### curl 예시
curl -X POST -F "file=@/path/to/your/file.jpg" https://monad.newjeans.cloud/upload

### 응답 예시(json)
{"url": "https://monad.newjeans.cloud/uploads/[uuid].jpg"}

### 파일이 여러개면?

{
  "urls": [
    "https://monad.newjeans.cloud/uploads/12345678-1234-5678-9abc-123456789abc.jpg",
    "https://monad.newjeans.cloud/uploads/87654321-4321-8765-cba9-987654321cba.png",
    "https://monad.newjeans.cloud/uploads/11111111-2222-3333-4444-555555555555.pdf"
  ]
}

## 지갑 주소 db

### 1. 지갑 주소 추가
```bash
curl -X POST https://monad.newjeans.cloud/wallets \
  -H "Content-Type: application/json" \
  -d '{"address": "0x742d35Cc6635C0532925a3b8D387529269DC8600"}'
```

### 2. 모든 지갑 주소 조회
```bash
curl https://monad.newjeans.cloud/wallets
```

### 3. 파일 업로드
```bash
curl -X POST https://monad.newjeans.cloud/upload \
  -F "file=@your-file.jpg"
```

### 4. 헬스체크
```bash
curl https://monad.newjeans.cloud/health
