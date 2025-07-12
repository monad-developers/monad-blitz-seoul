"use client";

import { useState, useEffect } from "react";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { getAllWalletAddresses, extractAddresses } from "~~/utils/walletApi";
import { useScaffoldWriteContract, useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { useMintedProfiles } from "~~/hooks/useMintedProfiles";
import {
  CheckIcon,
  ClipboardDocumentIcon,
  PaperAirplaneIcon,
  PlusIcon,
  RocketLaunchIcon,
  TrashIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";

const AirdropPage: NextPage = () => {
  const { address: connectedAddress } = useAccount();
  const [selectedNFT, setSelectedNFT] = useState<number | null>(null);
  const [recipients, setRecipients] = useState<string[]>([""]);
  const [airdropMethod, setAirdropMethod] = useState<"manual" | "database" | "csv">("database");
  const [csvContent, setCsvContent] = useState("");
  const [isAirdropping, setIsAirdropping] = useState(false);
  const [successCount, setSuccessCount] = useState(0);
  const [allWalletAddresses, setAllWalletAddresses] = useState<string[]>([]);
  const [isLoadingWallets, setIsLoadingWallets] = useState(false);
  const [selectedMetadataUri, setSelectedMetadataUri] = useState<string>("");

  // 실제 민팅된 NFT 데이터 가져오기
  const { mintedProfiles, isLoading: mintedLoading, error: mintedError } = useMintedProfiles();
  
  // 배치 민팅 스마트 컨트랙트 훅
  const { 
    writeContractAsync: batchMintNFT, 
    isPending: isBatchMinting 
  } = useScaffoldWriteContract("ProfileNFT1155");

  // 사용자가 소유한 NFT 목록 생성
  const myNFTs = mintedProfiles
    .filter(profile => profile.profile && profile.owner.toLowerCase() === connectedAddress?.toLowerCase())
    .map(profile => ({
      id: profile.tokenId,
      name: `${profile.profile?.name} - ${profile.profile?.role}`,
      image: profile.profile?.profileImageUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop&crop=face",
      metadataUri: profile.metadataUri,
      mintedAt: profile.mintedAt,
      owner: profile.owner,
      supply: 1000, // 임시 값 (실제로는 무제한)
      distributed: 0 // 임시 값 (실제로는 복잡한 계산 필요)
    }));

  const addRecipient = () => {
    setRecipients([...recipients, ""]);
  };

  const removeRecipient = (index: number) => {
    setRecipients(recipients.filter((_, i) => i !== index));
  };

  const updateRecipient = (index: number, value: string) => {
    const newRecipients = [...recipients];
    newRecipients[index] = value;
    setRecipients(newRecipients);
  };

  const parseCSV = (csvText: string) => {
    const lines = csvText.trim().split("\n");
    const addresses = lines.map(line => line.split(",")[0].trim()).filter(addr => addr);
    setRecipients(addresses);
  };

  // 백엔드에서 모든 지갑 주소 로드
  const loadWalletAddresses = async () => {
    setIsLoadingWallets(true);
    try {
      const response = await getAllWalletAddresses();
      const addresses = extractAddresses(response);
      setAllWalletAddresses(addresses);
      setRecipients(addresses); // 자동으로 recipients에도 설정
    } catch (error) {
      console.error('지갑 주소 로드 실패:', error);
      alert('지갑 주소를 불러오는데 실패했습니다.');
    } finally {
      setIsLoadingWallets(false);
    }
  };

  const handleAirdrop = async () => {
    if (!selectedNFT || !connectedAddress) return;

    const selectedNFTData = myNFTs.find(nft => nft.id === selectedNFT);
    if (!selectedNFTData) {
      alert('선택된 NFT를 찾을 수 없습니다.');
      return;
    }

    setIsAirdropping(true);
    setSuccessCount(0);

    try {
      let validRecipients: string[] = [];
      
      if (airdropMethod === "database") {
        validRecipients = allWalletAddresses.filter(addr => addr.trim() !== "");
      } else {
        validRecipients = recipients.filter(addr => addr.trim() !== "");
      }

      if (validRecipients.length === 0) {
        alert('에어드롭할 주소가 없습니다.');
        return;
      }

      console.log(`🎯 ${validRecipients.length}개 주소에 에어드롭 시작...`);
      console.log('메타데이터 URI:', selectedNFTData.metadataUri);

      // 스마트 컨트랙트 배치 민팅 호출
      const tx = await batchMintNFT({
        functionName: "batchMintProfileNFT",
        args: [validRecipients, selectedNFTData.metadataUri],
        value: BigInt(0), // 민팅 수수료가 0이므로
      });

      console.log('✅ 에어드롭 트랜잭션 완료:', tx);
      setSuccessCount(validRecipients.length);
      alert(`성공적으로 ${validRecipients.length}개 주소에 에어드롭 완료!`);
    } catch (error) {
      console.error('❌ 에어드롭 실패:', error);
      alert('에어드롭에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsAirdropping(false);
    }
  };

  // 페이지 로딩 시 database 모드에서 자동으로 지갑 주소 로드
  useEffect(() => {
    if (airdropMethod === "database") {
      loadWalletAddresses();
    }
  }, [airdropMethod]);

  if (!connectedAddress) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Connect Your Wallet</h1>
          <p className="text-gray-600 mb-8">You need to connect your wallet to manage airdrops</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
            Airdrop Manager
          </h1>
          <p className="text-gray-600">Distribute your NFT business cards to your network</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - NFT Selection */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4">Select NFT to Airdrop</h2>

              {myNFTs.length > 0 ? (
                <div className="space-y-4">
                  {myNFTs.map(nft => (
                    <div
                      key={nft.id}
                      onClick={() => setSelectedNFT(nft.id)}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedNFT === nft.id
                          ? "border-purple-500 bg-purple-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <img src={nft.image} alt={nft.name} className="w-12 h-12 rounded-lg object-cover" />
                        <div className="flex-1">
                          <h3 className="font-semibold text-sm">{nft.name}</h3>
                          <p className="text-xs text-gray-500">
                            {nft.distributed}/{nft.supply} distributed
                          </p>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full"
                          style={{ width: `${(nft.distributed / nft.supply) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <RocketLaunchIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No NFTs available for airdrop</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Airdrop Configuration */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold mb-6">Configure Airdrop</h2>

              {/* Airdrop Method Selection */}
              <div className="mb-6">
                <h3 className="font-semibold mb-3">Distribution Method</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => setAirdropMethod("manual")}
                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                      airdropMethod === "manual"
                        ? "border-purple-500 bg-purple-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <UserGroupIcon className="h-6 w-6 text-purple-600 mb-2" />
                    <div className="font-medium">Manual Entry</div>
                    <div className="text-sm text-gray-500">Enter addresses manually</div>
                  </button>

                  <button
                    onClick={() => setAirdropMethod("csv")}
                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                      airdropMethod === "csv"
                        ? "border-purple-500 bg-purple-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <ClipboardDocumentIcon className="h-6 w-6 text-blue-600 mb-2" />
                    <div className="font-medium">CSV Upload</div>
                    <div className="text-sm text-gray-500">Bulk import from CSV</div>
                  </button>

                  <button
                    onClick={() => setAirdropMethod("database")}
                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                      airdropMethod === "database"
                        ? "border-purple-500 bg-purple-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <CheckIcon className="h-6 w-6 text-green-600 mb-2" />
                    <div className="font-medium">Database</div>
                    <div className="text-sm text-gray-500">All registered wallets</div>
                  </button>
                </div>
              </div>

              {/* Manual Entry */}
              {airdropMethod === "manual" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Recipient Addresses</h3>
                    <button onClick={addRecipient} className="btn btn-outline btn-sm">
                      <PlusIcon className="h-4 w-4 mr-1" />
                      Add Address
                    </button>
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {recipients.map((recipient, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          placeholder="0x..."
                          value={recipient}
                          onChange={e => updateRecipient(index, e.target.value)}
                          className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        />
                        {recipients.length > 1 && (
                          <button
                            onClick={() => removeRecipient(index)}
                            className="p-3 text-red-500 hover:bg-red-50 rounded-lg"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CSV Upload */}
              {airdropMethod === "csv" && (
                <div className="space-y-4">
                  <h3 className="font-semibold">CSV Content</h3>
                  <textarea
                    placeholder="0x1234...,user1@email.com&#10;0x5678...,user2@email.com&#10;0x9abc...,user3@email.com"
                    value={csvContent}
                    onChange={e => setCsvContent(e.target.value)}
                    rows={6}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                  <button onClick={() => parseCSV(csvContent)} className="btn btn-outline">
                    Parse CSV
                  </button>
                  <p className="text-sm text-gray-500">
                    Format: address,email (one per line). Found {recipients.filter(r => r.trim()).length} valid
                    addresses.
                  </p>
                </div>
              )}

              {/* Database */}
              {airdropMethod === "database" && (
                <div className="space-y-4">
                  <h3 className="font-semibold">Database Recipients</h3>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Registered Wallets:</strong> {allWalletAddresses.length} addresses in database
                    </p>
                    {isLoadingWallets && (
                      <p className="text-sm text-blue-600 mt-2">Loading wallet addresses...</p>
                    )}
                  </div>

                  <button
                    onClick={loadWalletAddresses}
                    disabled={isLoadingWallets}
                    className="btn btn-outline"
                  >
                    {isLoadingWallets ? 'Loading...' : 'Load Wallet Addresses'}
                  </button>

                  {allWalletAddresses.length > 0 && (
                    <div className="max-h-32 overflow-y-auto">
                      <div className="text-sm text-gray-600 space-y-1">
                        {allWalletAddresses.slice(0, 10).map((address, index) => (
                          <div key={index} className="font-mono text-xs">
                            {address}
                          </div>
                        ))}
                        {allWalletAddresses.length > 10 && (
                          <div className="text-xs text-gray-500">
                            ... and {allWalletAddresses.length - 10} more addresses
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Airdrop Summary */}
              <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-2">Airdrop Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Recipients:</span>
                    <span className="font-medium ml-2">
                      {airdropMethod === "database" ? allWalletAddresses.length : recipients.filter(r => r.trim()).length}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Estimated Gas:</span>
                    <span className="font-medium ml-2">~0.05 ETH</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Total Cost:</span>
                    <span className="font-medium ml-2">~$75.00</span>
                  </div>
                </div>
              </div>

              {/* Airdrop Button */}
              <div className="mt-6">
                <button
                  onClick={handleAirdrop}
                  disabled={!selectedNFT || (airdropMethod === "database" ? allWalletAddresses.length === 0 : recipients.filter(r => r.trim()).length === 0) || isAirdropping || isBatchMinting}
                  className="w-full btn btn-primary btn-lg disabled:btn-disabled"
                >
                  {(isAirdropping || isBatchMinting) ? (
                    <>
                      <div className="loading loading-spinner loading-sm mr-2"></div>
                      Airdropping... ({successCount}/{airdropMethod === "database" ? allWalletAddresses.length : recipients.filter(r => r.trim()).length})
                    </>
                  ) : (
                    <>
                      <PaperAirplaneIcon className="h-5 w-5 mr-2" />
                      Start Airdrop ({airdropMethod === "database" ? allWalletAddresses.length : recipients.filter(r => r.trim()).length} recipients)
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AirdropPage;
