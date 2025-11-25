# Minecraft Style PFP NFT 프로젝트

## 📋 프로젝트 개요

**프로젝트명**: Minecraft Style PFP NFT with Dynamic Wealth-Based Traits

**핵심 컨셉**:
- 사용자의 EVM 주소를 기반으로 결정론적(deterministic)으로 생성되는 마인크래프트 스킨 스타일의 PFP NFT
- 64x64 픽셀 PNG 이미지를 Three.js로 3D 렌더링
- 사용자의 자산 가치(ETH + USDT + USDC)에 따라 특별 아이템 부여
- 애니메이션 GIF 형태로 IPFS에 저장

---

## 📚 문서 구조

이 프로젝트의 상세 문서는 다음과 같이 구성되어 있습니다:

### 핵심 설계 문서
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - 시스템 아키텍처 및 데이터 저장 전략
- **[NFT_TRAITS.md](./NFT_TRAITS.md)** - NFT 속성 생성 메커니즘 (Address 기반 Deterministic Traits)
- **[WEALTH_SYSTEM.md](./WEALTH_SYSTEM.md)** - Wealth-Based Special Items 시스템

### 구현 문서
- **[RENDERING.md](./RENDERING.md)** - Three.js 3D 렌더링 시스템
- **[GIF_PIPELINE.md](./GIF_PIPELINE.md)** - GIF 생성 파이프라인 및 IPFS 업로드
- **[SMART_CONTRACT.md](./SMART_CONTRACT.md)** - 스마트 컨트랙트 전체 코드
- **[FRONTEND.md](./FRONTEND.md)** - 프론트엔드 구현 가이드

### 참고 문서
- **[METADATA_SCHEMA.md](./METADATA_SCHEMA.md)** - NFT 메타데이터 스키마
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - 배포 체크리스트
- **[IMPROVEMENTS.md](./IMPROVEMENTS.md)** - 추가 개선 아이디어

### 에셋 생성 가이드
- **[SKIN_GENERATION.md](./SKIN_GENERATION.md)** - Claude를 통한 마인크래프트 스킨 생성 완벽 가이드 (64x64 템플릿, 픽셀 퍼펙트 프롬프트 시스템)

---

## 🚀 빠른 시작

### 1. 아키텍처 이해
프로젝트의 전체 구조를 이해하려면 [ARCHITECTURE.md](./ARCHITECTURE.md)부터 읽어보세요.

### 2. NFT 속성 생성 로직
어떻게 주소 기반으로 고유한 NFT가 생성되는지 알아보려면 [NFT_TRAITS.md](./NFT_TRAITS.md)를 참고하세요.

### 3. Wealth 시스템
자산 기반 특별 아이템 시스템은 [WEALTH_SYSTEM.md](./WEALTH_SYSTEM.md)에서 확인하세요.

### 4. 구현 시작
스마트 컨트랙트 배포는 [SMART_CONTRACT.md](./SMART_CONTRACT.md)를,
프론트엔드 개발은 [FRONTEND.md](./FRONTEND.md)를 참고하세요.

### 5. 스킨 에셋 생성
마인크래프트 스킨을 Claude로 생성하려면 [SKIN_GENERATION.md](./SKIN_GENERATION.md)의 상세 프롬프트 시스템을 활용하세요.

---

## 🛠️ 기술 스택

### 블록체인
- **Solidity** ^0.8.20
- **OpenZeppelin Contracts** (ERC721URIStorage, Ownable)
- **Chainlink** (Price Feeds)

### 프론트엔드
- **React** / **Next.js**
- **Three.js** (3D 렌더링)
- **gif.js** (GIF 생성)
- **Ethers.js** / **Wagmi** (블록체인 인터랙션)

### 인프라
- **IPFS** / **Pinata** (탈중앙화 스토리지)
- **Hardhat** (스마트 컨트랙트 개발 및 배포)

---

## 📞 문의 및 지원

프로젝트 관련 문의: [Your Contact]
GitHub: [Repository URL]
Discord: [Community Link]

---

## 📄 라이센스

MIT License

Copyright (c) 2025 명현

---

**Last Updated**: 2025-01-15
**Version**: 1.0.0
**Author**: 명현
