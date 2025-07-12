import Web3AuthService from './Web3AuthService';

// TrendLink 스마트 컨트랙트 ABI (주요 함수들만 포함)
const TRENDLINK_ABI = [
  {
    "inputs": [
      {"internalType": "address", "name": "user", "type": "address"},
      {"internalType": "address", "name": "platform", "type": "address"},
      {"internalType": "address", "name": "widget", "type": "address"},
      {"internalType": "string", "name": "keyword", "type": "string"}
    ],
    "name": "logSearch",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "userRatio", "type": "uint256"},
      {"internalType": "uint256", "name": "platformRatio", "type": "uint256"},
      {"internalType": "uint256", "name": "widgetRatio", "type": "uint256"}
    ],
    "name": "setRewardPolicy",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "user", "type": "address"}
    ],
    "name": "getUserSearchLogs",
    "outputs": [
      {"internalType": "uint256[]", "name": "logIds", "type": "uint256[]"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getContractInfo",
    "outputs": [
      {"internalType": "address", "name": "tokenAddress", "type": "address"},
      {"internalType": "uint256", "name": "baseReward", "type": "uint256"},
      {"internalType": "uint256", "name": "userRatio", "type": "uint256"},
      {"internalType": "uint256", "name": "platformRatio", "type": "uint256"},
      {"internalType": "uint256", "name": "widgetRatio", "type": "uint256"},
      {"internalType": "uint256", "name": "totalLogs", "type": "uint256"},
      {"internalType": "bool", "name": "isPaused", "type": "bool"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "", "type": "uint256"}
    ],
    "name": "searchLogs",
    "outputs": [
      {"internalType": "address", "name": "user", "type": "address"},
      {"internalType": "address", "name": "platform", "type": "address"},
      {"internalType": "address", "name": "widget", "type": "address"},
      {"internalType": "string", "name": "keyword", "type": "string"},
      {"internalType": "uint256", "name": "timestamp", "type": "uint256"},
      {"internalType": "uint256", "name": "rewardAmount", "type": "uint256"},
      {"internalType": "bool", "name": "distributed", "type": "bool"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "", "type": "address"}
    ],
    "name": "userRewards",
    "outputs": [
      {"internalType": "uint256", "name": "", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "uint256", "name": "logId", "type": "uint256"},
      {"indexed": true, "internalType": "address", "name": "user", "type": "address"},
      {"indexed": true, "internalType": "address", "name": "platform", "type": "address"},
      {"indexed": false, "internalType": "address", "name": "widget", "type": "address"},
      {"indexed": false, "internalType": "string", "name": "keyword", "type": "string"},
      {"indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "rewardAmount", "type": "uint256"}
    ],
    "name": "SearchLogged",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "uint256", "name": "logId", "type": "uint256"},
      {"indexed": true, "internalType": "address", "name": "user", "type": "address"},
      {"indexed": true, "internalType": "address", "name": "platform", "type": "address"},
      {"indexed": false, "internalType": "address", "name": "widget", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "userAmount", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "platformAmount", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "widgetAmount", "type": "uint256"}
    ],
    "name": "RewardDistributed",
    "type": "event"
  }
];

// 스마트 컨트랙트 주소 (배포 후 업데이트 필요)
const TRENDLINK_CONTRACT_ADDRESS = "0x..."; // 실제 컨트랙트 주소로 교체

class TrendLinkContractService {
  constructor() {
    this.contract = null;
    this.web3 = null;
    this.platformAddress = "0x742d35Cc6634C0532925a3b8D527d6d73c8F7C82"; // 플랫폼 주소
    this.widgetAddress = "0x742d35Cc6634C0532925a3b8D527d6d73c8F7C82"; // 위젯 운영자 주소
  }

  async initializeContract() {
    try {
      if (!Web3AuthService.checkConnection()) {
        throw new Error("Wallet not connected");
      }

      const provider = Web3AuthService.provider;
      if (!provider) {
        throw new Error("No provider available");
      }

      // Web3 인스턴스 생성
      const Web3 = (await import('web3')).default;
      this.web3 = new Web3(provider);

      // 컨트랙트 인스턴스 생성
      this.contract = new this.web3.eth.Contract(TRENDLINK_ABI, TRENDLINK_CONTRACT_ADDRESS);

      console.log("TrendLink contract initialized successfully");
      return true;
    } catch (error) {
      console.error("Contract initialization failed:", error);
      throw error;
    }
  }

  async logSearch(keyword) {
    try {
      if (!this.contract) {
        await this.initializeContract();
      }

      const accounts = await Web3AuthService.getAccounts();
      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts available");
      }

      const userAddress = accounts[0];

      // 검색 로그 기록 트랜잭션 실행
      const tx = await this.contract.methods.logSearch(
        userAddress,
        this.platformAddress,
        this.widgetAddress,
        keyword
      ).send({
        from: userAddress,
        gas: 300000, // 가스 제한
      });

      console.log("Search logged successfully:", tx.transactionHash);
      return {
        success: true,
        transactionHash: tx.transactionHash,
        blockNumber: tx.blockNumber
      };
    } catch (error) {
      console.error("Log search failed:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getUserSearchLogs(userAddress = null) {
    try {
      if (!this.contract) {
        await this.initializeContract();
      }

      if (!userAddress) {
        const accounts = await Web3AuthService.getAccounts();
        if (!accounts || accounts.length === 0) {
          throw new Error("No accounts available");
        }
        userAddress = accounts[0];
      }

      const logIds = await this.contract.methods.getUserSearchLogs(userAddress).call();
      
      // 각 로그의 상세 정보 가져오기
      const logs = await Promise.all(
        logIds.map(async (logId) => {
          const log = await this.contract.methods.searchLogs(logId).call();
          return {
            logId: logId.toString(),
            user: log.user,
            platform: log.platform,
            widget: log.widget,
            keyword: log.keyword,
            timestamp: new Date(parseInt(log.timestamp) * 1000),
            rewardAmount: this.web3.utils.fromWei(log.rewardAmount, 'ether'),
            distributed: log.distributed
          };
        })
      );

      return logs;
    } catch (error) {
      console.error("Get user search logs failed:", error);
      throw error;
    }
  }

  async getUserRewards(userAddress = null) {
    try {
      if (!this.contract) {
        await this.initializeContract();
      }

      if (!userAddress) {
        const accounts = await Web3AuthService.getAccounts();
        if (!accounts || accounts.length === 0) {
          throw new Error("No accounts available");
        }
        userAddress = accounts[0];
      }

      const rewardWei = await this.contract.methods.userRewards(userAddress).call();
      const rewardEth = this.web3.utils.fromWei(rewardWei, 'ether');

      return {
        address: userAddress,
        totalReward: rewardEth,
        totalRewardWei: rewardWei
      };
    } catch (error) {
      console.error("Get user rewards failed:", error);
      throw error;
    }
  }

  async getContractInfo() {
    try {
      if (!this.contract) {
        await this.initializeContract();
      }

      const info = await this.contract.methods.getContractInfo().call();
      
      return {
        tokenAddress: info.tokenAddress,
        baseReward: this.web3.utils.fromWei(info.baseReward, 'ether'),
        userRatio: parseInt(info.userRatio) / 100, // basis points to percentage
        platformRatio: parseInt(info.platformRatio) / 100,
        widgetRatio: parseInt(info.widgetRatio) / 100,
        totalLogs: parseInt(info.totalLogs),
        isPaused: info.isPaused
      };
    } catch (error) {
      console.error("Get contract info failed:", error);
      throw error;
    }
  }

  async getRecentSearchLogs(limit = 10) {
    try {
      if (!this.contract) {
        await this.initializeContract();
      }

      const info = await this.getContractInfo();
      const totalLogs = info.totalLogs;
      const startIndex = Math.max(0, totalLogs - limit);

      const logs = [];
      for (let i = totalLogs - 1; i >= startIndex; i--) {
        try {
          const log = await this.contract.methods.searchLogs(i).call();
          logs.push({
            logId: i.toString(),
            user: log.user,
            platform: log.platform,
            widget: log.widget,
            keyword: log.keyword,
            timestamp: new Date(parseInt(log.timestamp) * 1000),
            rewardAmount: this.web3.utils.fromWei(log.rewardAmount, 'ether'),
            distributed: log.distributed
          });
        } catch (error) {
          console.error(`Error fetching log ${i}:`, error);
        }
      }

      return logs;
    } catch (error) {
      console.error("Get recent search logs failed:", error);
      throw error;
    }
  }

  // 이벤트 리스너 설정
  async setupEventListeners() {
    try {
      if (!this.contract) {
        await this.initializeContract();
      }

      // 검색 로그 이벤트
      this.contract.events.SearchLogged({})
        .on('data', (event) => {
          console.log('Search logged event:', event.returnValues);
          // 커스텀 이벤트 발생
          window.dispatchEvent(new CustomEvent('searchLogged', {
            detail: event.returnValues
          }));
        })
        .on('error', (error) => {
          console.error('Search logged event error:', error);
        });

      // 보상 분배 이벤트
      this.contract.events.RewardDistributed({})
        .on('data', (event) => {
          console.log('Reward distributed event:', event.returnValues);
          // 커스텀 이벤트 발생
          window.dispatchEvent(new CustomEvent('rewardDistributed', {
            detail: event.returnValues
          }));
        })
        .on('error', (error) => {
          console.error('Reward distributed event error:', error);
        });

      console.log("Event listeners set up successfully");
    } catch (error) {
      console.error("Setup event listeners failed:", error);
      throw error;
    }
  }

  // 트랜잭션 상태 확인
  async waitForTransaction(txHash) {
    try {
      if (!this.web3) {
        throw new Error("Web3 not initialized");
      }

      let receipt = null;
      let attempts = 0;
      const maxAttempts = 30; // 최대 30번 시도 (약 30초)

      while (!receipt && attempts < maxAttempts) {
        try {
          receipt = await this.web3.eth.getTransactionReceipt(txHash);
          if (receipt) {
            return receipt;
          }
        } catch (error) {
          console.log(`Transaction pending... (${attempts + 1}/${maxAttempts})`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1초 대기
        attempts++;
      }

      throw new Error("Transaction confirmation timeout");
    } catch (error) {
      console.error("Wait for transaction failed:", error);
      throw error;
    }
  }
}

export default new TrendLinkContractService();
