import React, { useState } from 'react';

function DexSwap({ onSwapAndFight }) {
  const [fromToken, setFromToken] = useState('ETH');
  const [toToken, setToToken] = useState('MONAD');
  const [fromAmount, setFromAmount] = useState('0.1');
  const [toAmount, setToAmount] = useState('10');
  const [slippage, setSlippage] = useState('0.5');

  const tokens = [
    { symbol: 'ETH', name: 'Ethereum', icon: '🔵' },
    { symbol: 'MONAD', name: 'Monad', icon: '🟣' },
    { symbol: 'USDC', name: 'USD Coin', icon: '🔵' },
    { symbol: 'WETH', name: 'Wrapped ETH', icon: '🔵' }
  ];

  const handleSwapAndFight = () => {
    if (onSwapAndFight) {
      onSwapAndFight({
        fromToken,
        toToken,
        fromAmount: parseFloat(fromAmount),
        toAmount: parseFloat(toAmount),
        slippage: parseFloat(slippage)
      });
    }
  };

  return (
    <div style={{ 
      background: '#fff', 
      borderRadius: 12, 
      boxShadow: '0 2px 8px #eee', 
      padding: 24, 
      minWidth: 340, 
      maxWidth: 400 
    }}>
      <h3 style={{ textAlign: 'center', marginBottom: 20, color: '#1e293b' }}>💱 DEX Swap</h3>
      
      {/* From Token */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 14, color: '#64748b' }}>From</span>
          <span style={{ fontSize: 14, color: '#64748b' }}>Balance: 1.234</span>
        </div>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          background: '#f8fafc', 
          borderRadius: 8, 
          padding: 12,
          border: '1px solid #e2e8f0'
        }}>
          <select
            value={fromToken}
            onChange={(e) => setFromToken(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: 16,
              fontWeight: '600',
              color: '#1e293b',
              marginRight: 8,
              cursor: 'pointer'
            }}
          >
            {tokens.map(token => (
              <option key={token.symbol} value={token.symbol}>
                {token.icon} {token.symbol}
              </option>
            ))}
          </select>
          <input
            type="number"
            value={fromAmount}
            onChange={(e) => setFromAmount(e.target.value)}
            placeholder="0.0"
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              fontSize: 16,
              textAlign: 'right',
              color: '#1e293b'
            }}
          />
        </div>
      </div>

      {/* Swap Arrow */}
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <div style={{ 
          display: 'inline-block',
          background: '#6366f1',
          color: '#fff',
          width: 32,
          height: 32,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          fontSize: 16
        }}>
          ↓
        </div>
      </div>

      {/* To Token */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 14, color: '#64748b' }}>To</span>
          <span style={{ fontSize: 14, color: '#64748b' }}>Balance: 50.0</span>
        </div>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          background: '#f8fafc', 
          borderRadius: 8, 
          padding: 12,
          border: '1px solid #e2e8f0'
        }}>
          <select
            value={toToken}
            onChange={(e) => setToToken(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: 16,
              fontWeight: '600',
              color: '#1e293b',
              marginRight: 8,
              cursor: 'pointer'
            }}
          >
            {tokens.map(token => (
              <option key={token.symbol} value={token.symbol}>
                {token.icon} {token.symbol}
              </option>
            ))}
          </select>
          <input
            type="number"
            value={toAmount}
            onChange={(e) => setToAmount(e.target.value)}
            placeholder="0.0"
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              fontSize: 16,
              textAlign: 'right',
              color: '#1e293b'
            }}
          />
        </div>
      </div>

      {/* Slippage */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 14, color: '#64748b' }}>Slippage</span>
          <div style={{ display: 'flex', gap: 4 }}>
            {[0.1, 0.5, 1.0].map(s => (
              <button
                key={s}
                onClick={() => setSlippage(s.toString())}
                style={{
                  padding: '4px 8px',
                  background: slippage === s.toString() ? '#6366f1' : '#f1f5f9',
                  color: slippage === s.toString() ? '#fff' : '#64748b',
                  border: 'none',
                  borderRadius: 4,
                  fontSize: 12,
                  cursor: 'pointer'
                }}
              >
                {s}%
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Swap & Fight Button */}
      <button
        onClick={handleSwapAndFight}
        style={{
          width: '100%',
          padding: 16,
          background: '#6366f1',
          color: '#fff',
          border: 'none',
          borderRadius: 12,
          fontWeight: '600',
          fontSize: 16,
          cursor: 'pointer',
          marginBottom: 12
        }}
      >
        💱 Swap & ⚔️ Fight
      </button>

      {/* Transaction Info */}
      <div style={{ 
        background: '#f8fafc', 
        borderRadius: 8, 
        padding: 12, 
        fontSize: 12, 
        color: '#64748b' 
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span>Exchange Rate</span>
          <span>1 ETH = 100 MONAD</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span>Price Impact</span>
          <span style={{ color: '#059669' }}>0.02%</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Network Fee</span>
          <span>~$2.50</span>
        </div>
      </div>
    </div>
  );
}

export default DexSwap; 