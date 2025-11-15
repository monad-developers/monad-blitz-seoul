# 프론트엔드 구현

## 🗂️ 프로젝트 구조

```
frontend/
├── src/
│   ├── components/
│   │   ├── MintPreview.tsx       # 민팅 미리보기
│   │   ├── MinecraftRenderer.tsx # Three.js 렌더러
│   │   ├── WealthDisplay.tsx     # 자산 정보 표시
│   │   └── NFTGallery.tsx        # NFT 갤러리
│   ├── utils/
│   │   ├── traits.ts             # Trait 생성 로직
│   │   ├── colors.ts             # 색상 팔레트
│   │   ├── wealth.ts             # 자산 계산
│   │   └── ipfs.ts               # IPFS 업로드
│   ├── services/
│   │   ├── renderer.ts           # Three.js 렌더링
│   │   ├── gifGenerator.ts       # GIF 생성
│   │   └── contract.ts           # 컨트랙트 인터랙션
│   └── hooks/
│       ├── useContract.ts
│       ├── useWealth.ts
│       └── useIPFS.ts
└── public/
    └── models/                   # 3D 모델 파일들
        ├── wooden_sword.glb
        ├── golden_crown.glb
        └── ...
```

---

## 🎯 메인 워크플로우

```typescript
// src/services/mintWorkflow.ts
import { ethers } from 'ethers';
import { renderMinecraftSkin } from './renderer';
import { generateAnimatedGIF } from './gifGenerator';
import { uploadToIPFS } from '../utils/ipfs';

export async function executeMintWorkflow(
    userAddress: string,
    contract: ethers.Contract
) {
    // 1. 미리보기 데이터 조회
    console.log('Fetching preview data...');
    const [traits, totalWealth, wealthTier, specialItem, ethValue, usdtValue, usdcValue] =
        await contract.previewMint(userAddress);

    console.log('Wealth Info:', {
        total: ethers.formatUnits(totalWealth, 8),
        tier: wealthTier,
        specialItem: specialItem,
    });

    // 2. Three.js로 3D 모델 생성
    console.log('Rendering 3D model...');
    const { scene, camera, renderer } = await renderMinecraftSkin(
        userAddress,
        {
            hatStyle: traits.hatStyle,
            hatColor: traits.hatColor,
            hatOpacity: traits.hatOpacity,
            clothesStyle: traits.clothesStyle,
            clothesColor: traits.clothesColor,
            clothesOpacity: traits.clothesOpacity,
            shoesStyle: traits.shoesStyle,
            shoesColor: traits.shoesColor,
            shoesOpacity: traits.shoesOpacity,
            pantsStyle: traits.pantsStyle,
            pantsColor: traits.pantsColor,
            pantsOpacity: traits.pantsOpacity,
            skinTone: traits.skinTone,
            skinShade: traits.skinShade,
        },
        wealthTier,
        specialItem
    );

    // 3. 애니메이션 GIF 생성
    console.log('Generating animated GIF...');
    const gifBlob = await generateAnimatedGIF(scene, camera, renderer, {
        frameCount: 60,
        fps: 30,
        width: 512,
        height: 512,
    });

    // 4. IPFS에 업로드
    console.log('Uploading to IPFS...');
    const { gifCID, metadataCID } = await uploadToIPFS(gifBlob, {
        tokenId: 'TBD',
        traits: traits,
        wealthTier: wealthTier,
        specialItem: specialItem,
        totalWealthUSD: ethers.formatUnits(totalWealth, 8),
    });

    console.log('IPFS Upload Complete:', {
        gif: `ipfs://${gifCID}`,
        metadata: `ipfs://${metadataCID}`,
    });

    // 5. 민팅 트랜잭션
    console.log('Minting NFT...');
    const tx = await contract.mint(`ipfs://${metadataCID}`);
    const receipt = await tx.wait();

    // 6. 토큰 ID 추출
    const mintEvent = receipt.logs.find((log: any) => log.eventName === 'NFTMinted');
    const tokenId = mintEvent?.args?.tokenId;

    console.log('Minting Complete! Token ID:', tokenId.toString());

    return {
        tokenId: tokenId.toString(),
        gifCID,
        metadataCID,
        transactionHash: receipt.hash,
    };
}
```

---

## ⚛️ React 컴포넌트

### 1. MintPage (메인 페이지)

```typescript
// src/components/MintPage.tsx
import { useState } from 'react';
import { useAccount, useContractWrite, useWaitForTransaction } from 'wagmi';
import { executeMintWorkflow } from '../services/mintWorkflow';
import { WealthDisplay } from './WealthDisplay';
import { MinecraftRenderer } from './MinecraftRenderer';

export function MintPage() {
    const { address } = useAccount();
    const [isGenerating, setIsGenerating] = useState(false);
    const [previewData, setPreviewData] = useState<any>(null);
    const [mintResult, setMintResult] = useState<any>(null);

    const handlePreview = async () => {
        if (!address) return;

        setIsGenerating(true);
        try {
            // 미리보기 데이터 조회
            const data = await contract.previewMint(address);
            setPreviewData(data);
        } catch (error) {
            console.error('Preview failed:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleMint = async () => {
        if (!address) return;

        setIsGenerating(true);
        try {
            const result = await executeMintWorkflow(address, contract);
            setMintResult(result);
        } catch (error) {
            console.error('Minting failed:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="mint-page">
            <h1>Mint Your Minecraft PFP</h1>

            {!previewData && (
                <button onClick={handlePreview} disabled={isGenerating}>
                    {isGenerating ? 'Generating Preview...' : 'Preview Your NFT'}
                </button>
            )}

            {previewData && (
                <>
                    <WealthDisplay data={previewData} />
                    <MinecraftRenderer
                        address={address}
                        traits={previewData.traits}
                        wealthTier={previewData.wealthTier}
                        specialItem={previewData.specialItem}
                    />

                    {!mintResult && (
                        <button onClick={handleMint} disabled={isGenerating}>
                            {isGenerating ? 'Minting...' : 'Mint NFT'}
                        </button>
                    )}
                </>
            )}

            {mintResult && (
                <div className="mint-success">
                    <h2>Minting Successful! 🎉</h2>
                    <p>Token ID: {mintResult.tokenId}</p>
                    <p>Transaction: {mintResult.transactionHash}</p>
                    <a href={`https://ipfs.io/ipfs/${mintResult.gifCID}`} target="_blank">
                        View on IPFS
                    </a>
                </div>
            )}
        </div>
    );
}
```

### 2. WealthDisplay (자산 표시)

```typescript
// src/components/WealthDisplay.tsx
import { ethers } from 'ethers';

interface WealthDisplayProps {
    data: {
        totalWealthUSD: bigint;
        wealthTier: number;
        ethValueUSD: bigint;
        usdtValueUSD: bigint;
        usdcValueUSD: bigint;
        specialItem: number;
    };
}

const TIER_NAMES = ['None', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'];

export function WealthDisplay({ data }: WealthDisplayProps) {
    const totalUSD = parseFloat(ethers.formatUnits(data.totalWealthUSD, 8));
    const ethUSD = parseFloat(ethers.formatUnits(data.ethValueUSD, 8));
    const usdtUSD = parseFloat(ethers.formatUnits(data.usdtValueUSD, 8));
    const usdcUSD = parseFloat(ethers.formatUnits(data.usdcValueUSD, 8));

    return (
        <div className="wealth-display">
            <h2>Your Portfolio</h2>

            <div className="total-wealth">
                <span className="label">Total Value</span>
                <span className="value">${totalUSD.toLocaleString()}</span>
            </div>

            <div className="wealth-breakdown">
                <div className="asset">
                    <span className="label">ETH</span>
                    <span className="value">${ethUSD.toLocaleString()}</span>
                </div>
                <div className="asset">
                    <span className="label">USDT</span>
                    <span className="value">${usdtUSD.toLocaleString()}</span>
                </div>
                <div className="asset">
                    <span className="label">USDC</span>
                    <span className="value">${usdcUSD.toLocaleString()}</span>
                </div>
            </div>

            <div className="tier-badge">
                <span className={`tier tier-${data.wealthTier}`}>
                    {TIER_NAMES[data.wealthTier]} Tier
                </span>
            </div>

            {data.specialItem > 0 && (
                <div className="special-item">
                    <span className="label">Special Item</span>
                    <span className="value">#{data.specialItem}</span>
                </div>
            )}
        </div>
    );
}
```

### 3. MinecraftRenderer (3D 렌더러)

```typescript
// src/components/MinecraftRenderer.tsx
import { useEffect, useRef } from 'react';
import { renderMinecraftSkin } from '../services/renderer';

interface MinecraftRendererProps {
    address: string;
    traits: any;
    wealthTier: number;
    specialItem: number;
}

export function MinecraftRenderer({ address, traits, wealthTier, specialItem }: MinecraftRendererProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        let animationId: number;

        async function render() {
            const { scene, camera, renderer } = await renderMinecraftSkin(
                address,
                traits,
                wealthTier,
                specialItem
            );

            containerRef.current?.appendChild(renderer.domElement);

            // 애니메이션 루프
            function animate() {
                animationId = requestAnimationFrame(animate);
                renderer.render(scene, camera);
            }

            animate();
        }

        render();

        return () => {
            if (animationId) {
                cancelAnimationFrame(animationId);
            }
        };
    }, [address, traits, wealthTier, specialItem]);

    return <div ref={containerRef} className="minecraft-renderer" />;
}
```

### 4. NFTGallery (갤러리)

```typescript
// src/components/NFTGallery.tsx
import { useState, useEffect } from 'react';
import { useContractRead } from 'wagmi';

export function NFTGallery() {
    const [nfts, setNfts] = useState<any[]>([]);

    const { data: totalSupply } = useContractRead({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'totalSupply',
    });

    useEffect(() => {
        if (!totalSupply) return;

        async function loadNFTs() {
            const nftData = [];

            for (let i = 1; i <= Number(totalSupply); i++) {
                const info = await contract.getTokenInfo(i);
                const metadataUri = await contract.tokenURI(i);

                // IPFS에서 메타데이터 가져오기
                const metadata = await fetch(metadataUri.replace('ipfs://', 'https://ipfs.io/ipfs/'));
                const json = await metadata.json();

                nftData.push({
                    tokenId: i,
                    owner: info.owner,
                    image: json.image.replace('ipfs://', 'https://ipfs.io/ipfs/'),
                    attributes: json.attributes,
                });
            }

            setNfts(nftData);
        }

        loadNFTs();
    }, [totalSupply]);

    return (
        <div className="nft-gallery">
            <h1>NFT Gallery</h1>

            <div className="grid">
                {nfts.map((nft) => (
                    <div key={nft.tokenId} className="nft-card">
                        <img src={nft.image} alt={`NFT #${nft.tokenId}`} />
                        <h3>#{nft.tokenId}</h3>
                        <p>Owner: {nft.owner.slice(0, 6)}...{nft.owner.slice(-4)}</p>

                        <div className="attributes">
                            {nft.attributes.map((attr: any, i: number) => (
                                <div key={i} className="attribute">
                                    <span className="trait-type">{attr.trait_type}</span>
                                    <span className="value">{attr.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
```

---

## 🪝 Custom Hooks

### 1. useContract

```typescript
// src/hooks/useContract.ts
import { useContract as useWagmiContract } from 'wagmi';
import CONTRACT_ABI from '../contracts/MinecraftPFP.json';

export function useContract() {
    const contract = useWagmiContract({
        address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
    });

    return contract;
}
```

### 2. useWealth

```typescript
// src/hooks/useWealth.ts
import { useContractRead } from 'wagmi';
import { useContract } from './useContract';

export function useWealth(address: string) {
    const contract = useContract();

    const { data, isLoading, error } = useContractRead({
        address: contract.address,
        abi: contract.abi,
        functionName: 'previewMint',
        args: [address],
        enabled: !!address,
    });

    return {
        wealthData: data,
        isLoading,
        error,
    };
}
```

### 3. useIPFS

```typescript
// src/hooks/useIPFS.ts
import { useState } from 'react';
import { uploadToIPFS } from '../utils/ipfs';

export function useIPFS() {
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const upload = async (blob: Blob, metadata: any) => {
        setIsUploading(true);
        setError(null);

        try {
            const result = await uploadToIPFS(blob, metadata);
            return result;
        } catch (err) {
            setError(err as Error);
            throw err;
        } finally {
            setIsUploading(false);
        }
    };

    return {
        upload,
        isUploading,
        error,
    };
}
```

---

## 🎨 스타일링

```css
/* src/styles/MintPage.css */
.mint-page {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
}

.wealth-display {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 1rem;
    padding: 2rem;
    color: white;
    margin-bottom: 2rem;
}

.total-wealth {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    font-size: 2rem;
    font-weight: bold;
}

.wealth-breakdown {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
    margin-bottom: 1rem;
}

.tier-badge {
    text-align: center;
    padding: 1rem;
}

.tier {
    padding: 0.5rem 1.5rem;
    border-radius: 2rem;
    font-weight: bold;
    font-size: 1.2rem;
}

.tier-0 { background: #6b7280; }
.tier-1 { background: #cd7f32; }
.tier-2 { background: #c0c0c0; }
.tier-3 { background: #ffd700; }
.tier-4 { background: #e5e4e2; }
.tier-5 { background: #b9f2ff; }

.minecraft-renderer {
    width: 100%;
    height: 600px;
    display: flex;
    justify-content: center;
    align-items: center;
    background: #87ceeb;
    border-radius: 1rem;
    overflow: hidden;
}

.nft-gallery {
    padding: 2rem;
}

.grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 2rem;
}

.nft-card {
    background: white;
    border-radius: 1rem;
    overflow: hidden;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    transition: transform 0.3s;
}

.nft-card:hover {
    transform: translateY(-5px);
}

.nft-card img {
    width: 100%;
    height: 300px;
    object-fit: cover;
}

.attributes {
    padding: 1rem;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
}

.attribute {
    display: flex;
    flex-direction: column;
    background: #f3f4f6;
    padding: 0.5rem;
    border-radius: 0.5rem;
}

.trait-type {
    font-size: 0.75rem;
    color: #6b7280;
    text-transform: uppercase;
}

.value {
    font-weight: bold;
    color: #1f2937;
}
```

---

## 🔧 환경 설정

```env
# .env.local
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_PINATA_JWT=...
NEXT_PUBLIC_PINATA_GATEWAY=...
NEXT_PUBLIC_RPC_URL=...
NEXT_PUBLIC_CHAIN_ID=1
```

---

## 📦 package.json

```json
{
  "name": "minecraft-pfp-frontend",
  "version": "1.0.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "three": "^0.160.0",
    "gif.js": "^0.2.0",
    "pinata-web3": "^0.1.0",
    "ethers": "^6.9.0",
    "wagmi": "^2.0.0",
    "viem": "^2.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.2.0",
    "@types/three": "^0.160.0",
    "typescript": "^5.3.0"
  }
}
```
