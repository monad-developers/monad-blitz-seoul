# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Monaminer는 Pyth Entropy를 활용한 블록체인 기반 마이닝 게임입니다. 플레이어는 다양한 NFT 채굴기를 사용하여 특정 패턴(짝수, 홀수, 소수, π 관련, 완전제곱수)의 난수를 채굴하는 게임입니다.

## Architecture

### Monorepo Structure
- `packages/hardhat/`: 스마트 컨트랙트 및 배포 스크립트
- `packages/nextjs/`: React 기반 프론트엔드 웹 애플리케이션

### Core Smart Contracts

1. **GameManager/GameManagerSimple**: 게임 라운드 관리 및 Pyth Entropy를 통한 정답 풀 생성
   - 10분 라운드 시스템
   - 5가지 패턴 타입 (EVEN, ODD, PRIME, PI, SQUARE)
   - Pyth Entropy 통합으로 안전한 난수 생성

2. **MinerNFT**: 채굴기 NFT 컨트랙트
   - 5가지 채굴기 타입 (EvenBlaster, PrimeSniper, BalancedScan, PiSniper, SquareSeeker)
   - 각 채굴기는 특화 패턴과 성공률을 가짐

3. **MiningEngine**: 실제 채굴 로직 처리
   - Pyth Entropy 기반 난수 생성
   - 배치 채굴 시스템 (3 NFT × 10개 = 30개씩)
   - 패턴 매칭 및 성공률 계산

4. **RewardManager**: 보상 분배 시스템

5. **GachaSystem**: NFT 뽑기 시스템

### Pyth Entropy Integration

프로젝트는 Pyth Network의 Entropy 서비스를 사용하여 안전한 온체인 난수를 생성합니다:
- Monad Testnet 주소: `0x36825bf3Fbdf5a29E2d5148bfe7Dcf7B5639e320`
- Provider 주소: `0x6CC14824Ea2918f5De5C2f75A9Da968ad4BD6344`

## Development Commands

### 계정 관리
```bash
yarn account:generate    # 새 배포용 계정 생성
yarn account:import      # 기존 계정 가져오기
yarn account             # 현재 계정 확인
```

### 스마트 컨트랙트 개발
```bash
yarn compile             # 컨트랙트 컴파일
yarn deploy              # Monad testnet에 배포
yarn test                # 테스트 실행
yarn lint                # ESLint 실행
yarn format              # Prettier 포맷팅
```

### 프론트엔드 개발
```bash
yarn start               # Next.js 개발 서버 시작
yarn next:build          # 프로덕션 빌드
yarn next:lint           # Next.js 린트
```

## Network Configuration

기본 배포 대상은 Monad Testnet입니다:
- Chain ID: 10143
- RPC URL: https://testnet-rpc.monad.xyz/
- Explorer: https://testnet.monadexplorer.com

## Deployment Process

1. 계정 설정: `yarn account:generate` 또는 `yarn account:import`
2. 컨트랙트 컴파일: `yarn compile`
3. 배포 실행: `yarn deploy`

배포 순서:
1. GameManagerSimple
2. MinerNFT  
3. RewardManager
4. GachaSystem
5. MiningEngine
6. 권한 설정 (Setup)

## Key Technical Details

### Pattern Matching Logic
- EVEN: number % 2 == 0
- ODD: number % 2 == 1  
- PRIME: 소수 판별 알고리즘
- PI: 314를 포함하거나 314의 배수
- SQUARE: 완전제곱수 판별

### Mining Mechanics
- TPS: 초당 50 트랜잭션 (채굴기당)
- 최대 채굴 시간: 10분
- 배치 크기: 10개 트랜잭션
- 완주 보너스: 90,000 트랜잭션 달성 시

### Success Rate Calculation
- 각 NFT는 기본 성공률을 가짐 (0.008% ~ 0.015%)
- 특화 패턴 일치 시 100% 성공률, 불일치 시 50% 성공률
- BalancedScan NFT는 모든 패턴에 동일한 성공률

## Important Files to Check When Modifying

- Contract imports: 컨트랙트 참조 시 GameManager vs GameManagerSimple 확인
- Deploy scripts: Pyth Entropy 주소가 올바른 네트워크용인지 확인  
- Pattern type references: 모든 컨트랙트에서 패턴 타입 일관성 유지