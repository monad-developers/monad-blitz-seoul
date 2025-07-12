// 간단한 브라우저 기반 지갑 연결 서비스
class SimpleWalletService {
  constructor() {
    this.provider = null;
    this.accounts = [];
    this.isConnected = false;
    this.initializeProvider();
  }

  // 초기화 시 이미 연결된 지갑 확인
  async initializeProvider() {
    if (typeof window.ethereum !== 'undefined') {
      this.provider = window.ethereum;
      
      // 이미 연결된 계정 확인
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          this.accounts = accounts;
          this.isConnected = true;
          console.log('Already connected to MetaMask:', accounts[0]);
        }
      } catch (error) {
        console.error('Failed to check existing connection:', error);
      }

      // 계정 변경 이벤트 리스너
      window.ethereum.on('accountsChanged', (accounts) => {
        console.log('Accounts changed:', accounts);
        this.accounts = accounts;
        this.isConnected = accounts.length > 0;
        if (accounts.length === 0) {
          this.disconnect();
        }
      });

      // 네트워크 변경 이벤트 리스너
      window.ethereum.on('chainChanged', (chainId) => {
        console.log('Chain changed:', chainId);
        window.location.reload();
      });
    }
  }

  // MetaMask 연결
  async connectMetaMask() {
    try {
      if (typeof window.ethereum !== 'undefined') {
        // MetaMask 계정 요청
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        if (accounts.length > 0) {
          this.provider = window.ethereum;
          this.accounts = accounts;
          this.isConnected = true;
          
          // 계정 변경 이벤트 리스너
          window.ethereum.on('accountsChanged', (accounts) => {
            this.accounts = accounts;
            if (accounts.length === 0) {
              this.disconnect();
            }
          });
          
          return {
            success: true,
            accounts: accounts,
            provider: 'MetaMask'
          };
        }
      } else {
        throw new Error('MetaMask is not installed');
      }
    } catch (error) {
      console.error('MetaMask connection failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 지갑 연결 해제
  async disconnect() {
    this.provider = null;
    this.accounts = [];
    this.isConnected = false;
    console.log('Wallet disconnected');
  }

  // 계정 정보 가져오기
  async getAccounts() {
    try {
      if (!this.isMetaMaskInstalled()) {
        return [];
      }

      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      this.accounts = accounts;
      this.isConnected = accounts.length > 0;
      return accounts;
    } catch (error) {
      console.error('Get accounts failed:', error);
      return [];
    }
  }

  // 잔액 조회
  async getBalance(address = null) {
    if (!this.isConnected || !this.provider) {
      throw new Error('Wallet not connected');
    }

    try {
      const targetAddress = address || this.accounts[0];
      const balance = await this.provider.request({
        method: 'eth_getBalance',
        params: [targetAddress, 'latest']
      });
      
      // Wei를 ETH로 변환
      const balanceInEth = parseInt(balance, 16) / Math.pow(10, 18);
      return balanceInEth;
    } catch (error) {
      console.error('Get balance failed:', error);
      throw error;
    }
  }

  // 메시지 서명
  async signMessage(message, address = null) {
    if (!this.isConnected || !this.provider) {
      throw new Error('Wallet not connected');
    }

    try {
      const targetAddress = address || this.accounts[0];
      const signature = await this.provider.request({
        method: 'personal_sign',
        params: [message, targetAddress]
      });
      
      return signature;
    } catch (error) {
      console.error('Sign message failed:', error);
      throw error;
    }
  }

  // 트랜잭션 전송
  async sendTransaction(transaction) {
    if (!this.isConnected || !this.provider) {
      throw new Error('Wallet not connected');
    }

    try {
      const txHash = await this.provider.request({
        method: 'eth_sendTransaction',
        params: [transaction]
      });
      
      return txHash;
    } catch (error) {
      console.error('Send transaction failed:', error);
      throw error;
    }
  }

  // 네트워크 정보 가져오기
  async getChainId() {
    try {
      if (!this.isMetaMaskInstalled()) {
        return null;
      }

      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      const chainIdDecimal = parseInt(chainId, 16);
      
      // 지원하는 네트워크 확인
      const supportedNetworks = {
        1: 'Ethereum Mainnet',
        5: 'Goerli Testnet',
        11155111: 'Sepolia Testnet',
        60808: 'Monad Testnet', // Monad 네트워크 추가
        31337: 'Local Network'
      };
      
      console.log('Current network:', {
        chainId: chainIdDecimal,
        networkName: supportedNetworks[chainIdDecimal] || 'Unknown Network'
      });
      
      return chainIdDecimal;
    } catch (error) {
      console.error('Get chain ID failed:', error);
      return null;
    }
  }

  // 연결 상태 확인
  async checkConnection() {
    try {
      if (!this.isMetaMaskInstalled()) {
        return false;
      }

      const accounts = await this.getAccounts();
      return accounts.length > 0;
    } catch (error) {
      console.error('Check connection failed:', error);
      return false;
    }
  }

  // 지갑 설치 여부 확인
  isMetaMaskInstalled() {
    return typeof window.ethereum !== 'undefined';
  }

  // 사용자 정보 (간단한 형태)
  getUserInfo() {
    if (!this.isConnected) {
      return null;
    }
    
    return {
      address: this.accounts[0],
      addresses: this.accounts,
      provider: 'MetaMask',
      isConnected: this.isConnected
    };
  }
}

export default new SimpleWalletService();
