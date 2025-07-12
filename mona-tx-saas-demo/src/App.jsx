import React, { useState, useRef } from 'react';
import CharacterCustomize from './CharacterCustomize';
import MonsterCustomize from './MonsterCustomize';
import XpConditionCustomize from './XpConditionCustomize';
import RewardCustomize from './RewardCustomize';
import DexSwap from './DexSwap';
import CharacterSimulator, { CharacterGrowth } from './CharacterSimulator';
import LendingDeFi from './LendingDeFi';

function App() {
  // 실제로는 로그인한 지갑 주소를 받아서 전달
  const address = "0x1234...abcd";
  const [activeTab, setActiveTab] = useState('character');
  const simulatorRef = useRef();

  // 각 설정값 상태 관리
  const [character, setCharacter] = useState({ hp: 100, attack: 10, defense: 5 });
  const [monster, setMonster] = useState({ hp: 50, attack: 5, defense: 2 });
  const [xpConditions, setXpConditions] = useState([{ contract: '', xp: 20 }]);
  const [rewards, setRewards] = useState([
    { name: '$MON 토큰', amount: 10, probability: 80 },
    { name: 'Monad Eco NFT WL', amount: 1, probability: 20 }
  ]);

  // 캐릭터 성장 상태(레벨, XP)
  const [characterLevel, setCharacterLevel] = useState(1);
  const [characterXP, setCharacterXP] = useState(0);
  // 레벨별 성장 데이터 (CharacterSimulator와 동일하게 유지)
  const levelData = [
    { level: 1, name: '초보자', hp: 100, attack: 10, defense: 5, xpRequired: 0, color: '#6b7280' },
    { level: 2, name: '견습생', hp: 120, attack: 12, defense: 6, xpRequired: 50, color: '#059669' },
    { level: 3, name: '전사', hp: 150, attack: 15, defense: 8, xpRequired: 120, color: '#0891b2' },
    { level: 4, name: '영웅', hp: 200, attack: 20, defense: 12, xpRequired: 250, color: '#7c3aed' },
    { level: 5, name: '전설', hp: 300, attack: 30, defense: 20, xpRequired: 500, color: '#dc2626' }
  ];
  // 성장 리셋 핸들러
  const resetCharacter = () => {
    setCharacterLevel(1);
    setCharacterXP(0);
    if (simulatorRef.current) {
      simulatorRef.current.resetLog && simulatorRef.current.resetLog();
    }
  };

  const tabs = [
    { id: 'character', name: '캐릭터 설정', icon: '👤' },
    { id: 'monster', name: '몬스터 설정', icon: '👹' },
    { id: 'xp', name: 'XP 조건', icon: '⚡' },
    { id: 'reward', name: '보상 설정', icon: '🎁' }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'character':
        return <CharacterCustomize address={address} onChange={setCharacter} />;
      case 'monster':
        return <MonsterCustomize address={address} onChange={setMonster} />;
      case 'xp':
        return <XpConditionCustomize address={address} onChange={setXpConditions} />;
      case 'reward':
        return <RewardCustomize address={address} onChange={setRewards} />;
      default:
        return <CharacterCustomize address={address} onChange={setCharacter} />;
    }
  };

  const handleSwapAndFight = (swapData) => {
    // Swap 완료 시 시뮬레이션 시작
    console.log('Swap completed:', swapData);
    // CharacterSimulator의 시뮬레이션을 트리거
    if (simulatorRef.current) {
      simulatorRef.current.simulate();
    }
  };

  // Lending DeFi용 XP 조건
  const lendingXpConditions = [{ contract: '', xp: 30 }];
  // Lending DeFi 시뮬레이터 ref
  const lendingSimulatorRef = useRef();
  // Lending DeFi에서 Deposit/Borrow 시
  const handleLendAndFight = (lendData) => {
    // XP 30으로 시뮬레이터 실행
    if (lendingSimulatorRef.current) {
      lendingSimulatorRef.current.simulate();
    }
  };

  // DeFi용 캐릭터 이미지 매핑
  const lendingLevelImages = {
    1: '/man1.jpg',
    3: '/man2.png',
    5: '/man3.jpg',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      {/* MonaTxRPG 로고 */}
      <div style={{
        width: '100%',
        textAlign: 'center',
        padding: '32px 0 8px 0',
        fontWeight: 900,
        fontSize: 32,
        letterSpacing: '0.05em',
        color: '#6c54f8',
        fontFamily: 'Pretendard, Montserrat, Roboto, sans-serif',
        textShadow: '0 2px 8px #e0e7ff',
        userSelect: 'none',
      }}>
        MonaTxRPG
      </div>
      {/* 상단: DEX + 캐릭터 성장 + 시뮬레이터 (3분할) */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'row', 
        justifyContent: 'center', 
        alignItems: 'flex-start', 
        gap: 32,
        padding: '40px 20px',
        maxWidth: 1400,
        margin: '0 auto'
      }}>
        {/* 왼쪽: DEX Swap */}
        <div style={{ flex: '0 0 340px' }}>
          <DexSwap onSwapAndFight={handleSwapAndFight} />
        </div>
        {/* 가운데: 캐릭터 성장 */}
        <div style={{ flex: '0 0 340px' }}>
          <CharacterGrowth 
            characterLevel={characterLevel}
            characterXP={characterXP}
            levelData={levelData}
            resetCharacter={resetCharacter}
          />
        </div>
        {/* 오른쪽: 시뮬레이터 */}
        <div style={{ flex: '0 0 340px' }}>
          <CharacterSimulator 
            ref={simulatorRef}
            character={character} 
            monster={monster} 
            xpConditions={xpConditions} 
            rewards={rewards} 
            characterLevel={characterLevel}
            setCharacterLevel={setCharacterLevel}
            characterXP={characterXP}
            setCharacterXP={setCharacterXP}
            levelData={levelData}
          />
        </div>
      </div>

      {/* 하단: Lending DeFi + 캐릭터 성장 + 시뮬레이터 (3분할) */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'row', 
        justifyContent: 'center', 
        alignItems: 'flex-start', 
        gap: 32,
        padding: '40px 20px',
        maxWidth: 1400,
        margin: '0 auto'
      }}>
        {/* 왼쪽: Lending DeFi */}
        <div style={{ flex: '0 0 340px' }}>
          <LendingDeFi onLendAndFight={handleLendAndFight} />
        </div>
        {/* 가운데: 캐릭터 성장 */}
        <div style={{ flex: '0 0 340px' }}>
          <CharacterGrowth 
            characterLevel={characterLevel}
            characterXP={characterXP}
            levelData={levelData}
            resetCharacter={resetCharacter}
            levelImages={lendingLevelImages}
          />
        </div>
        {/* 오른쪽: 시뮬레이터 */}
        <div style={{ flex: '0 0 340px' }}>
          <CharacterSimulator 
            ref={lendingSimulatorRef}
            character={character} 
            monster={monster} 
            xpConditions={lendingXpConditions} 
            rewards={rewards} 
            characterLevel={characterLevel}
            setCharacterLevel={setCharacterLevel}
            characterXP={characterXP}
            setCharacterXP={setCharacterXP}
            levelData={levelData}
            monsterImage={"/imgbin-evolve-video-game-monster-youtube-cookie-monster-0GAs3m5fUnUtG06wuRdKuNqje-removebg-preview.png"}
          />
        </div>
      </div>

      {/* 하단: 설정 네비게이터 */}
      <div style={{ 
        background: '#fff', 
        borderTop: '1px solid #e2e8f0',
        padding: '20px 0'
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px' }}>
          {/* 네비게이터 */}
          <div style={{ 
            background: '#fff', 
            borderBottom: '1px solid #e2e8f0',
            padding: '0 20px',
            marginBottom: 24
          }}>
            <div style={{ display: 'flex', gap: 0, overflowX: 'auto', padding: '0 10px' }}>
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: '16px 24px',
                    background: activeTab === tab.id ? '#6c54f8' : 'transparent',
                    color: activeTab === tab.id ? '#fff' : '#64748b',
                    border: 'none',
                    borderBottom: activeTab === tab.id ? '3px solid #6c54f8' : '3px solid transparent',
                    cursor: 'pointer',
                    fontWeight: activeTab === tab.id ? '600' : '500',
                    fontSize: '14px',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s',
                    minWidth: '120px'
                  }}
                >
                  <span style={{ marginRight: '8px', fontSize: '16px' }}>{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
            </div>
          </div>
          
          {/* 설정 콘텐츠 */}
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App; 