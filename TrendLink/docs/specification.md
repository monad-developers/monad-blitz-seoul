# 기능명세서

## 스마트컨트랙트 구현 기능 명세

### 1. 검색 로그 기록
- 검색 요청/보상 분배 트랜잭션이 발생할 때 로그를 온체인에 기록
- 로그에는 user, platform, widget(운영자), keyword, timestamp 등 포함
- 투명하고 불변한 검색 데이터 저장

### 2. 보상 분배 (3자 분배)
- 검색 1건마다 보상액을 user, platform, widget(운영자)에게 자동 분배
- 보상 비율(예: user 30%, platform 40%, widget 30%)은 정책에 따라 변경 가능
- 보상 토큰(ERC20 등) 자동 전송

### 3. 보상 정책/비율/토큰 관리
- 보상 비율(user, platform, widget) 및 토큰 주소를 관리자가 변경 가능
- 유연한 보상 정책 운영
- (옵션) DAO 거버넌스 연동 가능

### 4. CCIP 메시지 수신
- CCIP를 통해 온 메시지(검색 로그, 보상 데이터 등) 수신 및 처리
- 메시지 인증(송신자 검증) 필요
- 크로스체인 데이터 안전 전송

### 5. 이벤트 기록
- 검색 로그, 보상 분배 등 주요 액션마다 이벤트 발생
- 오프체인 대시보드/분석에 활용
- 실시간 모니터링 지원

### 6. 잔여 토큰 관리
- 운영자가 컨트랙트에 남은 토큰을 인출할 수 있는 함수
- 토큰 유동성 관리 및 운영 효율성 확보

## 기능별 함수/이벤트 구조

| 기능                | 함수 예시                    | 이벤트 예시                |
|---------------------|------------------------------|----------------------------|
| 검색 로그 기록      | logSearch()                  | event SearchLogged         |
| 보상 분배           | distributeReward()           | event RewardDistributed    |
| 보상 정책 관리      | setRewardPolicy()            | event PolicyUpdated        |
| 토큰 관리           | setRewardToken()             | event TokenUpdated         |
| CCIP 메시지 수신    | receiveCCIPMessage()         | event MessageReceived      |
| 잔여 토큰 인출      | withdraw()                   | event TokenWithdrawn       |
