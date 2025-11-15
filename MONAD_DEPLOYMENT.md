# Monad Testnet 배포 가이드

## Monad Testnet 정보

- **Chain ID**: 10143
- **Network Name**: Monad Testnet
- **Currency Symbol**: MON
- **RPC URL**: https://testnet-rpc.monad.xyz
- **Block Explorer (BlockVision)**: https://testnet.monadexplorer.com
- **Block Explorer (Etherscan)**: https://testnet.monadscan.com/

## 1. 환경 설정

### 1.1 환경 변수 파일 생성

`.env.example`을 복사하여 `.env` 파일 생성:

```bash
cp .env.example .env
```

### 1.2 필수 환경 변수 설정

`.env` 파일을 열어 다음 값들을 설정:

```bash
# Monad Testnet RPC
MONAD_TESTNET_RPC_URL=https://testnet-rpc.monad.xyz

# 배포용 Private Key
PRIVATE_KEY=your_private_key_here

# Pinata IPFS (https://pinata.cloud에서 발급)
NEXT_PUBLIC_PINATA_JWT=your_pinata_jwt
NEXT_PUBLIC_PINATA_GATEWAY=your_gateway_url

# WalletConnect (https://cloud.walletconnect.com에서 발급)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id

# Monad Testnet 토큰 주소 (실제 주소로 업데이트 필요)
MONAD_USDT_ADDRESS=your_monad_usdt_address
MONAD_USDC_ADDRESS=your_monad_usdc_address

# 배포 후 자동으로 설정됨
NEXT_PUBLIC_CONTRACT_ADDRESS=
NEXT_PUBLIC_CHAIN_ID=10143
```

### 1.3 토큰 주소 설정

Monad Testnet의 실제 USDT/USDC 토큰 주소를 확인하고 `.env` 파일과 `src/config/monad.ts`에 설정하세요.

## 2. 스마트 컨트랙트 배포

### 2.1 컴파일

```bash
pnpm compile
```

### 2.2 Monad Testnet 배포

```bash
pnpm deploy:monad
```

배포 스크립트는 자동으로:
1. Chainlink Price Feeds 주소 로드 (`src/config/monad.ts`에서)
2. MinecraftPFPWithWealth 컨트랙트 배포
3. 배포 정보를 `deployments/` 폴더에 저장

### 2.3 배포 결과 확인

배포가 완료되면 다음 정보가 출력됩니다:

```
✅ Contract deployed to: 0x...
📋 설정 정보:
  ETH/USD Feed: 0x0c76859E85727683Eeba0C70Bc2e0F5781337818
  USDT/USD Feed: 0x14eE6bE30A91989851Dc23203E41C804D4D71441
  USDC/USD Feed: 0x70BB0758a38ae43418ffcEd9A25273dd4e804D15
  USDT: 0x...
  USDC: 0x...
```

**중요**: 출력된 컨트랙트 주소를 `.env` 파일의 `NEXT_PUBLIC_CONTRACT_ADDRESS`에 설정하세요.

### 2.4 Chainlink Price Feeds

Monad Testnet에는 실제 Chainlink Price Feeds가 배포되어 있습니다:

- **ETH/USD**: `0x0c76859E85727683Eeba0C70Bc2e0F5781337818`
- **USDT/USD**: `0x14eE6bE30A91989851Dc23203E41C804D4D71441`
- **USDC/USD**: `0x70BB0758a38ae43418ffcEd9A25273dd4e804D15`
- **BTC/USD**: `0x2Cd9D7E85494F68F5aF08EF96d6FD5e8F71B4d31`
- **LINK/USD**: `0x4682035965Cd2B88759193ee2660d8A0766e1391`

자세한 설정은 `src/config/monad.ts` 파일을 참조하세요.

### 2.4 컨트랙트 검증 (선택사항)

```bash
pnpm verify:monad <CONTRACT_ADDRESS> <ETH_FEED> <USDT_FEED> <USDC_FEED> <USDT> <USDC>
```

## 3. 프론트엔드 실행

### 3.1 개발 모드 실행

```bash
pnpm dev
```

http://localhost:3000 에서 확인

### 3.2 프로덕션 빌드

```bash
pnpm build
pnpm start
```

## 4. MetaMask Monad Testnet 추가

사용자가 지갑을 연결하려면 MetaMask에 Monad Testnet을 추가해야 합니다:

1. MetaMask 열기
2. 네트워크 드롭다운 클릭
3. "Add Network" 선택
4. 다음 정보 입력:
   - **Network Name**: Monad Testnet
   - **New RPC URL**: https://testnet-rpc.monad.xyz
   - **Chain ID**: 10143
   - **Currency Symbol**: MON
   - **Block Explorer URL**: https://testnet.monadexplorer.com

## 5. 테스트

### 5.1 스마트 컨트랙트 테스트

```bash
pnpm test:contracts
```

### 5.2 타입 체크

```bash
pnpm typecheck
```

## 6. 주의사항

### 6.1 Chainlink Price Feeds

Monad Testnet에는 실제 Chainlink Price Feeds가 배포되어 있어 실시간 가격 데이터를 제공합니다.

지원되는 Price Feeds:
- **ETH/USD**, **BTC/USD**, **LINK/USD**
- **USDT/USD**, **USDC/USD**
- **SOL/USD**, **DOGE/USD**, **PEPE/USD**

모든 주소는 `src/config/monad.ts`에 정의되어 있습니다.

### 6.2 USDT/USDC 토큰

Monad Testnet의 실제 USDT/USDC 토큰 주소를 확인하고 설정하세요:

1. `.env` 파일의 `MONAD_USDT_ADDRESS`, `MONAD_USDC_ADDRESS` 업데이트
2. 또는 `src/config/monad.ts` 파일에서 직접 수정
3. 토큰 주소 변경 시 컨트랙트 재배포 필요

### 6.3 가격 데이터

Chainlink Price Feeds는 실시간 가격을 제공합니다. 가격 업데이트는 Chainlink 네트워크에서 자동으로 처리됩니다.

## 7. 문제 해결

### RPC 연결 실패

- RPC URL이 올바른지 확인
- Monad Testnet이 정상 작동 중인지 확인
- 방화벽/VPN 설정 확인

### 트랜잭션 실패

- 계정에 충분한 MON이 있는지 확인
- Gas Price 설정 확인
- 네트워크 혼잡도 확인

### 메타데이터 표시 안됨

- IPFS 업로드가 성공했는지 확인
- Pinata JWT가 올바른지 확인
- CORS 설정 확인

## 8. 유용한 링크

- Monad 공식 문서: https://docs.monad.xyz
- Monad Discord: https://discord.gg/monad
- Monad Testnet Faucet: (사용 가능 시 링크 추가)

## 9. 배포 체크리스트

- [ ] `.env` 파일 생성 및 설정
- [ ] Pinata JWT 발급 및 설정
- [ ] WalletConnect Project ID 발급 및 설정
- [ ] Private Key 설정 (테스트용 지갑 권장)
- [ ] 스마트 컨트랙트 컴파일 성공
- [ ] Monad Testnet 배포 성공
- [ ] 컨트랙트 주소 `.env`에 저장
- [ ] 프론트엔드 실행 확인
- [ ] MetaMask 연결 테스트
- [ ] NFT 민팅 테스트
- [ ] IPFS 업로드 확인
- [ ] 메타데이터 표시 확인
