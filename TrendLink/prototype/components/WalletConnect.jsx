import React, { useState, useEffect } from 'react';
import Web3AuthService from '../services/Web3AuthService';

const WalletConnect = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const connected = Web3AuthService.checkConnection();
      setIsConnected(connected);
      
      if (connected) {
        await loadUserData();
      }
    } catch (err) {
      console.error('Connection check failed:', err);
    }
  };

  const loadUserData = async () => {
    try {
      const [userInfo, userBalance] = await Promise.all([
        Web3AuthService.getUserInfo(),
        Web3AuthService.getBalance()
      ]);
      
      setUserInfo(userInfo);
      setBalance(userBalance);
    } catch (err) {
      console.error('Load user data failed:', err);
      setError('사용자 정보를 불러오는데 실패했습니다.');
    }
  };

  const handleConnect = async () => {
    if (!Web3AuthService.isMetaMaskInstalled()) {
      setError('MetaMask가 설치되지 않았습니다.');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const result = await Web3AuthService.connectMetaMask();
      
      if (result.success) {
        setIsConnected(true);
        await loadUserData();
      } else {
        setError(result.error || '지갑 연결에 실패했습니다.');
      }
    } catch (err) {
      console.error('Connection failed:', err);
      setError('지갑 연결에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    
    try {
      await Web3AuthService.disconnect();
      setIsConnected(false);
      setUserInfo(null);
      setBalance(0);
    } catch (err) {
      console.error('Disconnect failed:', err);
      setError('지갑 연결 해제에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignMessage = async () => {
    try {
      const message = `TrendLink 로그인 인증\n시간: ${new Date().toLocaleString()}`;
      const signature = await Web3AuthService.signMessage(message);
      alert(`메시지 서명 완료:\n${signature}`);
    } catch (err) {
      console.error('Sign message failed:', err);
      setError('메시지 서명에 실패했습니다.');
    }
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatBalance = (balance) => {
    return balance.toFixed(6);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">처리 중...</span>
      </div>
    );
  }

  if (!isConnected) {
    const isMetaMaskInstalled = Web3AuthService.isMetaMaskInstalled();
    
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
        <div className="text-center">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <img 
              src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" 
              alt="MetaMask" 
              className="w-10 h-10"
            />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">지갑 연결</h3>
          
          {!isMetaMaskInstalled ? (
            <>
              <p className="text-gray-600 mb-4">
                MetaMask가 설치되지 않았습니다. <br />
                MetaMask를 설치한 후 다시 시도해주세요.
              </p>
              <button
                onClick={() => window.open('https://metamask.io/download/', '_blank')}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors mb-3"
              >
                MetaMask 설치하기
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                새로고침
              </button>
            </>
          ) : (
            <>
              <p className="text-gray-600 mb-6">
                MetaMask를 사용하여 지갑을 연결하고 <br />
                블록체인 기능을 사용하세요.
              </p>
              <button
                onClick={handleConnect}
                disabled={loading}
                className="w-full bg-orange-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                MetaMask 연결하기
              </button>
            </>
          )}
          
          {error && (
            <p className="mt-4 text-red-600 text-sm">{error}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">연결된 지갑</h3>
        <button
          onClick={handleDisconnect}
          className="text-red-600 hover:text-red-700 text-sm font-medium"
        >
          연결 해제
        </button>
      </div>

      <div className="flex items-center mb-6">
        <img 
          src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" 
          alt="MetaMask" 
          className="w-12 h-12 mr-3"
        />
        <div>
          <p className="font-medium text-gray-900">MetaMask</p>
          <p className="text-sm text-gray-500">이더리움 지갑</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">주소</p>
          <p className="font-mono text-sm text-gray-900">
            {userInfo ? formatAddress(userInfo.address) : '로딩 중...'}
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">잔액</p>
          <p className="font-semibold text-gray-900">
            {formatBalance(balance)} ETH
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleSignMessage}
            className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors text-sm"
          >
            메시지 서명
          </button>
          <button
            onClick={loadUserData}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-700 transition-colors text-sm"
          >
            새로고침
          </button>
        </div>
      </div>

      {error && (
        <p className="mt-4 text-red-600 text-sm">{error}</p>
      )}
    </div>
  );
};

export default WalletConnect;
