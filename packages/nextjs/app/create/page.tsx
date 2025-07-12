'use client';

import { useState, useEffect } from 'react';
import { useRouter } from "next/navigation";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import Link from 'next/link';
import { uploadFile } from '~~/utils/upload';
import { summarizePDFWithGemini, formatSummaryForCard, type SummaryResult } from '~~/utils/gemini';
import { useScaffoldWriteContract, useScaffoldReadContract, useDeployedContractInfo } from "~~/hooks/scaffold-eth";
import { useChainId } from "wagmi";
import { addWalletAddress, getAllWalletAddresses, extractAddresses } from '~~/utils/walletApi';

const CreatePage: NextPage = () => {
  const { address: connectedAddress } = useAccount();
  const router = useRouter();
  const chainId = useChainId();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    bio: '',
    skills: '',
    contact: '',
    profileImage: null as File | null,
    resumeFile: null as File | null,
    portfolioLink: '',
    profileImageUrl: '',
    resumeFileUrl: '',
    profileImagePreview: '',
    resumeFilePreview: '',
    aiSummary: '',
    summaryData: null as SummaryResult | null
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({
    profileImage: false,
    resumeFile: false,
    aiSummary: false
  });
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [allWalletAddresses, setAllWalletAddresses] = useState<string[]>([]);

  // 스마트 컨트랙트 훅 (ERC1155 버전 사용)
  const { 
    writeContractAsync: createProfile, 
    isPending: isCreatingProfile 
  } = useScaffoldWriteContract("ProfileNFT1155");
  
  const { 
    writeContractAsync: mintNFT, 
    isPending: isMinting 
  } = useScaffoldWriteContract("ProfileNFT1155");
  
  const { 
    writeContractAsync: batchMintNFT, 
    isPending: isBatchMinting 
  } = useScaffoldWriteContract("ProfileNFT1155");
  
  // 컨트랙트 정보 확인
  const { data: contractInfo } = useDeployedContractInfo("ProfileNFT1155");
  
  // 기존 프로필 확인
  const { data: existingProfile, isLoading: profileLoading, error: profileError } = useScaffoldReadContract({
    contractName: "ProfileNFT1155",
    functionName: "profileExists",
    args: [connectedAddress],
  });

  // 디버깅 정보
  useEffect(() => {
    console.log('Contract & Profile Status:', {
      chainId,
      connectedAddress,
      contractInfo: contractInfo ? {
        address: contractInfo.address,
        abi: contractInfo.abi ? 'Present' : 'Missing'
      } : 'Not Found',
      existingProfile,
      profileLoading,
      profileError,
      isCreatingProfile,
      isMinting
    });
  }, [chainId, connectedAddress, contractInfo, existingProfile, profileLoading, profileError, isCreatingProfile, isMinting]);

  // Object URL 정리
  useEffect(() => {
    return () => {
      if (formData.profileImagePreview) {
        URL.revokeObjectURL(formData.profileImagePreview);
      }
      if (formData.resumeFilePreview) {
        URL.revokeObjectURL(formData.resumeFilePreview);
      }
    };
  }, [formData.profileImagePreview, formData.resumeFilePreview]);

  // 로컬 네트워크 추가 함수
  const addLocalNetwork = async () => {
    try {
      if (!window.ethereum) {
        alert('MetaMask 또는 Phantom이 설치되지 않았습니다.');
        return;
      }

      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: '0x7A69', // 31337 in hex
          chainName: 'Hardhat Local',
          nativeCurrency: {
            name: 'Ethereum',
            symbol: 'ETH',
            decimals: 18
          },
          rpcUrls: ['http://127.0.0.1:8545'],
          blockExplorerUrls: null
        }]
      });
      
      console.log('✅ Hardhat 네트워크가 추가되었습니다!');
    } catch (error) {
      console.error('네트워크 추가 실패:', error);
      alert('네트워크 추가에 실패했습니다. 수동으로 추가해주세요.');
    }
  };

  if (!connectedAddress) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full mx-auto mb-8 flex items-center justify-center">
            <i className="ri-wallet-line text-4xl text-white"></i>
          </div>
          <h1 className="text-3xl font-bold mb-4">지갑을 연결해주세요</h1>
          <p className="text-white/70 mb-8">명판 NFT를 만들기 위해서는 지갑 연결이 필요합니다</p>
          
          {/* 네트워크 상태 디버그 정보 */}
          <div className="mb-6 p-4 bg-white/5 rounded-lg text-left text-sm">
            <p className="text-white/60">네트워크 상태:</p>
            <p className="text-white">Chain ID: {chainId} {chainId === 31337 ? '(로컬)' : '(테스트넷)'}</p>
          </div>
          
          <Link href="/" className="bg-white text-black px-8 py-4 rounded-full font-semibold text-lg hover:bg-white/90 transition-all">
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = async (e: any, type: string) => {
    const file = e.target.files[0];
    if (!file) return;

    // 이미지 또는 PDF 파일인 경우 미리보기 URL 생성
    if ((type === 'profileImage' && file.type.startsWith('image/')) || 
        (type === 'resumeFile' && file.type === 'application/pdf')) {
      const previewUrl = URL.createObjectURL(file);
      setFormData(prev => ({
        ...prev,
        [type]: file,
        [`${type}Preview`]: previewUrl
      }));
    } else {
      // 파일을 로컬 상태에 저장
      setFormData(prev => ({
        ...prev,
        [type]: file
      }));
    }

    // 파일 업로드 시작
    setUploadProgress(prev => ({
      ...prev,
      [type]: true
    }));

    try {
      const url = await uploadFile(file);
      
      // 업로드된 URL을 저장
      setFormData(prev => ({
        ...prev,
        [`${type}Url`]: url
      }));
      
      console.log(`${type} uploaded successfully:`, url);

      // PDF 파일인 경우 AI 요약 처리
      console.log('Checking if should process AI summary:', {
        type,
        fileType: file.type,
        shouldProcess: type === 'resumeFile' && file.type === 'application/pdf'
      });
      
      if (type === 'resumeFile' && file.type === 'application/pdf') {
        setUploadProgress(prev => ({
          ...prev,
          aiSummary: true
        }));

        try {
          console.log('Starting AI summary for PDF...');
          const summaryResult = await summarizePDFWithGemini(url);
          const formattedSummary = formatSummaryForCard(summaryResult);
          
          setFormData(prev => ({
            ...prev,
            summaryData: summaryResult,
            aiSummary: formattedSummary
          }));
          
          console.log('AI summary completed:', summaryResult);
        } catch (summaryError) {
          console.error('Failed to generate AI summary:', summaryError);
          // AI 요약 실패 시에도 업로드는 성공으로 처리
          setFormData(prev => ({
            ...prev,
            aiSummary: 'AI 요약을 생성하는 중 오류가 발생했습니다. 수동으로 소개를 작성해주세요.'
          }));
        } finally {
          setUploadProgress(prev => ({
            ...prev,
            aiSummary: false
          }));
        }
      }
    } catch (error) {
      console.error(`Failed to upload ${type}:`, error);
      alert(`파일 업로드에 실패했습니다: ${error}`);
    } finally {
      setUploadProgress(prev => ({
        ...prev,
        [type]: false
      }));
    }
  };

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  // 모든 지갑 주소 조회 함수
  const loadAllWalletAddresses = async () => {
    try {
      const response = await getAllWalletAddresses();
      const addresses = extractAddresses(response);
      setAllWalletAddresses(addresses);
      console.log(`📋 ${addresses.length}개의 지갑 주소 로드됨`);
      return addresses;
    } catch (error) {
      console.error('지갑 주소 로드 실패:', error);
      return [];
    }
  };

  const handleGenerate = async () => {
    console.log('🚀 NFT 생성 시작!');
    console.log('현재 상태:', {
      chainId,
      connectedAddress,
      contractInfo,
      existingProfile,
      formData: {
        name: formData.name,
        role: formData.role,
        bio: formData.bio,
        skills: formData.skills,
        contact: formData.contact
      }
    });

    // 컨트랙트 연결 확인
    if (!contractInfo) {
      alert(`현재 체인(${chainId})에서 ProfileNFT 컨트랙트를 찾을 수 없습니다. 네트워크를 확인해주세요.`);
      return;
    }

    if (!createProfile || !mintNFT) {
      alert('스마트 컨트랙트 함수를 로드할 수 없습니다. 페이지를 새로고침해주세요.');
      return;
    }

    // 필수 필드 검증
    if (!formData.name || !formData.role) {
      alert('이름과 역할은 필수 입력 항목입니다.');
      return;
    }

    setIsGenerating(true);
    
    try {
      console.log('📝 Step 1: 메타데이터 생성 중...');
      
      // 1. 메타데이터 JSON 생성
      const metadata = {
        name: formData.name,
        description: formData.bio || formData.aiSummary,
        image: formData.profileImageUrl,
        attributes: [
          {
            trait_type: "Role",
            value: formData.role
          },
          {
            trait_type: "Skills", 
            value: formData.skills
          },
          {
            trait_type: "Contact",
            value: formData.contact
          }
        ],
        properties: {
          role: formData.role,
          bio: formData.bio,
          skills: formData.skills ? formData.skills.split(',').map((skill: string) => skill.trim()).filter((skill: string) => skill) : [],
          contact: formData.contact,
          portfolioLink: formData.portfolioLink,
          profileImageUrl: formData.profileImageUrl,
          resumeFileUrl: formData.resumeFileUrl,
          aiSummary: formData.aiSummary,
          createdAt: new Date().toISOString(),
          creator: connectedAddress
        }
      };

      console.log('📄 생성된 메타데이터:', metadata);

      console.log('☁️ Step 2: 메타데이터 IPFS 업로드 중...');
      
      let metadataUri = '';
      
      try {
        // 2. 메타데이터를 IPFS에 업로드 (JSON 파일로)
        const metadataBlob = new Blob([JSON.stringify(metadata, null, 2)], {
          type: 'application/json'
        });
        const metadataFile = new File([metadataBlob], 'metadata.json', {
          type: 'application/json'
        });
        
        metadataUri = await uploadFile(metadataFile);
        console.log('✅ 메타데이터 업로드 완료! URI:', metadataUri);
      } catch (uploadError) {
        console.warn('⚠️ IPFS 업로드 실패, 테스트용 더미 URI 사용:', uploadError);
        // 테스트를 위해 더미 URI 사용
        metadataUri = `data:application/json;base64,${btoa(JSON.stringify(metadata))}`;
        console.log('📝 더미 메타데이터 URI:', metadataUri);
      }

      // 3. 스마트 컨트랙트에 프로필 생성
      const fileUrls = [
        formData.profileImageUrl,
        formData.resumeFileUrl
      ].filter(url => url); // 빈 URL 제거

      console.log('📂 파일 URLs:', fileUrls);
      console.log('🔍 기존 프로필 확인:', existingProfile);
      
      // 기존 프로필이 있어도 새 NFT 민팅은 가능하도록 변경
      if (existingProfile) {
        console.log('ℹ️ 기존 프로필이 존재하지만 새 NFT를 민팅합니다.');
        // 프로필 업데이트 대신 바로 민팅으로 진행
      } else {
        // 프로필이 없는 경우에만 새로 생성
        console.log('📝 Step 3: 컨트랙트에 프로필 생성 중...');
        console.log('createProfile 함수 호출 args:', [
          formData.name,
          formData.role,
          formData.bio || formData.aiSummary || "",
          formData.skills || "",
          formData.contact || "",
          formData.portfolioLink || "",
          fileUrls
        ]);

        const createTx = await createProfile({
          functionName: "createProfile",
          args: [
            formData.name,
            formData.role,
            formData.bio || formData.aiSummary || "",
            formData.skills || "",
            formData.contact || "",
            formData.portfolioLink || "",
            fileUrls
          ],
        });

        console.log('✅ 프로필 생성 트랜잭션:', createTx);
      }

      console.log('🎨 Step 4: NFT 민팅 중...');
      
      let mintTx;
      
      if (isBroadcasting) {
        // 브로드캐스팅 모드: 모든 지갑 주소에 민트
        console.log('📡 브로드캐스팅 모드 - 모든 지갑 주소 조회 중...');
        const addresses = await loadAllWalletAddresses();
        
        if (addresses.length === 0) {
          alert('브로드캐스팅할 지갑 주소가 없습니다. 개인 민팅으로 변경합니다.');
          console.log('mintProfileNFT 함수 호출 args:', [connectedAddress, metadataUri]);
          
          mintTx = await mintNFT({
            functionName: "mintProfileNFT", 
            args: [connectedAddress, metadataUri],
            value: BigInt(0),
          });
        } else {
          console.log(`📡 ${addresses.length}개 지갑 주소에 배치 민팅 중...`);
          console.log('batchMintProfileNFT 함수 호출 args:', [addresses, metadataUri]);
          
          // 배치 민팅 수수료 계산
          const batchFee = BigInt(0); // 민팅 수수료가 0이므로
          
          mintTx = await batchMintNFT({
            functionName: "batchMintProfileNFT",
            args: [addresses, metadataUri],
            value: batchFee,
          });
        }
      } else {
        // 개인 민팅 모드
        console.log('👤 개인 민팅 모드');
        console.log('mintProfileNFT 함수 호출 args:', [connectedAddress, metadataUri]);
        
        mintTx = await mintNFT({
          functionName: "mintProfileNFT", 
          args: [connectedAddress, metadataUri],
          value: BigInt(0),
        });
      }

      console.log('✅ NFT 민팅 트랜잭션:', mintTx);
      console.log('🎉 NFT 생성 완료!');
      
      // NFT 민팅 성공 후 즉시 Step 5로 이동
      setStep(5);
      
      // 5. 지갑 주소를 백엔드에 추가 (백그라운드에서 실행)
      // 이 작업이 실패해도 NFT 민팅 성공에는 영향을 주지 않음
      setTimeout(async () => {
        try {
          console.log('💾 백그라운드: 지갑 주소 백엔드 등록 중...');
          await addWalletAddress(connectedAddress);
          console.log('✅ 지갑 주소 백엔드 등록 완료!');
        } catch (walletError) {
          console.warn('⚠️ 지갑 주소 백엔드 등록 실패 (NFT 민팅은 성공):', walletError);
          // 사용자에게는 알리지 않음 (이미 NFT 민팅은 성공했으므로)
        }
      }, 100);
      
    } catch (error) {
      console.error('❌ NFT 생성 중 오류:', error);
      
      // 더 자세한 에러 정보 로깅
      if (error instanceof Error) {
        console.error('에러 메시지:', error.message);
        console.error('에러 스택:', error.stack);
      }
      
      let errorMessage = 'NFT 생성에 실패했습니다.';
      if (error instanceof Error) {
        errorMessage += `\n상세: ${error.message}`;
      }
      
      alert(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const stepTitles = [
    '기본 정보',
    '스킬 & 연락처',
    '파일 업로드',
    '미리보기',
    '완료'
  ];

  return (
    <div className="min-h-screen bg-black text-white pt-20">

      <div className="max-w-4xl mx-auto px-6 lg:px-8 py-16">
        {/* Progress */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className={`relative w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                i <= step 
                  ? 'bg-white text-black' 
                  : i === step + 1 
                    ? 'bg-white/20 text-white border-2 border-white/30' 
                    : 'bg-white/5 text-white/40 border border-white/10'
              }`}>
                {i < step ? (
                  <i className="ri-check-line text-lg"></i>
                ) : (
                  i
                )}
              </div>
            ))}
          </div>
          
          <div className="w-full bg-white/10 rounded-full h-1">
            <div 
              className="bg-white h-1 rounded-full transition-all duration-500"
              style={{ width: `${((step - 1) / 4) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* 네트워크 상태 표시 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/10">
            <div className={`w-2 h-2 rounded-full ${chainId === 31337 ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
            <span className="text-white/80 text-sm">
              {chainId === 31337 ? '로컬 체인 (Hardhat)' : `Chain ID: ${chainId}`}
            </span>
          </div>
          
          {/* 로컬 네트워크가 아닌 경우 안내 메시지 */}
          {chainId !== 31337 && (
            <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <p className="text-yellow-200 text-sm mb-2">
                💡 로컬 개발을 위해 Hardhat 네트워크로 전환하세요
              </p>
              <button
                onClick={addLocalNetwork}
                className="bg-yellow-500 text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-yellow-400 transition-colors"
              >
                Hardhat 네트워크 추가
              </button>
            </div>
          )}
        </div>

        <div className="bg-white/5 border border-white/10 rounded-3xl p-12 backdrop-blur-sm">
          {/* Step 1: 기본 정보 */}
          {step === 1 && (
            <div>
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold text-white mb-4">기본 정보</h2>
                <p className="text-white/60">당신을 소개하는 기본 정보를 입력해주세요</p>
              </div>
              
              <div className="space-y-8 max-w-2xl mx-auto">
                <div>
                  <label className="block text-white font-medium mb-3">이름</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-white/50 focus:border-white/50 focus:bg-white/15 transition-all text-lg"
                    placeholder="홍길동"
                  />
                </div>
                
                <div>
                  <label className="block text-white font-medium mb-3">역할/직책</label>
                  <input
                    type="text"
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-white/50 focus:border-white/50 focus:bg-white/15 transition-all text-lg"
                    placeholder="Solidity Developer, Founder"
                  />
                </div>
                
                <div>
                  <label className="block text-white font-medium mb-3">한 줄 소개</label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    rows={4}
                    maxLength={500}
                    className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-white/50 focus:border-white/50 focus:bg-white/15 transition-all text-lg resize-none"
                    placeholder="Web3 개발에 열정적인 개발자입니다..."
                  />
                  <div className="text-right text-white/40 text-sm mt-2">{formData.bio.length}/500</div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: 스킬 및 연락처 */}
          {step === 2 && (
            <div>
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold text-white mb-4">스킬 & 연락처</h2>
                <p className="text-white/60">전문성과 연락 방법을 알려주세요</p>
              </div>
              
              <div className="space-y-8 max-w-2xl mx-auto">
                <div>
                  <label className="block text-white font-medium mb-3">주요 스킬</label>
                  <input
                    type="text"
                    name="skills"
                    value={formData.skills}
                    onChange={handleInputChange}
                    className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-white/50 focus:border-white/50 focus:bg-white/15 transition-all text-lg"
                    placeholder="Solidity, React, Node.js, Web3"
                  />
                  <p className="text-white/40 text-sm mt-2">쉼표로 구분해서 입력해주세요</p>
                </div>
                
                <div>
                  <label className="block text-white font-medium mb-3">연락처</label>
                  <input
                    type="text"
                    name="contact"
                    value={formData.contact}
                    onChange={handleInputChange}
                    className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-white/50 focus:border-white/50 focus:bg-white/15 transition-all text-lg"
                    placeholder="@twitter_handle, vitalik.eth"
                  />
                </div>
                
                <div>
                  <label className="block text-white font-medium mb-3">포트폴리오 링크 (선택)</label>
                  <input
                    type="url"
                    name="portfolioLink"
                    value={formData.portfolioLink}
                    onChange={handleInputChange}
                    className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-white/50 focus:border-white/50 focus:bg-white/15 transition-all text-lg"
                    placeholder="https://portfolio.example.com"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: 파일 업로드 */}
          {step === 3 && (
            <div>
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold text-white mb-4">파일 업로드</h2>
                <p className="text-white/60">프로필 이미지와 자료를 업로드해주세요</p>
              </div>
              
              <div className="space-y-12 max-w-2xl mx-auto">
                <div>
                  <label className="block text-white font-medium mb-4">프로필 이미지</label>
                  <div className="border-2 border-dashed border-white/20 rounded-3xl p-12 text-center hover:border-white/40 transition-colors cursor-pointer bg-white/5">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'profileImage')}
                      className="hidden"
                      id="profile-image"
                      disabled={uploadProgress.profileImage}
                    />
                    <label htmlFor="profile-image" className="cursor-pointer">
                      <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                        {uploadProgress.profileImage ? (
                          <i className="ri-loader-line text-5xl text-white/60 animate-spin"></i>
                        ) : (
                          <i className="ri-image-line text-5xl text-white/60"></i>
                        )}
                      </div>
                      <p className="text-white text-lg mb-2">
                        {uploadProgress.profileImage ? '업로드 중...' : '클릭하여 이미지 업로드'}
                      </p>
                      <p className="text-white/50">JPG, PNG 파일 지원</p>
                      {formData.profileImage && (
                        <div className="mt-6">
                          {formData.profileImagePreview && (
                            <div className="mb-4">
                              <img 
                                src={formData.profileImagePreview} 
                                alt="미리보기"
                                className="w-32 h-32 object-cover rounded-2xl mx-auto border-2 border-white/30"
                              />
                            </div>
                          )}
                          <p className="text-white font-medium bg-white/10 px-4 py-2 rounded-full inline-block mb-2">
                            {formData.profileImage.name}
                          </p>
                          {formData.profileImageUrl && (
                            <p className="text-green-400 text-sm">✓ 업로드 완료</p>
                          )}
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-white font-medium mb-4">이력서/소개 자료 (PDF)</label>
                  <div className="border-2 border-dashed border-white/20 rounded-3xl p-12 text-center hover:border-white/40 transition-colors cursor-pointer bg-white/5">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => handleFileChange(e, 'resumeFile')}
                      className="hidden"
                      id="resume-file"
                      disabled={uploadProgress.resumeFile || uploadProgress.aiSummary}
                    />
                    <label htmlFor="resume-file" className="cursor-pointer">
                      <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                        {uploadProgress.resumeFile || uploadProgress.aiSummary ? (
                          <i className="ri-loader-line text-5xl text-white/60 animate-spin"></i>
                        ) : (
                          <i className="ri-file-pdf-line text-5xl text-white/60"></i>
                        )}
                      </div>
                      <p className="text-white text-lg mb-2">
                        {uploadProgress.resumeFile ? '업로드 중...' : 
                         uploadProgress.aiSummary ? 'AI 요약 생성 중...' : 
                         '클릭하여 PDF 업로드'}
                      </p>
                      <p className="text-white/50">
                        {uploadProgress.aiSummary ? 'Gemini AI가 이력서를 분석하고 있습니다...' : 'AI가 자동으로 요약해드립니다'}
                      </p>
                      {formData.resumeFile && (
                        <div className="mt-6">
                          {formData.resumeFilePreview && (
                            <div className="mb-4">
                              <div className="w-full max-w-sm mx-auto h-64 border-2 border-white/30 rounded-2xl overflow-hidden bg-white">
                                <object 
                                  data={formData.resumeFilePreview}
                                  type="application/pdf"
                                  width="100%"
                                  height="100%"
                                  className="w-full h-full"
                                >
                                  <div className="flex flex-col items-center justify-center h-full text-gray-600">
                                    <i className="ri-file-pdf-line text-4xl mb-2"></i>
                                    <p className="text-sm">PDF 미리보기</p>
                                    <p className="text-xs">브라우저에서 지원하지 않음</p>
                                  </div>
                                </object>
                              </div>
                            </div>
                          )}
                          <p className="text-white font-medium bg-white/10 px-4 py-2 rounded-full inline-block mb-2">
                            {formData.resumeFile.name}
                          </p>
                          {formData.resumeFileUrl && (
                            <p className="text-green-400 text-sm">✓ 업로드 완료</p>
                          )}
                          {formData.aiSummary && (
                            <div className="mt-4 p-4 bg-white/10 rounded-2xl">
                              <p className="text-sm text-white/80 mb-2">
                                <i className="ri-sparkling-line mr-2"></i>
                                AI 요약 결과:
                              </p>
                              <p className="text-xs text-white/70 leading-relaxed max-h-24 overflow-y-auto">
                                {formData.aiSummary}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: 미리보기 */}
          {step === 4 && (
            <div>
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold text-white mb-4">미리보기</h2>
                <p className="text-white/60">생성될 명판을 확인하세요</p>
              </div>
              
              {/* Interactive Card Preview */}
              <div className="max-w-sm mx-auto">
                {/* Flip Instruction */}
                <div className="text-center mb-6">
                  <h3 className="text-white/80 text-lg mb-2">
                    {isCardFlipped ? '뒷면' : '앞면'}
                  </h3>
                  <p className="text-white/60 text-sm flex items-center justify-center gap-2">
                    <i className="ri-hand-coin-line text-base"></i>
                    카드를 클릭하여 뒤집어보세요
                  </p>
                </div>

                {/* Flip Card Container */}
                <div 
                  className="relative aspect-[5/8] cursor-pointer group"
                  onClick={() => setIsCardFlipped(!isCardFlipped)}
                  style={{ perspective: '1000px' }}
                >
                  {/* Card Inner Container */}
                  <div 
                    className={`relative w-full h-full transition-transform duration-700 ease-in-out transform-style-preserve-3d ${
                      isCardFlipped ? 'rotate-y-180' : ''
                    }`}
                    style={{ transformStyle: 'preserve-3d' }}
                  >
                    
                    {/* Front Side */}
                    <div 
                      className="absolute inset-0 backface-hidden"
                      style={{ backfaceVisibility: 'hidden' }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-white/10 to-white/5 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl shadow-black/50 group-hover:shadow-white/10 transition-shadow duration-300">
                        
                        {/* Profile Image - Top Half */}
                        <div className="absolute inset-x-0 top-0 h-3/5 rounded-t-3xl overflow-hidden">
                          {formData.profileImageUrl || formData.profileImagePreview ? (
                            <img 
                              src={formData.profileImageUrl || formData.profileImagePreview} 
                              alt="프로필 이미지"
                              className="w-full h-full object-cover opacity-90"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-purple-600/80 via-blue-600/80 to-indigo-700/80 flex items-center justify-center">
                              <i className="ri-user-line text-6xl text-white/60"></i>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/10"></div>
                        </div>

                        {/* Content Area - Bottom Half */}
                        <div className="absolute inset-x-0 bottom-0 h-2/5 bg-white/10 backdrop-blur-lg rounded-b-3xl p-6 text-white border-t border-white/20">
                          <div className="text-center mb-3">
                            <h3 className="text-xl font-bold text-white mb-1 drop-shadow-lg">{formData.name || '이름'}</h3>
                            <p className="text-sm font-medium text-white/90 drop-shadow-md">
                              {formData.role || '역할'}
                            </p>
                          </div>

                          <div className="flex justify-center mb-3">
                            <div className="inline-flex items-center gap-2 bg-green-400/20 backdrop-blur-sm px-3 py-1 rounded-full border border-green-300/30">
                              <div className="w-2 h-2 bg-green-400 rounded-full shadow-lg shadow-green-400/50"></div>
                              <span className="text-xs font-medium text-green-100">Available</span>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap gap-1 justify-center mb-3">
                            {formData.skills ? formData.skills.split(',').slice(0, 2).filter(skill => skill.trim()).map((skill, index) => (
                              <span key={index} className="bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium text-white border border-white/30">
                                {skill.trim()}
                              </span>
                            )) : (
                              <span className="bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium text-white/80 border border-white/30">
                                스킬 정보
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-center gap-2 text-xs text-white/90">
                            <i className="ri-at-line drop-shadow-md"></i>
                            <span className="truncate drop-shadow-md">{formData.contact || '연락처'}</span>
                          </div>
                        </div>
                        
                        <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-white/20 via-transparent to-white/20 opacity-50 pointer-events-none"></div>
                      </div>
                    </div>

                    {/* Back Side */}
                    <div 
                      className="absolute inset-0 backface-hidden rotate-y-180"
                      style={{ 
                        backfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)'
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-white/10 to-white/5 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl shadow-black/50 group-hover:shadow-white/10 transition-shadow duration-300">
                        <div className="h-full p-5 flex flex-col text-white">
                          
                          <div className="text-center mb-3">
                            <h4 className="font-bold text-white text-sm mb-1 drop-shadow-lg tracking-tight">소개</h4>
                            <div className="w-8 h-px bg-white/30 mx-auto"></div>
                          </div>
                          
                          <div className="flex-1 mb-3">
                            <p className="text-white/90 text-xs leading-tight tracking-tight line-clamp-6">
                              {formData.aiSummary || formData.bio || 'AI가 업로드된 자료를 바탕으로 요약을 생성합니다...'}
                            </p>
                          </div>
                          
                          {(formData.resumeFileUrl || formData.resumeFilePreview) && (
                            <div className="mb-3 p-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                              <div className="flex items-center justify-center text-white/80">
                                <i className="ri-file-pdf-line text-xs mr-1.5"></i>
                                <span className="text-xs font-medium">이력서 첨부됨</span>
                              </div>
                            </div>
                          )}
                          
                          {formData.skills && (
                            <div className="mb-3">
                              <div className="flex flex-wrap gap-1 justify-center">
                                {formData.skills.split(',').slice(0, 6).filter(skill => skill.trim()).map((skill, index) => (
                                  <span key={index} className="bg-white/15 backdrop-blur-sm px-2 py-0.5 rounded-full text-xs font-medium text-white/90 border border-white/20">
                                    {skill.trim()}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          <div className="space-y-2">
                            <div className="flex items-center justify-center gap-1.5 text-xs text-white/90">
                              <i className="ri-at-line text-xs"></i>
                              <span className="truncate font-medium tracking-tight">{formData.contact || '연락처'}</span>
                            </div>
                            {formData.portfolioLink && (
                              <div className="flex items-center justify-center gap-1.5 text-xs text-white/90">
                                <i className="ri-external-link-line text-xs"></i>
                                <span className="font-medium tracking-tight">포트폴리오</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-white/20 via-transparent to-white/20 opacity-50 pointer-events-none"></div>
                      </div>
                    </div>
                  </div>

                  {/* Flip Indicator */}
                  <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-white/40 text-xs flex items-center gap-1">
                    <div className="w-1 h-1 bg-white/40 rounded-full group-hover:bg-white/60 transition-colors"></div>
                    <div className="w-1 h-1 bg-white/40 rounded-full group-hover:bg-white/60 transition-colors"></div>
                    <div className="w-1 h-1 bg-white/40 rounded-full group-hover:bg-white/60 transition-colors"></div>
                  </div>
                </div>
              </div>
              
              {/* Broadcasting Option */}
              <div className="mt-16 max-w-2xl mx-auto">
                <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10">
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-white mb-2">민팅 방식 선택</h3>
                    <p className="text-white/70">어떤 방식으로 NFT를 생성하시겠습니까?</p>
                  </div>
                  
                  <div className="space-y-4">
                    {/* 개인 민팅 옵션 */}
                    <div 
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                        !isBroadcasting 
                          ? 'border-white/30 bg-white/10' 
                          : 'border-white/10 bg-white/5'
                      }`}
                      onClick={() => setIsBroadcasting(false)}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          !isBroadcasting 
                            ? 'border-white bg-white' 
                            : 'border-white/30'
                        }`}>
                          {!isBroadcasting && (
                            <div className="w-3 h-3 bg-black rounded-full"></div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-white mb-1">👤 개인 민팅</h4>
                          <p className="text-white/70 text-sm">
                            자신의 지갑에만 NFT를 생성합니다.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* 브로드캐스팅 옵션 */}
                    <div 
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                        isBroadcasting 
                          ? 'border-purple-400/50 bg-purple-500/10' 
                          : 'border-white/10 bg-white/5'
                      }`}
                      onClick={() => setIsBroadcasting(true)}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          isBroadcasting 
                            ? 'border-purple-400 bg-purple-400' 
                            : 'border-white/30'
                        }`}>
                          {isBroadcasting && (
                            <div className="w-3 h-3 bg-white rounded-full"></div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-white mb-1">📡 브로드캐스팅</h4>
                          <p className="text-white/70 text-sm">
                            모든 등록된 지갑 주소에 NFT를 동시에 배포합니다.
                          </p>
                          <p className="text-purple-300 text-xs mt-1">
                            🌐 Web3 네트워크 전체에 명함을 배포하여 더 넓은 네트워킹을 시작하세요!
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* 브로드캐스팅 선택 시 추가 정보 */}
                  {isBroadcasting && (
                    <div className="mt-6 p-4 bg-purple-500/10 rounded-2xl border border-purple-400/30">
                      <div className="flex items-center gap-2 mb-2">
                        <i className="ri-information-line text-purple-300"></i>
                        <span className="text-purple-300 font-medium text-sm">브로드캐스팅 정보</span>
                      </div>
                      <ul className="text-white/70 text-sm space-y-1">
                        <li>• 등록된 모든 지갑 주소에 NFT가 전송됩니다</li>
                        <li>• 여러 사람이 동시에 받을 수 있습니다</li>
                        <li>• 네트워크 수수료는 동일합니다</li>
                        <li>• 더 많은 사람들과 연결될 수 있습니다</li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 5: 완료 */}
          {step === 5 && (
            <div className="text-center">
              <div className="w-32 h-32 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full mx-auto mb-8 flex items-center justify-center">
                <i className="ri-check-line text-5xl text-white"></i>
              </div>
              <h2 className="text-5xl font-bold text-white mb-6">완성!</h2>
              <p className="text-xl text-white/70 mb-12 max-w-2xl mx-auto leading-relaxed">
                당신의 명판 NFT가 성공적으로 생성되었습니다.<br />
                Web3 네트워크 전반에 자동으로 배포되었습니다.
              </p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <Link href="/gallery" className="bg-white text-black px-8 py-4 rounded-full font-semibold text-lg hover:bg-white/90 transition-all">
                  갤러리 보기
                </Link>
                <Link href="/create" className="border-2 border-white/30 text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-white/10 hover:border-white/50 transition-all">
                  새 명판 만들기
                </Link>
              </div>
            </div>
          )}

          {/* Navigation */}
          {step < 5 && (
            <div className="flex justify-between mt-16">
              <button
                onClick={handleBack}
                disabled={step === 1}
                className={`px-8 py-4 rounded-full font-semibold transition-all text-lg ${
                  step === 1 
                    ? 'bg-white/10 text-white/40 cursor-not-allowed' 
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                이전
              </button>
              
              {step < 4 ? (
                <button
                  onClick={handleNext}
                  className="bg-white text-black px-8 py-4 rounded-full font-semibold text-lg hover:bg-white/90 transition-all"
                >
                  다음
                </button>
              ) : (
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || isCreatingProfile || isMinting || isBatchMinting}
                  className="bg-white text-black px-8 py-4 rounded-full font-semibold text-lg hover:bg-white/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {(isGenerating || isCreatingProfile || isMinting || isBatchMinting) && (
                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                  )}
                  {isCreatingProfile ? '프로필 생성 중...' :
                   isMinting ? 'NFT 민팅 중...' :
                   isBatchMinting ? '브로드캐스팅 중...' :
                   isGenerating ? '처리 중...' : 
                   isBroadcasting ? '📡 브로드캐스팅 민팅' : '👤 개인 민팅'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreatePage;