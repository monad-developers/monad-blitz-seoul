import React, { useState } from 'react';

function isAddress(addr) {
  // 간단한 이더리움 주소 형식 체크 (0x + 40 hex)
  return /^0x[a-fA-F0-9]{40}$/.test(addr);
}

function XpConditionCustomize({ address }) {
  const [input, setInput] = useState({ contract: '', xp: '' });
  const [conditions, setConditions] = useState([]);
  const [error, setError] = useState('');

  const handleAdd = () => {
    if (!isAddress(input.contract)) {
      setError('올바른 컨트랙트 주소를 입력하세요.');
      return;
    }
    const xp = Number(input.xp);
    if (!xp || xp <= 0) {
      setError('XP는 1 이상 숫자여야 합니다.');
      return;
    }
    if (conditions.some(c => c.contract.toLowerCase() === input.contract.toLowerCase())) {
      setError('이미 등록된 컨트랙트입니다.');
      return;
    }
    setConditions(prev => [...prev, { contract: input.contract, xp }]);
    setInput({ contract: '', xp: '' });
    setError('');
  };

  const handleRemove = (idx) => {
    setConditions(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSave = () => {
    alert(`XP 조건 저장!\n지갑: ${address || '-'}\n조건 수: ${conditions.length}`);
  };

  return (
    <div style={{ maxWidth: 520, margin: '40px auto', background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px #eee', padding: 32 }}>
      <h2 style={{ textAlign: 'center', marginBottom: 24 }}>⚡️ XP 획득 조건</h2>
      {address && (
        <div style={{ textAlign: 'center', color: '#0a0', fontWeight: 600, marginBottom: 16, fontSize: 14 }}>
          연결된 지갑: {address}
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input
          type="text"
          value={input.contract}
          onChange={e => setInput(i => ({ ...i, contract: e.target.value }))}
          placeholder="컨트랙트 주소 (0x...)"
          style={{ flex: 2, padding: 8, borderRadius: 6, border: '1px solid #ccc' }}
        />
        <input
          type="number"
          min={1}
          value={input.xp}
          onChange={e => setInput(i => ({ ...i, xp: e.target.value }))}
          placeholder="XP"
          style={{ flex: 1, padding: 8, borderRadius: 6, border: '1px solid #ccc' }}
        />
        <button
          onClick={handleAdd}
          style={{ padding: '8px 16px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, fontSize: 15, cursor: 'pointer' }}
        >
          추가
        </button>
      </div>
      {error && <div style={{ color: '#f44', marginBottom: 8, fontSize: 13 }}>{error}</div>}
      <div style={{ marginBottom: 20 }}>
        {conditions.length === 0 ? (
          <div style={{ color: '#888', textAlign: 'center', fontSize: 15 }}>조건이 없습니다.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 15 }}>
            <thead>
              <tr style={{ background: '#f6f6fa' }}>
                <th style={{ padding: 6, borderBottom: '1px solid #eee', textAlign: 'left' }}>컨트랙트 주소</th>
                <th style={{ padding: 6, borderBottom: '1px solid #eee' }}>XP</th>
                <th style={{ padding: 6, borderBottom: '1px solid #eee' }}></th>
              </tr>
            </thead>
            <tbody>
              {conditions.map((c, idx) => (
                <tr key={idx}>
                  <td style={{ padding: 6, wordBreak: 'break-all', color: '#333' }}>{c.contract}</td>
                  <td style={{ padding: 6, textAlign: 'center', color: '#6366f1', fontWeight: 600 }}>{c.xp}</td>
                  <td style={{ padding: 6, textAlign: 'center' }}>
                    <button
                      onClick={() => handleRemove(idx)}
                      style={{ background: '#f44', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontWeight: 600 }}
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <button
        onClick={handleSave}
        style={{ width: '100%', padding: 12, background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 16, cursor: 'pointer' }}
      >
        저장
      </button>
    </div>
  );
}

export default XpConditionCustomize; 