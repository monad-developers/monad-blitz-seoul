# CCIP Message ID 마이그레이션 가이드

## 문제 설명

기존 코드에서는 CCIP 메시지 전송 후 **트랜잭션 해시**를 CCIP messageId로 저장했습니다. 하지만 실제 CCIP messageId는 **CCIP Router의 CCIPSent 이벤트**에서 발생하는 별도의 값입니다.

### 차이점
- **트랜잭션 해시**: 0x로 시작하고 64자 (Sepolia에서 발생)
- **CCIP messageId**: 0x로 시작하고 64자 (CCIP Router 이벤트에서 발생) - 다른 값!

이로 인해 `/api/ccip/monitor/[messageId]` 호출 시 "Message not found" 에러가 발생했습니다.

## 해결 방법

### 1. 특정 트랜잭션에서 CCIP 레코드 추가

txhash가 DB에 없는 경우, 트랜잭션에서 정보를 추출해서 추가할 수 있습니다:

```bash
pnpm add:ccip-record
```

**대화형 프로세스:**
1. Sepolia 트랜잭션 해시 입력
2. 트랜잭션 정보 자동 추출:
   - ✅ CCIP messageId (CCIPSent 이벤트에서)
   - ✅ Attestation ID (함수 input에서)
   - ✅ Monad Address (트랜잭션 from 주소)
3. 수동 입력 필요:
   - 📝 Sepolia NFT 컨트랙트 주소
   - 📝 Sepolia Token ID
4. 확인 후 DB에 저장

**예시:**
```bash
$ pnpm add:ccip-record

🚀 CCIP 레코드 추가 (트랜잭션 해시로부터)

📝 Sepolia 트랜잭션 해시를 입력하세요: 0x9cbf3c7dfc7bf2e94bf1a10bc219a2a07b43aebd7e486257df351423ffc17aae
🔍 트랜잭션 조회 중...
✅ 트랜잭션 found
   From: 0x1234...
   To: 0xABCD...

📋 Receipt 조회 중...
✅ CCIPSent 이벤트 found
   Message ID: 0x1a2b3c4d...
   Receiver: 0xXYZ...

📋 다음 정보를 입력하세요:

📝 Sepolia NFT Contract Address: 0x583aeA758A94d74bA997326634B23a2Ea6f4e005
📝 Sepolia Token ID: 42

📊 추가할 레코드 요약:
============================================================
Monad Address: 0x1234...
Sepolia NFT Contract: 0x583aeA758A94d74bA997326634B23a2Ea6f4e005
Sepolia Token ID: 42
CCIP Message ID: 0x1a2b3c4d...
Attestation ID: 0x5678...
Sepolia TX Hash: 0x9cbf3c7d...
============================================================

✅ 이 정보로 DB에 추가하시겠습니까? (yes/no): yes

💾 데이터베이스에 추가 중...
✅ 레코드가 성공적으로 추가되었습니다!
📌 Record ID: 1
모니터링 URL: http://localhost:3000/api/ccip/monitor/0x1a2b3c4d...
```

### 2. 마이그레이션 스크립트 실행

모든 기존 레코드를 한 번에 마이그레이션하려면:

```bash
pnpm migrate:ccip-message-ids
```

이 스크립트는:
1. 데이터베이스의 모든 `ccip_attestations` 레코드를 조회
2. 각 트랜잭션 해시를 사용하여 Sepolia RPC에서 receipt 조회
3. CCIPSent 이벤트에서 실제 CCIP messageId 추출
4. 데이터베이스의 `ccip_message_id` 컬럼 업데이트

### 3. 진행 상황 확인 (마이그레이션 스크립트)

마이그레이션 스크립트 실행 중 다음과 같은 출력을 볼 수 있습니다:

```
🚀 CCIP Message ID 마이그레이션 시작...

📋 데이터베이스에서 모든 CCIP attestations 조회 중...
✅ 5개의 레코드를 찾았습니다.

🔍 레코드 ID: 1
   TX Hash: 0x9cbf3c7d...
   Current Message ID: 0x9cbf3c7d...
   ✅ 실제 CCIP Message ID: 0x1a2b3c4d...
   🔄 데이터베이스 업데이트 중...
   ✅ 업데이트 완료!

...

📊 마이그레이션 완료!
   ✅ 업데이트됨: 3개
   ⏭️  건너뜀: 2개
   📝 총: 5개
```

### 4. 검증

마이그레이션/추가 후 monitor API가 정상 작동하는지 확인:

```bash
curl "http://localhost:3000/api/ccip/monitor/0x<실제_CCIP_messageId>"
```

정상 응답 예시:
```json
{
  "messageId": "0x1a2b3c4d...",
  "status": "pending",
  "progress": 25,
  "estimatedTime": "15-30 minutes",
  "monadAddress": "0x...",
  ...
}
```

## 주요 변경 사항

### 1. check-sepolia-nft API 수정
- **이전**: `tokenOfOwnerByIndex` (지원하지 않음) → 빈 배열 반환
- **이후**: `tokensOfOwner` (MonadPenguins의 커스텀 함수) 사용 → 정상 토큰 ID 반환

### 2. SepoliaNFTVerification.tsx 수정
- **이전**: `bridgeHash`를 CCIP messageId로 직접 사용
- **이후**: CCIPSent 이벤트에서 실제 CCIP messageId 추출 후 저장

### 3. 마이그레이션 스크립트 추가
- `scripts/migrate-ccip-message-ids.ts`: 기존 데이터 자동 업데이트

## 트러블슈팅

### "트랜잭션을 찾을 수 없습니다" 메시지
- **원인**: RPC 노드 지연 또는 트랜잭션이 삭제됨
- **해결**: 나중에 다시 실행하거나 RPC URL 확인

### "CCIPSent 이벤트를 찾을 수 없습니다"
- **원인**: 컨트랙트 배포 후 트랜잭션이 실패한 경우
- **해결**: 트랜잭션 receipt 수동 확인 후 messageId 직접 입력

### Supabase 연결 오류
- **원인**: 환경 변수 누락
- **해결**: `.env.local`에서 다음 확인:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`

## 스크립트 활용 시나리오

### 시나리오 1: 새로운 CCIP 트랜잭션 추가
```bash
pnpm add:ccip-record
```
- txhash를 통해 새로운 레코드 추가
- 자동으로 CCIP messageId와 attestationId 추출
- 일회성 추가에 유용

### 시나리오 2: 기존 레코드 일괄 마이그레이션
```bash
pnpm migrate:ccip-message-ids
```
- 모든 기존 레코드에서 txhash가 있는 경우만 처리
- CCIP messageId 자동 업데이트
- 백업/복구 시나리오에 유용

## 향후 개선사항

- [ ] 시간 기반 자동 마이그레이션 (cron job)
- [ ] 데이터베이스 트리거로 자동 정정
- [ ] 모니터링 대시보드 추가
- [ ] 배치 처리 (여러 txhash 한번에 추가)
- [ ] GraphQL API로 txhash 조회
