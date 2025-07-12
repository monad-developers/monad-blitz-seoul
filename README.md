# Omni Oracle

## 어떤 데이터든 입력 / 가져올 수 있는 Oracle

_An Oracle that can input/retrieve any data_

Omni Oracle is a versatile blockchain oracle solution that enables seamless data input and retrieval from various sources. Built with modern web3 technologies, it provides a robust infrastructure for connecting real-world data to smart contracts.

## 🚀 Features

- **String / Bool / Number**: 세 가지 형태의 데이터 저장 가능
- **Real-time Data Retrieval**: 실시간으로 데이터 입력 / 가져오기 가능
- **Smart Contract Integration**: Monad Testnet 상의 컨트랙트와 상호작용 가능

## 🛠 Tech Stack

### Core Technologies

- **Solidity**: 스마트계약 개발 언어
- **Hardhat**: 계약 배포 및 데이터 입력
- **Node.js**: 서버
- **JavaScript**: 사용 언어

### Development Tools

- **Hardhat Network**: 로컬 및 리모트 블록체인과의 연결에 사용
- **Ethers.js**: web3 프로바이더
- **OpenZeppelin**: 표준 컨트랙 라이브러리
- **Remix**: 브라우저 상에서 계약 배포

## 📋 Prerequisites

다음과 같은 소프트웨어가 깔려있어야합니다!

- **Node.js** (v16.0.0 or higher)
- **npm** or **yarn**
- **Git**
- **Hardhat**

## 🔧 Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/omni-oracle.git
   cd omni-oracle
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**

   `.env` 파일을 만들어주세요, 프라이빗키는 절대 노출하지 마세요!

   ```env
   PRIVATE_KEY=your_private_key_here
   ```

## 🚀 Getting Started

### 1. 오라클 컨트랙트 배포하기

```bash
npx hardhat run scripts/deploy.js --network monadTestnet
```

### 2. 샘플 데이터 넣어보기

```bash
npx hardhat run scripts/insertData.js --network monadTestnet
```

### 3. 기상청 데이터 5초 단위로 입력하기

```bash
node scripts/weather.js
```

## 🏗 Project Structure

```
omni-oracle/
├── contracts/
│   ├── DataStorage.sol     # 오라클 솔리디티 컨트랙트
├── scripts/
│   ├── insertData.js       # 임의의 데이터 입력
│   └── weather.js          # 기상청 데이터 5초단위 입력
|   └── deploy.js           # 오라클 배포
├── hardhat.config.js       # Hardhat configuration
├── package.json            # Node.js dependencies
└── README.md
```

## 🌐 Supported Networks

- **Monad TESTNET**

## 🤝 Contributing

기여하고 싶으시면 jisongimsorry@gmail.com 으로 메일 보내주세요!

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Built with ❤️ by the Omni Oracle team**
