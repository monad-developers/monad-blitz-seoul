import React, { useState } from 'react';
import DexUI from './DexUI';

function GameSimulator({ character, monster, xpConditions, rewards }) {
  const [log, setLog] = useState([]);
  const [result, setResult] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [characterLevel, setCharacterLevel] = useState(1);
  const [characterXP, setCharacterXP] = useState(0);

  // 레벨별 성장 데이터
  const levelData = [
    { level: 1, name: '초보자', hp: 100, attack: 10, defense: 5, xpRequired: 0, color: '#6b7280' },
    { level: 2, name: '견습생', hp: 120, attack: 12, defense: 6, xpRequired: 50, color: '#059669' },
    { level: 3, name: '전사', hp: 150, attack: 15, defense: 8, xpRequired: 120, color: '#0891b2' },
    { level: 4, name: '영웅', hp: 200, attack: 20, defense: 12, xpRequired: 250, color: '#7c3aed' },
    { level: 5, name: '전설', hp: 300, attack: 30, defense: 20, xpRequired: 500, color: '#dc2626' }
  ];

  const getCurrentLevelData = () => {
    return levelData.find(l => l.level === characterLevel) || levelData[0];
  };

  const simulate = () => {
    setIsSimulating(true);
    setLog([]);
    setResult(null);
    let logs = [];
    let currentLevelData = getCurrentLevelData();
    let charHp = currentLevelData.hp;
    let monHp = monster?.hp || 50;
    let charAtk = currentLevelData.attack;
    let monAtk = monster?.attack || 5;
    let charDef = currentLevelData.defense;
    let monDef = monster?.defense || 2;
    let xp = 0;
    let rewardResult = [];
    let round = 1;
    
    logs.push(`🎮 전투 시작!`);
    logs.push(`👤 ${currentLevelData.name} (레벨 ${characterLevel})`);
    logs.push(`HP: ${charHp} | 공격력: ${charAtk} | 방어력: ${charDef}`);
    
    while (charHp > 0 && monHp > 0) {
      logs.push(`\n🔄 라운드 ${round}`);
      // 캐릭터 공격
      const cDmg = Math.max(1, charAtk - monDef);
      monHp -= cDmg;
      logs.push(`⚔️ ${currentLevelData.name}의 공격! 몬스터에게 ${cDmg} 데미지`);
      if (monHp <= 0) {
        logs.push(`💀 몬스터가 쓰러졌습니다!`);
        break;
      }
      // 몬스터 반격
      const mDmg = Math.max(1, monAtk - charDef);
      charHp -= mDmg;
      logs.push(`🛡️ 몬스터의 반격! ${currentLevelData.name}에게 ${mDmg} 데미지`);
      if (charHp <= 0) {
        logs.push(`💀 ${currentLevelData.name}이(가) 쓰러졌습니다!`);
        break;
      }
      round++;
    }
    
    if (charHp > 0) {
      // XP 획득
      if (xpConditions && xpConditions.length > 0) {
        xp = xpConditions[0].xp;
        const newXP = characterXP + xp;
        logs.push(`\n⚡ XP ${xp} 획득! (총 ${newXP} XP)`);
        setCharacterXP(newXP);
        
        // 레벨업 체크
        const nextLevel = levelData.find(l => l.xpRequired > newXP && l.level > characterLevel);
        if (nextLevel) {
          logs.push(`\n🌟 레벨업! ${currentLevelData.name} → ${nextLevel.name}`);
          logs.push(`HP: ${currentLevelData.hp} → ${nextLevel.hp}`);
          logs.push(`공격력: ${currentLevelData.attack} → ${nextLevel.attack}`);
          logs.push(`방어력: ${currentLevelData.defense} → ${nextLevel.defense}`);
          setCharacterLevel(nextLevel.level);
        }
      }
      
      // 보상 획득
      if (rewards && rewards.length > 0) {
        logs.push(`\n🎁 보상 획득:`);
        rewards.forEach(r => {
          const rand = Math.random() * 100;
          if (rand <= r.probability) {
            logs.push(`✅ ${r.name} x${r.amount} (확률 ${r.probability}%)`);
            rewardResult.push({ ...r, success: true });
          } else {
            logs.push(`❌ ${r.name} 실패 (확률 ${r.probability}%)`);
            rewardResult.push({ ...r, success: false });
          }
        });
      }
      setResult({ win: true, xp, rewardResult });
    } else {
      setResult({ win: false });
    }
    setLog(logs);
    setIsSimulating(false);
  };

  const handleSwapAndFight = (swapData) => {
    setLog([`💱 Swap 완료: ${swapData.fromAmount} ${swapData.fromToken} → ${swapData.toAmount} ${swapData.toToken}`]);
    setResult(null);
    
    setTimeout(() => {
      simulate();
    }, 1000);
  };

  const resetCharacter = () => {
    setCharacterLevel(1);
    setCharacterXP(0);
    setLog([]);
    setResult(null);
  };

  return (
    <div style={{ minWidth: 340, maxWidth: 400, margin: '0 auto' }}>
      {/* DEX UI */}
      <DexUI onSwapAndFight={handleSwapAndFight} />
      
      {/* 캐릭터 성장 섹션 */}
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px #eee', padding: 24, marginBottom: 16 }}>
        <h3 style={{ textAlign: 'center', marginBottom: 16 }}>📈 캐릭터 성장</h3>
        
        {/* 현재 레벨 정보 */}
        <div style={{ 
          background: '#f8fafc', 
          borderRadius: 8, 
          padding: 16, 
          marginBottom: 16,
          border: `2px solid ${getCurrentLevelData().color}`
        }}>
          <div style={{ textAlign: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 18, fontWeight: 'bold', color: getCurrentLevelData().color }}>
              {getCurrentLevelData().name} (레벨 {characterLevel})
            </div>
            <div style={{ fontSize: 14, color: '#64748b' }}>
              XP: {characterXP} / {levelData.find(l => l.level === characterLevel + 1)?.xpRequired || 'MAX'}
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
            <span>HP: {getCurrentLevelData().hp}</span>
            <span>공격력: {getCurrentLevelData().attack}</span>
            <span>방어력: {getCurrentLevelData().defense}</span>
          </div>
        </div>

        {/* 레벨 진행바 */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 14, color: '#64748b' }}>레벨 진행</span>
            <span style={{ fontSize: 14, color: '#64748b' }}>{characterLevel}/5</span>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {levelData.map(level => (
              <div
                key={level.level}
                style={{
                  flex: 1,
                  height: 8,
                  background: characterLevel >= level.level ? level.color : '#e2e8f0',
                  borderRadius: 4,
                  transition: 'all 0.3s'
                }}
              />
            ))}
          </div>
        </div>

        {/* 리셋 버튼 */}
        <button
          onClick={resetCharacter}
          style={{
            width: '100%',
            padding: 8,
            background: '#6b7280',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            fontSize: 14,
            cursor: 'pointer'
          }}
        >
          🔄 캐릭터 리셋
        </button>
      </div>
      
      {/* 시뮬레이터 */}
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px #eee', padding: 24 }}>
        <h3 style={{ textAlign: 'center', marginBottom: 16 }}>🎮 시뮬레이터</h3>
        <button
          onClick={simulate}
          disabled={isSimulating}
          style={{ width: '100%', padding: 12, background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, fontWeight: '600', fontSize: 16, cursor: isSimulating ? 'not-allowed' : 'pointer', marginBottom: 16 }}
        >
          {isSimulating ? '시뮬레이션 중...' : '전투 시뮬레이션'}
        </button>
        <div style={{ background: '#f8fafc', borderRadius: 8, padding: 12, minHeight: 180, fontFamily: 'monospace', fontSize: 14, color: '#222', marginBottom: 12, maxHeight: 260, overflowY: 'auto' }}>
          {log.length === 0 ? (
            <div style={{ color: '#888', textAlign: 'center' }}>버튼을 눌러 시뮬레이션을 시작하세요.</div>
          ) : (
            log.map((l, i) => <div key={i}>{l}</div>)
          )}
        </div>
        {result && (
          <div style={{ textAlign: 'center', marginTop: 8, fontWeight: '600', color: result.win ? '#059669' : '#dc2626' }}>
            {result.win ? '전투 승리!' : '패배...'}
          </div>
        )}
      </div>
    </div>
  );
}

export default GameSimulator; 