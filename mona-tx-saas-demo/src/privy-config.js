// Monad Testnet용 Privy 설정
export const privyConfig = {
  appId: 'cmcznyynl000xks0nsnd6wkau',
  config: {
    loginMethods: ['email', 'wallet'],
    appearance: {
      theme: 'light',
      accentColor: '#6366f1',
      showWalletLoginFirst: true,
    },
    defaultChain: {
      id: 10143, // Monad Testnet ChainID
      name: 'Monad Testnet',
      rpcUrl: 'https://testnet-rpc.monad.xyz',
      blockExplorer: 'https://testnet.monadexplorer.com',
      nativeCurrency: {
        name: 'MON',
        symbol: 'MON',
        decimals: 18,
      },
    },
    supportedChains: [
      {
        id: 10143,
        name: 'Monad Testnet',
        rpcUrl: 'https://testnet-rpc.monad.xyz',
        blockExplorer: 'https://testnet.monadexplorer.com',
        nativeCurrency: {
          name: 'MON',
          symbol: 'MON',
          decimals: 18,
        },
      },
    ],
    // 가스 설정 (Monad Testnet 최소 50 gwei)
    gasSettings: {
      defaultGasLimit: 21000,
      defaultGasPrice: '50000000000', // 50 gwei
    },
  },
};

// Monad Testnet 가스 설정
export const monadGasConfig = {
  // Monad Testnet 최소 가스 가격: 50 gwei
  gasPrice: '50000000000', // 50 gwei in wei
  maxFeePerGas: '100000000000', // 100 gwei
  maxPriorityFeePerGas: '50000000000', // 50 gwei
  gasLimit: 21000,
};

// 환경 변수
export const envConfig = {
  PRIVY_APP_ID: 'cmcznyynl000xks0nsnd6wkau',
  MONAD_RPC_URL: 'https://testnet-rpc.monad.xyz',
  MONAD_CHAIN_ID: 10143,
  MONAD_EXPLORER: 'https://testnet.monadexplorer.com',
  MONAD_FAUCET: 'https://testnet.monad.xyz',
}; 