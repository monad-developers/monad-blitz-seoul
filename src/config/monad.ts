/**
 * Monad Testnet Configuration
 *
 * Chainlink Price Feeds 및 토큰 주소 설정
 */

export const MONAD_TESTNET_CONFIG = {
    chainId: 10143,
    name: 'Monad Testnet',

    /**
     * Chainlink Price Feeds
     * @see https://docs.monad.xyz/price-feeds
     */
    priceFeeds: {
        // ⚠️ ETH/USD, USDT/USD, USDC/USD는 Monad Testnet에서 지원 중단됨
        // ETH_USD: '0x0c76859E85727683Eeba0C70Bc2e0F5781337818',
        // USDT_USD: '0x14eE6bE30A91989851Dc23203E41C804D4D71441',
        // USDC_USD: '0x70BB0758a38ae43418ffcEd9A25273dd4e804D15',
        BTC_USD: '0x2Cd9D7E85494F68F5aF08EF96d6FD5e8F71B4d31',
        LINK_USD: '0x4682035965Cd2B88759193ee2660d8A0766e1391',
        SOL_USD: '0x1c2f27C736aC97886F017AbdEedEd81C3C8Af7Be',
        DOGE_USD: '0x7F1c8B16Ba16AA5a8e720dA162f0d9191f2e6EC5',
        PEPE_USD: '0x5db2F4591d04CABc9E5C4016e9477A80d383D298',
    },

    /**
     * Token Addresses
     *
     * ⚠️ 주의: 실제 Monad Testnet 토큰 주소로 업데이트 필요
     * SOL은 Wrapped SOL (wSOL) 토큰 주소를 사용합니다.
     */
    tokens: {
        // SOL: Monad Testnet의 Wrapped SOL 주소
        SOL: process.env.MONAD_SOL_ADDRESS || '0x5387C85A4965769f6B0Df430638a1388493486F1',
    },
} as const;

/**
 * Monad Testnet 토큰 주소 검증
 */
export function validateMonadTokens(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    const zeroAddress = '0x0000000000000000000000000000000000000000';

    if (MONAD_TESTNET_CONFIG.tokens.SOL === zeroAddress) {
        errors.push('SOL 주소가 설정되지 않았습니다. MONAD_SOL_ADDRESS 환경 변수를 설정하세요.');
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}

/**
 * Hardhat 배포용 설정 Export
 */
export function getMonadDeployConfig() {
    return {
        solUsdFeed: MONAD_TESTNET_CONFIG.priceFeeds.SOL_USD,
        sol: MONAD_TESTNET_CONFIG.tokens.SOL,
    };
}
