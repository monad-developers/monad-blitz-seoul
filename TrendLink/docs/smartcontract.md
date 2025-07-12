# 스마트컨트랙트 명세

## 스마트컨트랙트 스택 (온체인)

| 항목 | 기술 | 설명 |
|------|------|------|
| 언어 | Solidity (>=0.8.19) | 최신 문법 지원 (custom errors, gas 최적화 등) |
| CCIP 연동 | @chainlink/contracts-ccip | 검색 데이터 온체인 기록 및 보상 트리거 |
| 기본 라이브러리 | @openzeppelin/contracts | Ownable, AccessControl, 이벤트 관리 등 |

## 주요 함수/이벤트 구조

- logSearch()
- distributeReward()
- setRewardPolicy()
- setRewardToken()
- receiveCCIPMessage()
- withdraw()

각 함수별 이벤트:
- event SearchLogged
- event RewardDistributed
- event PolicyUpdated
- event TokenUpdated
- event MessageReceived
- event TokenWithdrawn
