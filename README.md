# MintMe - Mint Yourself. Meet the World.

> 명함처럼 교환되는, 나만의 NFT.  
> Web3 소셜 네트워크의 시작.

---

## 🚀 Overview

Crypto 생태계는 그 어느 산업군보다도 개인 PR이 중요한 분야입니다. X, Discord, Linkedin 등 다양한 플랫폼을 통해 자신을 알리고, 네트워킹을 하는 것이 중요합니다.
MintMe는 사용자 자신을 표현할 수 있는 NFT 명함을 생성하고, 이를 프로젝트 내 유저들과 공유하여 새로운 사람들을 만나고 새로운 프로젝트를 접할 수 있는 기회를 제공하는, 온체인 소셜 커넥션을 만드는 프로젝트입니다. 

---

## ✨ Features

- (개인)Portfolio, (팀)IR 자료 등 기반 Summary 생성 (Gemini API 활용)
- 👤 Summary 기반 양면 명함 NFT 발행
- 프로젝트에 등록한 모두에게 대규모 NFT 에어드랍 수행

---

## User Journey

1. 사용자는 자신의 프로필을 작성하고, 포트폴리오, IR 자료 등을 업로드합니다.
2. 시스템은 업로드된 자료를 기반으로 Summary를 생성합니다.
3. 사용자는 생성된 Summary를 확인하고, 양면 명함 NFT를 발행합니다.
4. 발행된 NFT는 프로젝트에 등록된 모든 사용자에게 에어드랍됩니다
5. 사용자는 다른 사용자들의 명함을 확인하고, 새로운 사람들과 네트워킹을 시작합니다.


## Workflow
<img width="2204" height="2964" alt="image" src="https://github.com/user-attachments/assets/9844c39b-410b-4187-a56d-5ff0530baed9" />


## 🛠️ Tech Stack

| Layer        | Tech                                 |
|--------------|--------------------------------------|
| Frontend     | Scaffold-ETH (React + Next.js + Wagmi + Tailwind)   |
| Smart Contract | Solidity + Hardhat + OpenZeppelin                  |
| chain   | Monad (EVM Compatible)               |
| Dev Tooling  | TypeScript, Viem, Wagmi              |
| Storage     | Rust Actix                           |
---



## 📸 Demo

[📽️ Watch Demo Video](https://youtu.be/your-demo-url)  

---

## ⚙️ Getting Started

```bash
# 1. Clone the repo
git clone https://github.com/your-org/mintme.git
cd mintme

# 2. Install dependencies
yarn install

# 3. Run local blockchain
yarn chain

# 4. Deploy contracts
yarn deploy

# 5. Start frontend
yarn start
```

## Team

| Member        | Role        | Details|
|--------------|--------------------------------------|--- |
| Dominick (JuYoung)     | Front + Integration | Built the UI, connected Phantom wallet, and integrated backend and smart contract features into a complete application|
| crab (Hyeonjae) | Back + Contract |  Developed the Monad smart contract, implemented the Rust Actix image server, and integrated Gemini API for RAG-based summarization                 |
| Seungjun  | Project Planning + Presentation | Defined project idea, structured workflow, wrote documentation, and led final pitch |
