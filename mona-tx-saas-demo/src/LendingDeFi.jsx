import React, { useState } from 'react';

function LendingDeFi({ onLendAndFight }) {
  const [token, setToken] = useState('USDC');
  const [amount, setAmount] = useState('100');
  const [mode, setMode] = useState('deposit');

  const tokens = [
    { symbol: 'USDC', name: 'USD Coin', icon: '🔵', balance: 1000, rate: '2.5%' },
    { symbol: 'ETH', name: 'Ethereum', icon: '🟣', balance: 2.5, rate: '1.8%' },
    { symbol: 'MONAD', name: 'Monad', icon: '🟣', balance: 500, rate: '3.2%' }
  ];

  const selected = tokens.find(t => t.symbol === token);

  const handleLendAndFight = () => {
    if (onLendAndFight) {
      onLendAndFight({
        token,
        amount: parseFloat(amount),
        mode,
        xp: 30 // Lending은 XP 30 고정
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
      <h3 style={{ textAlign: 'center', marginBottom: 20, color: '#1e293b' }}>🏦 DeFi Lending</h3>
      {/* Mode 선택 */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
        <button
          onClick={() => setMode('deposit')}
          style={{
            padding: '8px 24px',
            background: mode === 'deposit' ? '#6366f1' : '#f1f5f9',
            color: mode === 'deposit' ? '#fff' : '#64748b',
            border: 'none',
            borderRadius: 8,
            fontWeight: 600,
            fontSize: 15,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          Deposit
        </button>
        <button
          onClick={() => setMode('borrow')}
          style={{
            padding: '8px 24px',
            background: mode === 'borrow' ? '#6366f1' : '#f1f5f9',
            color: mode === 'borrow' ? '#fff' : '#64748b',
            border: 'none',
            borderRadius: 8,
            fontWeight: 600,
            fontSize: 15,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          Borrow
        </button>
      </div>
      {/* 토큰 선택 */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', borderRadius: 8, padding: 12, border: '1px solid #e2e8f0' }}>
          <select
            value={token}
            onChange={e => setToken(e.target.value)}
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
            {tokens.map(t => (
              <option key={t.symbol} value={t.symbol}>
                {t.icon} {t.symbol}
              </option>
            ))}
          </select>
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
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
      {/* 잔고/이자율 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#64748b', marginBottom: 16 }}>
        <span>Balance: {selected.balance}</span>
        <span>APY: {selected.rate}</span>
      </div>
      {/* Deposit/Borrow 버튼 */}
      <button
        onClick={handleLendAndFight}
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
        {mode === 'deposit' ? '💰 Deposit & Fight' : '💸 Borrow & Fight'}
      </button>
      {/* Info */}
      <div style={{ background: '#f8fafc', borderRadius: 8, padding: 12, fontSize: 12, color: '#64748b' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span>Collateral Ratio</span>
          <span>80%</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span>Liquidation Threshold</span>
          <span>85%</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Health Factor</span>
          <span>2.1</span>
        </div>
      </div>
    </div>
  );
}

export default LendingDeFi; 