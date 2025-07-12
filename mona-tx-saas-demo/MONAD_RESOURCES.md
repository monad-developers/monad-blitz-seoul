# Monad 블록체인 개발 리소스

## 🚀 Monad란?

Monad는 뛰어난 처리량과 낮은 거래 비용을 위해 설계된 고성능 EVM 호환 Layer 1 블록체인입니다. 기존 EVM 구현의 한계를 극복하기 위해 병렬 실행 및 기타 최적화를 도입하여 개발자가 실제 세계의 수요에 대응할 수 있는 새로운 세대의 분산형 애플리케이션을 구축할 수 있도록 합니다.

### Monad의 병렬화된 EVM

Monad의 병렬화된 EVM은 개발자가 새로운 언어나 도구를 배우지 않고도 처리량을 크게 증가시키고 거래 비용을 줄여 분산형 애플리케이션에 새로운 가능성을 열어줍니다. 이는 EVM의 익숙함과 보안성을 포기하지 않고 더 빠르고 효율적인 dApps를 구축할 수 있음을 의미합니다.

## 🔗 Quick Links

- [Monad Wiki](https://www.notion.so/222c1352439b81a5af8ffddca18387e8?pvs=21)
- [Monad Developer Portal](https://developers.monad.xyz/)
- [Monad Docs](https://docs.monad.xyz/)

## 🧪 Monad Testnet 정보

### 기본 설정
- **RPC URL**: `https://testnet-rpc.monad.xyz`
- **ChainID**: `10143` (Decimal) / `0x279F` (Hex)
- **Faucet**: https://testnet.monad.xyz
- **Explorers**:
  - https://testnet.monadexplorer.com/
  - https://monad-testnet.socialscan.io/

### 표준 스마트 컨트랙트 주소

| 컨트랙트명 | 주소 |
|-----------|------|
| Multicall3 | [0xcA11bde05977b3631167028862bE2a173976CA11](https://testnet.monadexplorer.com/address/0xcA11bde05977b3631167028862bE2a173976CA11) |
| UniswapV2Factory | [0x733e88f248b742db6c14c0b1713af5ad7fdd59d0](https://testnet.monadexplorer.com/address/0x733E88f248b742db6C14C0b1713Af5AD7fDd59D0) |
| UniswapV2Router02 | [0xfb8e1c3b833f9e67a71c859a132cf783b645e436](https://testnet.monadexplorer.com/address/0xfB8e1C3b833f9E67a71C859a132cf783b645e436) |
| UniswapV3Factory | [0x961235a9020b05c44df1026d956d1f4d78014276](https://testnet.monadexplorer.com/address/0x961235a9020B05C44DF1026D956D1F4D78014276) |
| UniversalRouter | [0x3aE6D8A282D67893e17AA70ebFFb33EE5aa65893](https://testnet.monadexplorer.com/address/0x3aE6D8A282D67893e17AA70ebFFb33EE5aa65893) |
| WrappedMonad | [0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701](https://testnet.monadexplorer.com/address/0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701) |
| USDC | [0xf817257fed379853cDe0fa4F97AB987181B1E5Ea](https://testnet.monadexplorer.com/address/0xf817257fed379853cDe0fa4F97AB987181B1E5Ea) |
| USDT | [0x88b8E2161DEDC77EF4ab7585569D2415a1C1055D](https://testnet.monadexplorer.com/address/0x88b8E2161DEDC77EF4ab7585569D2415a1C1055D) |
| WBTC | [0xcf5a6076cfa32686c0Df13aBaDa2b40dec133F1d](https://testnet.monadexplorer.com/address/0xcf5a6076cfa32686c0Df13aBaDa2b40dec133F1d) |
| WETH | [0xB5a30b0FDc5EA94A52fDc42e3E9760Cb8449Fb37](https://testnet.monadexplorer.com/address/0xB5a30b0FDc5EA94A52fDc42e3E9760Cb8449Fb37) |
| CreateX | [0xba5Ed099633D3B313e4D5F7bdc1305d3c28ba5Ed](https://testnet.monadexplorer.com/address/0xba5Ed099633D3B313e4D5F7bdc1305d3c28ba5Ed) |
| Permit2 | [0x000000000022d473030f116ddee9f6b43ac78ba3](https://testnet.monadexplorer.com/address/0x000000000022D473030F116dDEE9F6B43aC78BA3) |

## 🔍 스마트 컨트랙트 검증

### Sourcify 검증기
- **Verifier URL**: https://sourcify-api-monad.blockvision.org
- **API Key**: "" (비워두기)

### Foundry로 검증
```bash
forge verify-contract \
  --rpc-url https://testnet-rpc2.monad.xyz/52227f026fa8fac9e2014c58fbf5643369b3bfc6 \
  --verifier sourcify \
  --verifier-url 'https://sourcify-api-monad.blockvision.org' \
  [contractAddress] \
  [contractFile]:[contractName]
```

### Hardhat으로 검증
```javascript
const config: HardhatUserConfig = {
  solidity: "0.8.25",
  networks: {
    'monad': {
      url: 'https://explorer.monad-testnet.category.xyz/api/eth-rpc',
      chainId: 10143
    },
  },
  sourcify: {
    enabled: true,
    apiUrl: "https://sourcify-api-monad.blockvision.org/",
    browserUrl: "https://testnet.monadexplorer.com/"
  },
  etherscan: {
    enabled: false,
  }
};
```

```bash
npx hardhat verify \
  --network monad \
  0xa6aD802896dAbEf770Cfd470Ea72172f66217681 \
  [...constructorArgs]
```

## ⛽️ 가스 및 트랜잭션 권장사항

### 가스 가격 설정
- **최소 가스 가격**: `50 gwei` (MON 기준)
- 더 높게 설정할 수 있지만 일반적으로 필요하지 않음

### 최적화된 API 호출
- 트랜잭션 영수증 조회: `eth_getBlockReceipts` 사용 (블록 내 모든 트랜잭션 영수증을 한 번에 조회)
- 블록 내 트랜잭션 상세 정보: `eth_getBlockByNumber(number, hydrated=True)` 사용
- 트랜잭션 추적: `debug_traceBlockByNumber` 사용 (블록 내 모든 트랜잭션 추적을 한 번에 조회)

## 🛠️ 개발 도구

### Monad MCP (커뮤니티 개발)
- **URL**: https://monad-mcp-tau.vercel.app/
- **설치 방법**:
  1. Settings > Cursor settings > MCP > Add new global MCP server
  2. 다음 설정 추가:
  ```json
  {
    "mcpServers": {
      "monad-mcp": {
        "url": "https://monad-mcp-tau.vercel.app/sse"
      }
    }
  }
  ```

## 🔐 계정 추상화 / 소셜 로그인

### Privy
- [트랜잭션 전송](https://docs.privy.io/wallets/using-wallets/ethereum/send-a-transaction)
- [Monad에서 트랜잭션 스폰서링](https://docs.privy.io/wallets/gas-and-asset-management/gas/ethereum) (Monad Testnet 설정 필요)
- [Privy API 참조](https://docs.privy.io/api-reference/introduction)

### Pimlico
- [Pimlico 가이드](https://docs.pimlico.io/guides/tutorials/tutorial-1)
- [Privy와 Pimlico 연동](https://docs.pimlico.io/guides/how-to/signers/privy)

## 🌉 크로스체인

### Chainlink CCIP
- [CCIP Lanes Monad Testnet](https://docs.chain.link/ccip/directory/testnet/chain/monad-testnet)
- [CCIP 시작하기](https://docs.chain.link/ccip/getting-started)

### LayerZero
- [LayerZero 배포](https://docs.layerzero.network/v2/deployments/deployed-contracts)
- [LayerZero 시작하기](https://docs.layerzero.network/v2/developers/evm/getting-started)

## 📊 인덱서

- [Envio HyperIndex 사용](https://docs.monad.xyz/guides/indexers/tg-bot-using-envio)
- [QuickNode streams 가이드](https://docs.monad.xyz/guides/indexers/quicknode-streams)

## 🔌 APIs

### NFT API
- [NFT Holders](https://docs.codex.io/reference/nftholders)
- [Wallet NFT Collections](https://docs.codex.io/reference/walletnftcollections)
- [NFT Collection Metadata](https://docs.codex.io/reference/getnftcollectionmetadata)
- [Alchemy NFT API](https://www.alchemy.com/docs/reference/nft-api-quickstart)

### 포트폴리오 API
- [Get wallet's portfolio](https://developers.zerion.io/reference/getwalletportfolio)
- [Get list of wallet's transactions](https://developers.zerion.io/reference/listwallettransactions)
- [Get wallet's NFT portfolio](https://developers.zerion.io/reference/getwalletnftportfolio)
- [Alchemy Portfolio API](https://www.alchemy.com/docs/reference/portfolio-apis)
- [Alchemy Token API](https://www.alchemy.com/docs/reference/token-api-quickstart)
- [Alchemy Webhooks](https://www.alchemy.com/docs/reference/notify-api-quickstart)

## 🔮 오라클

### Chainlink
- [Chainlink Data Streams](https://docs.chain.link/data-streams)

### Pyth
- [Pyth Price Feeds](https://www.pyth.network/developers/price-feed-ids)
- [Pyth Beta Price Feeds](https://www.pyth.network/developers/price-feed-ids#beta)
- [Pyth Oracle Addresses](https://docs.pyth.network/price-feeds/contract-addresses/evm)

## 💼 지갑 커넥터

- [Reown Wallet Connector 사용](https://docs.monad.xyz/guides/reown-guide)

## 📚 학습 리소스

### Solidity 학습
- [CryptoZombies](https://cryptozombies.io/en/course) - 좀비 게임을 만들며 Solidity 학습
- [Solidity by example](https://solidity-by-example.org/)
- [Blockchain Basics course by Cyfrin](https://updraft.cyfrin.io/courses/blockchain-basics)
- [Solidity Smart Contract Development Course by Cyfrin](https://updraft.cyfrin.io/courses/solidity)
- [Foundry Fundamentals Development Course by Cyfrin](https://updraft.cyfrin.io/courses/foundry) - 최고의 스마트 컨트랙트 개발 도구
- [Rareskills Blog](https://www.rareskills.io/category/solidity) - Solidity 코딩 실습과 패턴 학습
- [Openzeppelin Smart Contracts](https://www.openzeppelin.com/solidity-contracts) - 가장 검증된 스마트 컨트랙트 라이브러리
- [Ethernaut](https://ethernaut.openzeppelin.com/) - Solidity 퍼즐

### DeFi 학습
- [Awesome Stablecoins](https://github.com/sdtsui/awesome-stablecoins) - 스테이블코인에 대한 모든 것
- [Awesome Decentralized Finance](https://github.com/ong/awesome-decentralized-finance) - DeFi 리소스 모음
- [DeFi MooC](https://defi-learning.org/f22) - 실습이 포함된 최고의 DeFi 과정

### EVM 학습
- [EVM: From Solidity to byte code, memory and storage](https://www.youtube.com/watch?v=RxL_1AfV7N4)
- [Ethereum EVM illustrated](https://takenobu-hs.github.io/downloads/ethereum_evm_illustrated.pdf)
- [EVM Deep Dives Series](https://noxx.substack.com/p/evm-deep-dives-the-path-to-shadowy)
- [Understanding Ethereum Smart Contract Storage](https://programtheblockchain.com/posts/2018/03/09/understanding-ethereum-smart-contract-storage/)
- [EVM.codes](https://www.evm.codes/) - EVM opcodes 상세 정보

## 🔬 Monad 내부 구조

- [Monad BFT Consensus](https://docs.monad.xyz/monad-arch/consensus/monad-bft)
- [Asynchronous Execution](https://docs.monad.xyz/monad-arch/consensus/asynchronous-execution)
- [Parallel Execution](https://docs.monad.xyz/monad-arch/execution/parallel-execution)
- [MonadDB](https://docs.monad.xyz/monad-arch/execution/monaddb)

## 📖 추가 리소스

- [Additional Resources](https://www.notion.so/Additional-Resources-222c1352439b8172b4f9c1e549ffac09?pvs=21)

---

> **참고**: 이 문서는 Monad 블록체인 개발을 위한 종합적인 리소스 가이드입니다. 각 링크를 통해 더 자세한 정보를 확인할 수 있습니다. 