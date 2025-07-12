import { type Adapter } from '@solana/wallet-adapter-base';
import { type SolanaChain } from '@solana/wallet-standard-chains';
import { type SolanaSignAndSendTransactionFeature, type SolanaSignInFeature, type SolanaSignMessageFeature, type SolanaSignTransactionFeature } from '@solana/wallet-standard-features';
import type { Wallet, WalletIcon } from '@wallet-standard/base';
import { type StandardConnectFeature, type StandardDisconnectFeature, type StandardEventsFeature } from '@wallet-standard/features';
import { ReadonlyWalletAccount } from '@wallet-standard/wallet';
/** TODO: docs */
export declare class SolanaWalletAdapterWalletAccount extends ReadonlyWalletAccount {
    #private;
    constructor({ adapter, address, publicKey, chains, }: {
        adapter: Adapter;
        address: string;
        publicKey: Uint8Array;
        chains: readonly SolanaChain[];
    });
}
/** TODO: docs */
export declare class SolanaWalletAdapterWallet implements Wallet {
    #private;
    get version(): "1.0.0";
    get name(): import("@solana/wallet-adapter-base").WalletName<string>;
    get icon(): WalletIcon;
    get chains(): ("solana:mainnet" | "solana:devnet" | "solana:testnet" | "solana:localnet")[];
    get features(): StandardConnectFeature & StandardDisconnectFeature & StandardEventsFeature & SolanaSignAndSendTransactionFeature & Partial<SolanaSignTransactionFeature & SolanaSignMessageFeature & SolanaSignInFeature>;
    get accounts(): SolanaWalletAdapterWalletAccount[];
    get endpoint(): string | undefined;
    constructor(adapter: Adapter, chain: SolanaChain, endpoint?: string);
    destroy(): void;
}
/** TODO: docs */
export declare function registerWalletAdapter(adapter: Adapter, chain: SolanaChain, endpoint?: string, match?: (wallet: Wallet) => boolean): () => void;
//# sourceMappingURL=wallet.d.ts.map