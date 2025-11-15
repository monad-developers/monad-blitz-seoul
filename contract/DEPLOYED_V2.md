# OXGameV2 배포 정보 (5초 주기 메커니즘)

## ✅ 배포 완료

**배포 시간**: 2025-11-15T06:11:48.150Z

## 컨트랙트 주소

```json
{
  "network": "monad-testnet",
  "chainId": 10143,
  "deployer": "0xAeeAB5F3bBAA0B5778815090b59a6437D1B00Cf4",
  "contracts": {
    "OXGameV2": "0xd7DB3033F906771c37d54548267b61481e6CfbE9",
    "Oracle": "0xAeeAB5F3bBAA0B5778815090b59a6437D1B00Cf4"
  },
  "configuration": {
    "depositAmount": "1.0 MON",
    "maxPlayers": "10",
    "roundDuration": "5 seconds"
  }
}
```

## 핵심 기능 변경사항

### V1과의 차이점

| 기능 | V1 | V2 |
|------|----|----|
| 라운드 시작 | Oracle이 질문과 정답 설정 | **5초마다 자동 시작** |
| 정답 처리 | submitAnswer 시 즉시 | **다음 라운드 시작 시 일괄 처리** |
| 플레이어 답변 | 언제든지 가능 | **5초 이내 필수** |
| 미제출자 | 기회 유지 | **자동 탈락** |

### 새로운 메커니즘

1. **5초 주기 반복**
   ```
   T=0s: 라운드 1 시작 (기준 가격: $3,500)
   T=0-5s: 플레이어 답변 제출
   T=5s: 라운드 1 종료 + 라운드 2 시작
         - 현재 가격 $3,499 → 정답: X (하락)
         - 오답자 및 미제출자 탈락
         - 새 기준 가격: $3,499
   T=10s: 라운드 2 종료 + 라운드 3 시작
   ...계속 반복
   ```

2. **processRound() 함수**
   ```solidity
   function processRound(ChainType _chainType, bool _previousAnswer)
       external onlyOracle
   ```
   - Oracle이 5초마다 호출
   - 이전 라운드 정답 처리 + 새 라운드 시작

3. **자동 탈락**
   - 5초 이내 미제출 → 탈락
   - 오답 → 탈락
   - 시간 초과 후 제출 → 탈락

## 탐색기

컨트랙트 확인: https://testnet.monadexplorer.com/address/0xd7DB3033F906771c37d54548267b61481e6CfbE9

## 백엔드 환경 변수

```env
# Monad Testnet
MONAD_RPC_URL=https://testnet-rpc.monad.xyz
CHAIN_ID=10143

# Smart Contract
OXGAME_V2_ADDRESS=0xd7DB3033F906771c37d54548267b61481e6CfbE9
ORACLE_PRIVATE_KEY=185e528d8777c22f32c8b1db4c11f2a38f3af24e294c1e7e774506c787a740a4

# Chainlink Data Streams (Testnet)
CHAINLINK_ETH_FEED_ID=...
CHAINLINK_LINK_FEED_ID=...
CHAINLINK_BTC_FEED_ID=...
```

## 프론트엔드 환경 변수

```env
NEXT_PUBLIC_OXGAME_V2_ADDRESS=0xd7DB3033F906771c37d54548267b61481e6CfbE9
NEXT_PUBLIC_ORACLE_ADDRESS=0xAeeAB5F3bBAA0B5778815090b59a6437D1B00Cf4
NEXT_PUBLIC_CHAIN_ID=10143
NEXT_PUBLIC_RPC_URL=https://testnet-rpc.monad.xyz
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3002
```

## 백엔드 Oracle 스케줄러

### 필수 구현사항

```typescript
// backend/src/oracle/oracle.scheduler.ts
@Injectable()
export class OracleScheduler {
  private lastPrices: Map<ChainType, number> = new Map();

  // 5초마다 실행
  @Cron('*/5 * * * * *')
  async executeRounds() {
    console.log('[Oracle] Executing 5-second round...');

    for (const chainType of [ChainType.ETH, ChainType.LINK, ChainType.BTC]) {
      await this.processRound(chainType);
    }
  }

  async processRound(chainType: ChainType) {
    // 1. 현재 가격 조회
    const currentPrice = await this.chainlinkService.getLatestPrice(chainType);

    // 2. 이전 라운드 정답 계산
    const previousPrice = this.lastPrices.get(chainType);
    let answer = null;

    if (previousPrice) {
      answer = currentPrice > previousPrice; // 상승: true, 하락: false
    }

    // 3. 스마트 컨트랙트 호출
    if (answer !== null) {
      await this.blockchainService.processRound(chainType, answer);
    }

    // 4. 다음 라운드를 위해 현재 가격 저장
    this.lastPrices.set(chainType, currentPrice);

    // 5. WebSocket 브로드캐스트
    this.gameService.broadcast({
      event: 'round-update',
      data: {
        chainType,
        previousPrice,
        currentPrice,
        answer
      }
    });
  }
}
```

## ABI 위치

```
contract/artifacts/contracts/OXGameV2.sol/OXGameV2.json
```

## 컨트랙트 검증 (선택사항)

```bash
npx hardhat verify \
  --network monad \
  0xd7DB3033F906771c37d54548267b61481e6CfbE9 \
  0xAeeAB5F3bBAA0B5778815090b59a6437D1B00Cf4
```

## 테스트 시나리오

1. **플레이어 참여**
   ```bash
   # 프론트엔드에서
   contract.joinPool(ChainType.ETH, { value: '1000000000000000000' })
   ```

2. **Oracle 5초 주기 시작**
   ```bash
   # 백엔드에서
   npm run start:dev
   # 자동으로 5초마다 processRound 호출
   ```

3. **플레이어 답변**
   ```bash
   # 5초 이내
   contract.submitAnswer(ChainType.ETH, true) // O
   ```

4. **결과 확인**
   - 5초 후 자동으로 정답 처리
   - 오답자/미제출자 탈락
   - 새 라운드 즉시 시작

## 주의사항

1. **Oracle 다운타임**
   - 백엔드가 중단되면 게임도 중단됨
   - 백엔드 모니터링 및 자동 재시작 필수

2. **가스 비용**
   - 5초마다 트랜잭션 발생
   - Monad의 저렴한 가스비 활용

3. **시간 동기화**
   - 서버 시간과 블록체인 시간 차이 고려
   - block.timestamp 기반 검증

4. **네트워크 지연**
   - 플레이어가 5초 내 제출해도 네트워크 지연으로 실패 가능
   - 프론트엔드에서 4초에 자동 제출 권장

## 다음 단계

1. ✅ 스마트 컨트랙트 V2 배포 완료
2. ⏳ 백엔드 NestJS 프로젝트 생성
3. ⏳ Chainlink Data Streams 연동
4. ⏳ 5초 Oracle 스케줄러 구현
5. ⏳ 프론트엔드 Next.js 프로젝트 생성
6. ⏳ 실시간 차트 및 게임 UI
7. ⏳ 통합 테스트
