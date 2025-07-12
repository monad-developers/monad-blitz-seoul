// Web3Auth 연동 모듈
import { Web3Auth } from "@web3auth/modal";
import { CHAIN_NAMESPACES, WEB3AUTH_NETWORK } from "@web3auth/base";

// 테스트용 더미 클라이언트 ID (실제 배포시 교체 필요)
const clientId = "BPi5PB_UiIZ-cPz1GtV5i1I2iOSOHuimiXBI0e-Oe_u6X3oVAbCiAZOTEBtTXw4tsluTITPqA8zMsfxIKMjiqNQ";

const web3auth = new Web3Auth({
  clientId,
  web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET, // 개발용 네트워크 사용
  chainConfig: {
    chainNamespace: CHAIN_NAMESPACES.EIP155,
    chainId: "0x13881", // Polygon Mumbai testnet
    rpcTarget: "https://rpc.ankr.com/polygon_mumbai",
    displayName: "Polygon Mumbai",
    blockExplorer: "https://mumbai.polygonscan.com",
    ticker: "MATIC",
    tickerName: "Matic",
  },
});

export { web3auth };

// 로그인 함수
export const loginWithWeb3Auth = async () => {
  try {
    const web3authProvider = await web3auth.connect();
    return web3authProvider;
  } catch (error) {
    console.error("Web3Auth login failed:", error);
    throw error;
  }
};

// 로그아웃 함수
export const logoutFromWeb3Auth = async () => {
  try {
    await web3auth.logout();
  } catch (error) {
    console.error("Web3Auth logout failed:", error);
    throw error;
  }
};

// 사용자 정보 가져오기
export const getUserInfo = async () => {
  try {
    const user = await web3auth.getUserInfo();
    return user;
  } catch (error) {
    console.error("Failed to get user info:", error);
    throw error;
  }
};
