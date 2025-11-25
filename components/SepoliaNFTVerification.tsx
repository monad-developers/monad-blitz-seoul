'use client';

import { useState, useEffect } from 'react';
import { useAccount, useSwitchChain, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { sepolia } from '@/lib/chains';
import { MinecraftButton } from '../src/components/minecraft/MinecraftButton';
import { decodeEventLog, parseEventLogs } from 'viem';

interface NFTInfo {
  tokenId: bigint;
  contractAddress: string;
}

interface SepoliaNFTVerificationProps {
  onMessageSent?: (messageId: string) => void;
}

export function SepoliaNFTVerification({ onMessageSent }: SepoliaNFTVerificationProps) {
  const { address, chain } = useAccount();
  const { switchChain } = useSwitchChain();
  const [nfts, setNfts] = useState<NFTInfo[]>([]);
  const [selectedNFT, setSelectedNFT] = useState<NFTInfo | null>(null);
  const [attestationId, setAttestationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>('idle');
  const [ccipFee, setCcipFee] = useState<bigint>(BigInt(0));

  const SEPOLIA_CHAIN_ID = 11155111;
  const SEPOLIA_NFT_CONTRACT = process.env.NEXT_PUBLIC_SEPOLIA_NFT_CONTRACT || '';
  const VERIFIER_ADDRESS = process.env.NEXT_PUBLIC_SEPOLIA_VERIFIER_ADDRESS || '';
  const MONAD_CHAIN_SELECTOR = process.env.NEXT_PUBLIC_MONAD_CHAIN_SELECTOR || '2183018362218727504';
  const MONAD_CCIP_RECEIVER = process.env.NEXT_PUBLIC_MONAD_CCIP_RECEIVER_ADDRESS || '';

  // NFT Verifier ABI (필요한 함수 및 이벤트)
  const VERIFIER_ABI = [
    {
      name: 'createAttestation',
      type: 'function',
      stateMutability: 'nonpayable',
      inputs: [
        { name: 'nftContract', type: 'address' },
        { name: 'tokenId', type: 'uint256' }
      ],
      outputs: [{ name: 'attestationId', type: 'bytes32' }]
    },
    {
      name: 'bridgeAttestation',
      type: 'function',
      stateMutability: 'payable',
      inputs: [
        { name: 'attestationId', type: 'bytes32' },
        { name: 'destinationChainSelector', type: 'uint64' },
        { name: 'receiver', type: 'address' }
      ],
      outputs: [{ name: 'messageId', type: 'bytes32' }]
    },
    {
      name: 'estimateFee',
      type: 'function',
      stateMutability: 'view',
      inputs: [
        { name: 'attestationId', type: 'bytes32' },
        { name: 'destinationChainSelector', type: 'uint64' },
        { name: 'receiver', type: 'address' }
      ],
      outputs: [{ name: 'fee', type: 'uint256' }]
    },
    {
      name: 'AttestationCreated',
      type: 'event',
      inputs: [
        { name: 'attestationId', type: 'bytes32', indexed: true },
        { name: 'owner', type: 'address', indexed: true },
        { name: 'nftContract', type: 'address', indexed: false },
        { name: 'tokenId', type: 'uint256', indexed: false }
      ]
    }
  ] as const;

  // Attestation 생성
  const { data: attestationHash, writeContract: createAttestation } = useWriteContract();
  const { isSuccess: isAttestationCreated, data: attestationReceipt } = useWaitForTransactionReceipt({
    hash: attestationHash,
  });

  // CCIP 브릿징
  const { data: bridgeHash, writeContract: bridgeAttestation } = useWriteContract();
  const { isSuccess: isBridgeSuccess, data: bridgeReceipt } = useWaitForTransactionReceipt({
    hash: bridgeHash,
  });

  // CCIP 수수료 견적 (attestationId가 있을 때만)
  const { data: feeEstimate } = useReadContract({
    address: VERIFIER_ADDRESS as `0x${string}`,
    abi: VERIFIER_ABI,
    functionName: 'estimateFee',
    args: attestationId && MONAD_CCIP_RECEIVER ? [
      attestationId as `0x${string}`,
      BigInt(MONAD_CHAIN_SELECTOR),
      MONAD_CCIP_RECEIVER as `0x${string}`
    ] : undefined,
    query: {
      enabled: !!attestationId && !!MONAD_CCIP_RECEIVER && !!VERIFIER_ADDRESS
    }
  });

  // NFT 소유권 확인
  useEffect(() => {
    if (address && chain?.id === SEPOLIA_CHAIN_ID) {
      checkNFTOwnership();
    }
  }, [address, chain]);

  async function checkNFTOwnership() {
    if (!SEPOLIA_NFT_CONTRACT) {
      setStatus('no-config');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/ccip/check-sepolia-nft?address=${address}`);
      const data = await response.json();

      if (data.hasNFT) {
        setNfts(data.tokenIds.map((id: number) => ({
          tokenId: BigInt(id),
          contractAddress: SEPOLIA_NFT_CONTRACT
        })));
        setStatus('nft-found');
      } else {
        setStatus('no-nft');
      }
    } catch (error) {
      console.error('NFT check failed:', error);
      setStatus('error');
    } finally {
      setLoading(false);
    }
  }

  // Attestation 생성 성공 시 - receipt에서 attestationId 추출
  useEffect(() => {
    if (isAttestationCreated && attestationReceipt && attestationReceipt.logs) {
      try {
        // AttestationCreated 이벤트 찾기
        for (const log of attestationReceipt.logs) {
          try {
            const decoded = decodeEventLog({
              abi: VERIFIER_ABI,
              data: log.data,
              topics: log.topics,
            });

            if (decoded.eventName === 'AttestationCreated') {
              const extractedAttestationId = decoded.args.attestationId as string;
              console.log('✅ Attestation ID extracted:', extractedAttestationId);
              setAttestationId(extractedAttestationId);
              setStatus('attestation-created');
              break;
            }
          } catch (err) {
            // 다른 이벤트일 수 있으므로 계속 진행
            continue;
          }
        }
      } catch (error) {
        console.error('Failed to extract attestationId from receipt:', error);
        setStatus('attestation-created'); // 실패해도 상태는 업데이트
      }
    }
  }, [isAttestationCreated, attestationReceipt]);

  // CCIP 수수료 업데이트
  useEffect(() => {
    if (feeEstimate !== undefined) {
      console.log('💰 CCIP Fee estimated:', feeEstimate.toString());
      setCcipFee(feeEstimate as bigint);
    }
  }, [feeEstimate]);

  // Bridge 성공 시 - receipt에서 CCIP messageId 추출
  useEffect(() => {
    if (isBridgeSuccess && bridgeReceipt && bridgeReceipt.logs) {
      try {
        // CCIP Router ABI - CCIPSendRequested 이벤트
        const ccipRouterABI = [
          {
            name: 'CCIPSendRequested',
            type: 'event',
            inputs: [
              { name: 'message', type: 'tuple', components: [
                { name: 'receiver', type: 'bytes' },
                { name: 'data', type: 'bytes' },
                { name: 'tokenAmounts', type: 'tuple[]', components: [
                  { name: 'token', type: 'address' },
                  { name: 'amount', type: 'uint256' }
                ]},
                { name: 'feeToken', type: 'address' },
                { name: 'extraArgs', type: 'bytes' }
              ], indexed: false },
              { name: 'destinationChainSelector', type: 'uint64', indexed: true },
              { name: 'messageId', type: 'bytes32', indexed: true },
              { name: 'gasLimit', type: 'uint256', indexed: false },
              { name: 'feeTokenAmount', type: 'uint256', indexed: false }
            ]
          }
        ] as const;

        // 로그에서 CCIPSendRequested 이벤트 찾기
        let ccipMessageId: string | null = null;
        for (const log of bridgeReceipt.logs) {
          try {
            const decoded = decodeEventLog({
              abi: ccipRouterABI,
              data: log.data,
              topics: log.topics,
            });

            if (decoded.eventName === 'CCIPSendRequested') {
              ccipMessageId = decoded.args.messageId as string;
              console.log('✅ CCIP Message ID extracted:', ccipMessageId);
              break;
            }
          } catch (err) {
            // 다른 이벤트일 수 있으므로 계속 진행
            continue;
          }
        }

        // messageId를 찾지 못한 경우 fallback으로 attestationId 사용
        // (이 경우 monitor API에서 제대로 추적되지 않을 수 있음)
        const messageIdToUse = ccipMessageId || bridgeHash;

        setStatus('ccip-sent');
        if (messageIdToUse) {
          onMessageSent?.(messageIdToUse);
        }

        // DB에 기록
        if (address && selectedNFT) {
          fetch('/api/ccip/record-message', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              monadAddress: address,
              sepoliaNFTAddress: SEPOLIA_NFT_CONTRACT,
              sepoliaTokenId: selectedNFT.tokenId.toString(),
              ccipMessageId: messageIdToUse,
              attestationId,
              sepoliaTxHash: bridgeHash
            })
          }).catch(console.error);
        }
      } catch (error) {
        console.error('Failed to extract CCIP messageId from receipt:', error);
        setStatus('ccip-sent');
        if (bridgeHash) {
          onMessageSent?.(bridgeHash);
        }
      }
    }
  }, [isBridgeSuccess, bridgeReceipt]);

  function handleCreateAttestation() {
    if (!selectedNFT || !VERIFIER_ADDRESS) return;

    createAttestation({
      address: VERIFIER_ADDRESS as `0x${string}`,
      abi: VERIFIER_ABI,
      functionName: 'createAttestation',
      args: [SEPOLIA_NFT_CONTRACT as `0x${string}`, selectedNFT.tokenId]
    });
  }

  function handleBridgeAttestation() {
    if (!attestationId || !VERIFIER_ADDRESS || !MONAD_CCIP_RECEIVER) return;

    console.log('🌉 Bridging attestation with fee:', ccipFee.toString());

    bridgeAttestation({
      address: VERIFIER_ADDRESS as `0x${string}`,
      abi: VERIFIER_ABI,
      functionName: 'bridgeAttestation',
      args: [
        attestationId as `0x${string}`,
        BigInt(MONAD_CHAIN_SELECTOR),
        MONAD_CCIP_RECEIVER as `0x${string}`
      ],
      value: ccipFee // 실제 CCIP 수수료 사용
    });
  }

  if (!SEPOLIA_NFT_CONTRACT || !VERIFIER_ADDRESS) {
    return (
      <div className="bg-[#8B6331] border-4 border-t-[#AA8700] border-l-[#AA8700] border-r-[#554400] border-b-[#554400] p-6">
        <h3 className="minecraft-font text-white text-xl mb-2 minecraft-text-shadow">⚠️ Configuration Required</h3>
        <p className="minecraft-font text-sm text-[#CCCCCC]">
          Please set SEPOLIA_NFT_CONTRACT and SEPOLIA_VERIFIER_ADDRESS in your environment variables.
        </p>
      </div>
    );
  }

  console.log(status, nfts)
  return (
    <div className="bg-[#3C3C3C] border-2 border-t-[#1C1C1C] border-l-[#1C1C1C] border-r-[#5C5C5C] border-b-[#5C5C5C] p-6">
      <h3 className="minecraft-font text-white text-xl mb-4 minecraft-text-shadow">🌉 Sepolia NFT Verification</h3>

      {/* Sepolia 연결 */}
      {chain?.id !== SEPOLIA_CHAIN_ID ? (
        <MinecraftButton
          onClick={() => switchChain?.({ chainId: sepolia.id })}
          variant="primary"
        >
          Switch to Sepolia Network
        </MinecraftButton>
      ) : (
        <>
          {/* NFT 목록 */}
          {loading && <p className="minecraft-font text-[#AAAAAA] text-sm">Checking NFT ownership...</p>}

          {status === 'no-nft' && (
            <div className="bg-[#8B2323] border-4 border-t-[#AA3333] border-l-[#AA3333] border-r-[#551111] border-b-[#551111] p-4">
              <p className="minecraft-font text-white minecraft-text-shadow">❌ You don't own any NFTs from the eligible collection.</p>
            </div>
          )}

          {status === 'nft-found' && nfts.length > 0 && (
            <div className="mb-4">
              <p className="mb-2 minecraft-font text-[#55FF55] minecraft-text-shadow">✅ You own {nfts.length} eligible NFT(s):</p>
              <div className="space-y-2">
                {nfts.map((nft) => (
                  <div
                    key={nft.tokenId.toString()}
                    className={`border-2 p-3 cursor-pointer transition-colors minecraft-font ${
                      selectedNFT?.tokenId === nft.tokenId
                        ? 'bg-[#5B8FC6] border-t-[#7FAFD6] border-l-[#7FAFD6] border-r-[#2B4F66] border-b-[#2B4F66] text-white'
                        : 'bg-[#8B8B8B] border-t-[#DFDFDF] border-l-[#DFDFDF] border-r-[#373737] border-b-[#373737] text-white hover:bg-[#9B9B9B]'
                    }`}
                    onClick={() => setSelectedNFT(nft)}
                  >
                    Token ID: {nft.tokenId.toString()}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Attestation 생성 */}
          {selectedNFT && !attestationId && status !== 'attestation-created' && (
            <MinecraftButton
              onClick={handleCreateAttestation}
              variant="primary"
              disabled={!createAttestation}
            >
              Create Attestation
            </MinecraftButton>
          )}

          {/* CCIP 전송 */}
          {(status === 'attestation-created' || attestationId) && status !== 'ccip-sent' && (
            <div className="mt-4">
              <p className="mb-2 minecraft-font text-[#55FF55] minecraft-text-shadow">✅ Attestation created!</p>

              {/* CCIP 수수료 표시 */}
              {ccipFee > BigInt(0) && (
                <div className="mb-3 p-3 bg-[#2B2B2B] border-2 border-[#4B4B4B]">
                  <p className="minecraft-font text-sm text-[#AAAAAA]">
                    💰 CCIP Fee: <span className="text-[#FFD700]">{(Number(ccipFee) / 1e18).toFixed(6)} ETH</span>
                  </p>
                </div>
              )}

              <MinecraftButton
                onClick={handleBridgeAttestation}
                variant="primary"
                disabled={!bridgeAttestation || ccipFee === BigInt(0)}
              >
                {ccipFee === BigInt(0) ? 'Calculating Fee...' : 'Send to Monad via CCIP'}
              </MinecraftButton>
            </div>
          )}

          {/* CCIP 전송 완료 */}
          {status === 'ccip-sent' && (
            <div className="bg-[#2B8B2B] border-4 border-t-[#55AA55] border-l-[#55AA55] border-r-[#1B5B1B] border-b-[#1B5B1B] p-4 mt-4">
              <p className="minecraft-font text-white text-lg minecraft-text-shadow">🎉 CCIP Message Sent!</p>
              <p className="minecraft-font text-sm mt-2 text-[#CCCCCC]">
                Your attestation is being bridged to Monad.
                This may take 15-30 minutes.
              </p>
              <p className="minecraft-font text-sm mt-2 text-[#FFD700] minecraft-text-shadow">
                Switch to Monad network to mint your special NFT!
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
