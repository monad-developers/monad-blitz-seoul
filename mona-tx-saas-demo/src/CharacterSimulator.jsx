import React, { useState, useImperativeHandle, forwardRef } from 'react';
import './CharacterSimulator.css'; // 스타일 분리 적용(없으면 새로 생성)

// 레벨별 이미지 매핑
const levelImages = {
  1: '/illust-okku-detail-1.png',
  3: '/illust-okku-detail-2.png',
  5: '/illust-okku-detail-3.png',
};

function getLevelImage(level) {
  if (level >= 5) return levelImages[5];
  if (level >= 3) return levelImages[3];
  return levelImages[1];
}

const CHEST_IMG = '/pngtree-game-flash-treasure-chest-free-buckle-element-decorative-material-png-image_14057757.png';

const CharacterSimulator = forwardRef(({
  character, monster, xpConditions, rewards,
  characterLevel, setCharacterLevel, characterXP, setCharacterXP, levelData,
  monsterImage
}, ref) => {
  const [log, setLog] = useState([]);
  const [result, setResult] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isMonsterHit, setIsMonsterHit] = useState(false);
  // 보상 상자 팝업 상태
  const [isRewardOpen, setIsRewardOpen] = useState(false);
  const [rewardResult, setRewardResult] = useState(null);
  const [pendingRewardLevel, setPendingRewardLevel] = useState(null);

  const getCurrentLevelData = () => {
    return levelData.find(l => l.level === characterLevel) || levelData[0];
  };

  // 보상 뽑기 함수
  function openRewardBox() {
    if (!rewards || rewards.length === 0) return;
    // 보상 중 1개를 확률에 따라 랜덤으로 뽑음
    const totalProb = rewards.reduce((sum, r) => sum + r.probability, 0);
    const rand = Math.random() * totalProb;
    let acc = 0;
    let selected = null;
    for (let r of rewards) {
      acc += r.probability;
      if (rand <= acc) {
        selected = r;
        break;
      }
    }
    setRewardResult(selected);
  }

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
    let leveledUp = false;
    let nextLevel = null;
    
    logs.push(`🎮 전투 시작!`);
    logs.push(`👤 ${currentLevelData.name} (레벨 ${characterLevel})`);
    logs.push(`HP: ${charHp} | 공격력: ${charAtk} | 방어력: ${charDef}`);
    
    function monsterHitEffect() {
      setIsMonsterHit(true);
      setTimeout(() => setIsMonsterHit(false), 300);
    }

    while (charHp > 0 && monHp > 0) {
      logs.push(`\n🔄 라운드 ${round}`);
      // 캐릭터 공격
      const cDmg = Math.max(1, charAtk - monDef);
      monHp -= cDmg;
      logs.push(`⚔️ ${currentLevelData.name}의 공격! 몬스터에게 ${cDmg} 데미지`);
      monsterHitEffect();
      if (monHp <= 0) {
        logs.push(`💀 몬스터가 쓰러졌습니다!`);
        break;
      }
      // 몬스터 반격
      const mDmg = Math.max(1, monAtk - charDef);
      charHp -= mDmg;
      logs.push(`🛡️ 몬스터의 반격! ${currentLevelData.name}에게 ${mDmg} 데미지`);
      if (charHp <= 0) {
        logs.push(`❌ ${currentLevelData.name}이(가) 쓰러졌습니다!`);
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
        nextLevel = levelData.find(l => l.xpRequired > newXP && l.level > characterLevel);
        if (nextLevel) {
          logs.push(`\n🌟 레벨업! ${currentLevelData.name} → ${nextLevel.name}`);
          logs.push(`HP: ${currentLevelData.hp} → ${nextLevel.hp}`);
          logs.push(`공격력: ${currentLevelData.attack} → ${nextLevel.attack}`);
          logs.push(`방어력: ${currentLevelData.defense} → ${nextLevel.defense}`);
          setCharacterLevel(nextLevel.level);
          leveledUp = true;
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
    // 레벨업 시 보상 상자 팝업
    if (leveledUp && nextLevel) {
      setTimeout(() => {
        setIsRewardOpen(true);
        setRewardResult(null);
        setPendingRewardLevel(nextLevel.level);
      }, 500);
    }
  };

  // 외부에서 simulate 함수를 호출할 수 있도록 ref 노출
  useImperativeHandle(ref, () => ({
    simulate,
    resetLog: () => { setLog([]); setResult(null); }
  }));

  return (
    <div style={{ minWidth: 340, maxWidth: 400, margin: '0 auto', position: 'relative' }}>
      {/* 보상 상자 팝업 오버레이 */}
      {isRewardOpen && (
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.35)',
          zIndex: 10,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 32, boxShadow: '0 4px 24px #0002', textAlign: 'center', minWidth: 240 }}>
            <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>🎁 레벨 {pendingRewardLevel} 보상 오픈!</div>
            <img src={CHEST_IMG} alt="보상 상자" style={{ width: 100, marginBottom: 16 }} />
            {!rewardResult ? (
              <button
                onClick={openRewardBox}
                style={{ padding: '12px 32px', background: '#f59e42', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 18, cursor: 'pointer', marginBottom: 8 }}
              >
                오픈하기
              </button>
            ) : (
              <div style={{ margin: '16px 0', fontSize: 18 }}>
                <div style={{ marginBottom: 8 }}>✨ {rewardResult.name} x{rewardResult.amount} 획득!</div>
                <button
                  onClick={() => setIsRewardOpen(false)}
                  style={{ padding: '8px 24px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 16, cursor: 'pointer' }}
                >
                  닫기
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      {/* 시뮬레이터 카드 */}
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px #eee', padding: 24 }}>
        <h3 style={{ textAlign: 'center', marginBottom: 16 }}>🎮 시뮬레이터</h3>
        {/* 몬스터 이미지 - 버튼 위로 이동, 흰색 원형 배경 추가 */}
        <div style={{
          position: 'relative',
          textAlign: 'center',
          marginBottom: 16,
          width: 140,
          height: 140,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {/* 흰색 원형 배경 */}
          <div style={{
            position: 'absolute',
            top: 0, left: 0, width: 140, height: 140,
            background: '#fff',
            borderRadius: '50%',
            boxShadow: '0 2px 8px #eee',
            zIndex: 1
          }} />
          {/* 몬스터 이미지 */}
          <img
            src={monsterImage || "/monster.png"}
            alt="몬스터"
            className={isMonsterHit ? 'monster-hit' : ''}
            style={{
              width: 120, height: 120, objectFit: 'contain',
              position: 'relative', zIndex: 2
            }}
          />
        </div>
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
});

export default CharacterSimulator;

export const CharacterGrowth = ({ characterLevel, characterXP, levelData, resetCharacter, levelImages }) => {
  // 기본 이미지 매핑 (기존)
  const defaultImages = {
    1: '/illust-okku-detail-1.png',
    3: '/illust-okku-detail-2.png',
    5: '/illust-okku-detail-3.png',
  };
  const images = levelImages || defaultImages;
  function getLevelImage(level) {
    if (level >= 5) return images[5];
    if (level >= 3) return images[3];
    return images[1];
  }
  return (
    <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px #eee', padding: 24, marginBottom: 16 }}>
      <h3 style={{ textAlign: 'center', marginBottom: 16 }}>📈 캐릭터 성장</h3>
      {/* 성장 단계별 캐릭터 이미지 */}
      <img
        src={getLevelImage(characterLevel)}
        alt={`레벨 ${characterLevel} 캐릭터`}
        style={{ width: '120px', margin: '0 auto', display: 'block', marginBottom: 16 }}
      />
      {/* 현재 레벨 정보 */}
      <div style={{ 
        background: '#f8fafc', 
        borderRadius: 8, 
        padding: 16, 
        marginBottom: 16,
        border: `2px solid ${levelData.find(l => l.level === characterLevel)?.color || '#e2e8f0'}`
      }}>
        <div style={{ textAlign: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 18, fontWeight: 'bold', color: levelData.find(l => l.level === characterLevel)?.color }}>
            {levelData.find(l => l.level === characterLevel)?.name} (레벨 {characterLevel})
          </div>
          <div style={{ fontSize: 14, color: '#64748b' }}>
            XP: {characterXP} / {levelData.find(l => l.level === characterLevel + 1)?.xpRequired || 'MAX'}
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
          <span>HP: {levelData.find(l => l.level === characterLevel)?.hp}</span>
          <span>공격력: {levelData.find(l => l.level === characterLevel)?.attack}</span>
          <span>방어력: {levelData.find(l => l.level === characterLevel)?.defense}</span>
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
  );
}; 