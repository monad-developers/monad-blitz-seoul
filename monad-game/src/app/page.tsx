"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAccount } from "wagmi";
import { WalletConnectButton } from "@/app/components/wallet-connect-button";
import axios from "axios";
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

// const backendAxiosInstance = axios.create({
//   baseURL: `${process.env.NEXT_PUBLIC_BACKEND_URL}`,
//   headers: {
//     Accept: "application/json",
//   },
// });

export default function ClickerGame() {
  const { address, isConnected } = useAccount();

  const [showTitle, setShowTitle] = useState(true);
  // const [xp, setXp] = useState(0);
  // const [lv, setLv] = useState(1);
  // const [power, setPower] = useState(1);
  // const [enemyMaxHp, setEnemyMaxHp] = useState(100);
  const [lv, setLv] = useState(1);
  const [power, setPower] = useState(50);
  const [gold, setGold] = useState(0);
  const [enemyHp, setEnemyHp] = useState(100);
  const [enemyMaxHp, setEnemyMaxHp] = useState(100);
  const [showCoin, setShowCoin] = useState(false);
  const [isAttacking, setIsAttacking] = useState(false);
  const [isEnemyDead, setIsEnemyDead] = useState(false);

  const [damageTexts, setDamageTexts] = useState<{ id: number }[]>([]);
  const damageIdRef = useRef(0);

  const containerRef = useRef<HTMLDivElement>(null);

  const WORLD_WIDTH = 800;
  const WORLD_HEIGHT = 600;

  useEffect(() => {
    if (enemyHp <= 0 && !isEnemyDead) {
      setShowCoin(true);
      setTimeout(() => setShowCoin(false), 1000);

      setIsEnemyDead(true);

      // 잠시 후 다시 부활
      setTimeout(() => {
        setEnemyHp(enemyMaxHp);
        setIsEnemyDead(false);
      }, 2000); // 2초 후 부활
    }
  }, [enemyHp, isEnemyDead, enemyMaxHp]);

  const handleClick = () => {
    attack();
  };

  const attack = () => {
    if (isAttacking) return;
    // setXp((prev) => prev + 1);
    setIsAttacking(true);

    const id = damageIdRef.current++;
    setDamageTexts((prev) => [...prev, { id }]);
    // setEnemyHp((prev) => prev - power);

    // 🔥 1초 후 제거
    setTimeout(() => {
      setDamageTexts((prev) => prev.filter((d) => d.id !== id));
    }, 1000);
  };

  useEffect(() => {
    if (isConnected)
      axios
        .post(`${BACKEND_URL}/api/monad/user`, { address: address })
        .then((res) => {
          console.log(res.data);
          setLv(res.data.lv);
          setGold(res.data.gold);
          setPower(res.data.power);
          setEnemyHp(res.data.enemyHp);
          setEnemyMaxHp(res.data.enemyMaxHp);
          if (res.status === 200) {
            setShowTitle(false);
          }
        });
    else {
      setShowTitle(false);
    }
  }, [address, isConnected]);

  useEffect(() => {
    if (address) {
      setInterval(() => {
        attack();
        axios
          .post(`${BACKEND_URL}/api/monad/user/attack`, {
            address: address,
          })
          .then((res) => {
            console.log(res.data);
            setLv(res.data.lv);
            setGold(res.data.gold);
            setPower(res.data.power);
            setEnemyHp(res.data.enemyHp);
            setEnemyMaxHp(res.data.enemyMaxHp);
          });
      }, 5000);
    }
  }, [address]);

  useEffect(() => {
    if (isAttacking) {
      const timeout = setTimeout(() => {
        setIsAttacking(false);
      }, 600);
      return () => clearTimeout(timeout);
    }
  }, [isAttacking]);

  useEffect(() => {
    setInterval(() => {}, 3000);
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-[800px] h-[600px] bg-black flex items-center justify-center overflow-hidden"
      onClick={handleClick}
    >
      {showTitle ? (
        // ---------- 🎮 타이틀 화면 ----------
        <div className="w-full h-full flex items-center justify-center bg-black text-white cursor-pointer">
          <WalletConnectButton />
        </div>
      ) : (
        // ---------- 🕹 게임 화면 ----------
        <div
          className="relative"
          style={{
            width: `${WORLD_WIDTH}px`,
            height: `${WORLD_HEIGHT}px`,
            transformOrigin: "top left",
          }}
        >
          {/* 배경 */}
          <div
            className="absolute inset-0 z-0 bg-cover bg-no-repeat w-[800px] h-[600px]"
            style={{
              backgroundImage: "url(/assets/Background/Desert.png)",
            }}
          />

          {/* 플레이어 상태 (좌상단) */}
          <div
            className="absolute text-yellow-300 text-xl font-bold z-10"
            style={{ top: "30px", left: "30px" }}
          >
            <div className="flex flex-col">
              <span>LV: {lv}</span>
              {/*<span>XP: {xp}</span>*/}
              <span>PW: {power}</span>
              <span>GOLD: {gold}</span>
            </div>
          </div>

          {/* 캐릭터 (밴디트) */}
          <div
            className="absolute z-10 cursor-pointer"
            style={{
              top: "360px",
              left: "0px",
              transform: "scaleX(-1)",
            }}
          >
            {isAttacking ? (
              <div
                className="w-[160px] h-[160px] bandit-attack"
                style={{ transform: "translateX(-50px)" }}
              />
            ) : (
              <div className="w-[160px] h-[160px] bandit-idle" />
            )}
          </div>

          {/* 보스 */}
          <div
            className={`absolute z-10 transition-all duration-200 ${
              isAttacking ? "boss-hit" : ""
            }`}
            style={{
              top: "310px",
              left: "600px",
              transformOrigin: "center bottom",
              transform: `scale(${1 + (lv - 1) * 0.05})`,
              opacity: isEnemyDead ? 0 : 1,
              transition: "opacity 0.5s ease",
            }}
          >
            <div className="w-[160px] h-[210px] boss">
              <div className="absolute top-[-20px] left-[90px] transform -translate-x-1/2 w-[100px] h-[10px] bg-gray-600 rounded overflow-hidden z-10 border border-black">
                <div
                  className="h-full bg-red-500 transition-all duration-300"
                  style={{
                    width: `${Math.max(0, (enemyHp / enemyMaxHp) * 100)}%`,
                  }}
                />
              </div>

              {/* ✨ 파티클 효과 */}
              <div className="absolute inset-0 pointer-events-none z-1">
                {isEnemyDead && (
                  <div className="absolute w-full h-full particle-fade" />
                )}
              </div>

              {/* 💥 데미지 텍스트 */}
              {damageTexts.map((d) => (
                <div
                  key={d.id}
                  className="absolute text-red-500 font-bold text-lg animate-damage z-100"
                  style={{
                    top: "-20px",
                    left: "50%",
                    transform: `translateX(-50%) scale(${1 + (lv - 1) * 0.05})`,
                    fontSize: "40px",
                  }}
                >
                  {-power}
                </div>
              ))}
            </div>

            {showCoin && (
              <div className="absolute top-[-50px] left-[70px] w-[40px] h-[40px] z-30 coin animate-coinSpin" />
            )}
          </div>

          <style jsx>{`
            .coin {
              background-image: url("/assets/Icons/Coin.png");
              background-repeat: no-repeat;
              background-size: 1000px 40px;
            }

            @keyframes coinSpin {
              0% {
                opacity: 0;
                transform: translate(0%, 0px) scale(1);
              }
              10% {
                opacity: 1;
              }
              100% {
                opacity: 0;
                transform: translate(0%, -60px) scale(1.2);
              }
            }

            .animate-coinSpin {
              animation: coinSpin 1s ease-out forwards;
            }

            @keyframes particleFadeOut {
              0% {
                opacity: 1;
                transform: scale(1);
                filter: drop-shadow(0 0 10px red);
              }
              100% {
                opacity: 0;
                transform: scale(1.5);
                filter: drop-shadow(0 0 30px red);
              }
            }

            .particle-fade {
              animation: particleFadeOut 1s ease-out forwards;
              background: radial-gradient(
                circle,
                rgba(255, 0, 0, 0.7),
                transparent 60%
              );
              border-radius: 50%;
            }
            @keyframes floatUpFade {
              0% {
                opacity: 1;
                transform: translate(-50%, 0);
              }
              100% {
                opacity: 0;
                transform: translate(-50%, -40px);
              }
            }

            .animate-damage {
              animation: floatUpFade 1s ease-out forwards;
              pointer-events: none;
            }

            .boss {
              background-image: url("/assets/Characters/BossOutline.png");
              background-repeat: no-repeat;
              background-size: 160px 210px;
              transition: filter 0.2s ease;
            }

            .boss-hit .boss {
              animation: bossShake 0.2s ease;
              filter: brightness(1.2) drop-shadow(0 0 10px red);
            }

            @keyframes bossShake {
              0% {
                transform: translateX(0px);
              }
              25% {
                transform: translateX(-5px);
              }
              50% {
                transform: translateX(5px);
              }
              75% {
                transform: translateX(-5px);
              }
              100% {
                transform: translateX(0px);
              }
            }

            .bandit-idle {
              background-image: url("/assets/Characters/Bandit_Idle.png");
              background-repeat: no-repeat;
              background-size: 480px 160px;
              animation: banditIdle 0.6s steps(3) infinite;
            }

            @keyframes banditIdle {
              from {
                background-position: 0px 0px;
              }
              to {
                background-position: -480px 0px;
              }
            }

            .bandit-attack {
              background-image: url("/assets/Characters/Bandit_Attack.png");
              background-repeat: no-repeat;
              background-size: 1751px 160px;
              animation: banditAttack 0.6s steps(11) forwards;
            }

            @keyframes banditAttack {
              from {
                background-position: 0px 0px;
              }
              to {
                background-position: -1751px 0px;
              }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
