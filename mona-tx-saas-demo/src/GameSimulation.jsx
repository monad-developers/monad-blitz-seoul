import React, { useState, useEffect } from 'react';

function GameSimulation({ address }) {
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationLog, setSimulationLog] = useState([]);
  const [characterStats, setCharacterStats] = useState({
    name: '용사',
    level: 1,
    xp: 0,
    hp: 100,
    attack: 15,
    defense: 10
  });
  const [monsterStats, setMonsterStats] = useState({
    name: '고블린',
    hp: 50,
    attack: 8,
    defense: 5,
    xpReward: 20
  });
  const [rewards, setRewards] = useState([
    { name: '골드', amount: 100, probability: 80 },
    { name: '체력 포션', amount: 1, probability: 30 },
    { name: '레어 아이템', amount: 1, probability: 10 }
  ]);

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setSimulationLog(prev => [...prev, { message, type, timestamp }]);
  };

  const simulateBattle = async () => {
    setIsSimulating(true);
    setSimulationLog([]);
    
    addLog('🎮 전투 시뮬레이션 시작!', 'start');
    await delay(1000);

    // 전투 시작
    addLog(`⚔️ ${characterStats.name}이(가) ${monsterStats.name}을(를) 발견했습니다!`, 'battle');
    await delay(800);

    let monsterHp = monsterStats.hp;
    let characterHp = characterStats.hp;
    let round = 1;

    while (monsterHp > 0 && characterHp > 0) {
      addLog(`\n🔄 라운드 ${round}`, 'round');
      await delay(500);

      // 캐릭터 공격
      const characterDamage = Math.max(1, characterStats.attack - monsterStats.defense);
      monsterHp -= characterDamage;
      addLog(`⚔️ ${characterStats.name}의 공격! ${monsterStats.name}에게 ${characterDamage} 데미지!`, 'attack');
      await delay(600);

      if (monsterHp <= 0) {
        addLog(`💀 ${monsterStats.name}이(가) 쓰러졌습니다!`, 'victory');
        break;
      }

      // 몬스터 반격
      const monsterDamage = Math.max(1, monsterStats.attack - characterStats.defense);
      characterHp -= monsterDamage;
      addLog(`🛡️ ${monsterStats.name}의 반격! ${characterStats.name}에게 ${monsterDamage} 데미지!`, 'defense');
      await delay(600);

      if (characterHp <= 0) {
        addLog(`💀 ${characterStats.name}이(가) 쓰러졌습니다!`, 'defeat');
        break;
      }

      round++;
    }

    if (characterHp > 0) {
      // 승리 처리
      await delay(1000);
      addLog(`\n🎉 전투 승리!`, 'victory');
      await delay(500);

      // XP 획득
      addLog(`⚡ XP ${monsterStats.xpReward} 획득!`, 'xp');
      await delay(600);

      // 레벨업 체크
      const newXp = characterStats.xp + monsterStats.xpReward;
      const newLevel = Math.floor(newXp / 100) + 1;
      
      if (newLevel > characterStats.level) {
        addLog(`🌟 레벨업! ${characterStats.level} → ${newLevel}`, 'levelup');
        setCharacterStats(prev => ({
          ...prev,
          level: newLevel,
          attack: prev.attack + 2,
          defense: prev.defense + 1,
          hp: prev.hp + 10
        }));
      } else {
        setCharacterStats(prev => ({ ...prev, xp: newXp }));
      }
      await delay(800);

      // 보상 획득
      addLog(`\n🎁 보상 획득:`, 'reward');
      await delay(500);

      rewards.forEach(reward => {
        const random = Math.random() * 100;
        if (random <= reward.probability) {
          addLog(`✅ ${reward.name} ${reward.amount}개 획득! (${reward.probability}% 확률)`, 'reward');
        } else {
          addLog(`❌ ${reward.name} 획득 실패 (${reward.probability}% 확률)`, 'fail');
        }
      });
      await delay(600);

      addLog(`\n🏁 시뮬레이션 완료!`, 'complete');
    }

    setIsSimulating(false);
  };

  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const clearLog = () => {
    setSimulationLog([]);
  };

  const getLogStyle = (type) => {
    const styles = {
      start: { color: '#059669', fontWeight: 'bold' },
      battle: { color: '#dc2626', fontWeight: '600' },
      attack: { color: '#ea580c' },
      defense: { color: '#0891b2' },
      victory: { color: '#059669', fontWeight: 'bold' },
      defeat: { color: '#dc2626', fontWeight: 'bold' },
      xp: { color: '#f59e0b', fontWeight: '600' },
      levelup: { color: '#7c3aed', fontWeight: 'bold' },
      reward: { color: '#059669' },
      fail: { color: '#6b7280' },
      complete: { color: '#1e40af', fontWeight: 'bold' },
      round: { color: '#374151', fontWeight: '600' },
      info: { color: '#374151' }
    };
    return styles[type] || styles.info;
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px #eee', padding: 32 }}>
      <h2 style={{ textAlign: 'center', marginBottom: 24 }}>🎮 게임 시뮬레이션</h2>
      
      {address && (
        <div style={{ textAlign: 'center', color: '#0a0', fontWeight: 600, marginBottom: 16, fontSize: 14 }}>
          연결된 지갑: {address}
        </div>
      )}

      {/* 캐릭터 & 몬스터 정보 */}
      <div style={{ display: 'flex', gap: 20, marginBottom: 24 }}>
        <div style={{ flex: 1, background: '#f0f9ff', padding: 16, borderRadius: 8 }}>
          <h3 style={{ margin: '0 0 12px 0', color: '#0369a1' }}>👤 캐릭터</h3>
          <div style={{ fontSize: 14 }}>
            <div>이름: {characterStats.name}</div>
            <div>레벨: {characterStats.level}</div>
            <div>XP: {characterStats.xp}</div>
            <div>HP: {characterStats.hp}</div>
            <div>공격력: {characterStats.attack}</div>
            <div>방어력: {characterStats.defense}</div>
          </div>
        </div>
        
        <div style={{ flex: 1, background: '#fef2f2', padding: 16, borderRadius: 8 }}>
          <h3 style={{ margin: '0 0 12px 0', color: '#dc2626' }}>👹 몬스터</h3>
          <div style={{ fontSize: 14 }}>
            <div>이름: {monsterStats.name}</div>
            <div>HP: {monsterStats.hp}</div>
            <div>공격력: {monsterStats.attack}</div>
            <div>방어력: {monsterStats.defense}</div>
            <div>XP 보상: {monsterStats.xpReward}</div>
          </div>
        </div>
      </div>

      {/* 보상 정보 */}
      <div style={{ background: '#f0fdf4', padding: 16, borderRadius: 8, marginBottom: 24 }}>
        <h3 style={{ margin: '0 0 12px 0', color: '#059669' }}>🎁 보상 목록</h3>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {rewards.map((reward, idx) => (
            <div key={idx} style={{ 
              background: '#fff', 
              padding: '8px 12px', 
              borderRadius: 6, 
              fontSize: 13,
              border: '1px solid #d1fae5'
            }}>
              {reward.name} x{reward.amount} ({reward.probability}%)
            </div>
          ))}
        </div>
      </div>

      {/* 컨트롤 버튼 */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <button
          onClick={simulateBattle}
          disabled={isSimulating}
          style={{
            padding: '12px 24px',
            background: isSimulating ? '#9ca3af' : '#6366f1',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontWeight: '600',
            fontSize: 16,
            cursor: isSimulating ? 'not-allowed' : 'pointer'
          }}
        >
          {isSimulating ? '시뮬레이션 중...' : '🎮 전투 시뮬레이션 시작'}
        </button>
        
        <button
          onClick={clearLog}
          style={{
            padding: '12px 24px',
            background: '#6b7280',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontWeight: '600',
            fontSize: 16,
            cursor: 'pointer'
          }}
        >
          🗑️ 로그 지우기
        </button>
      </div>

      {/* 시뮬레이션 로그 */}
      <div style={{ 
        background: '#1f2937', 
        color: '#f9fafb', 
        padding: 16, 
        borderRadius: 8,
        maxHeight: 400,
        overflowY: 'auto',
        fontFamily: 'monospace',
        fontSize: 14,
        lineHeight: 1.5
      }}>
        {simulationLog.length === 0 ? (
          <div style={{ color: '#9ca3af', textAlign: 'center' }}>
            시뮬레이션을 시작하면 전투 로그가 여기에 표시됩니다.
          </div>
        ) : (
          simulationLog.map((log, idx) => (
            <div key={idx} style={{ marginBottom: 4 }}>
              <span style={{ color: '#6b7280', fontSize: 12 }}>[{log.timestamp}]</span>
              <span style={getLogStyle(log.type)}> {log.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default GameSimulation; 