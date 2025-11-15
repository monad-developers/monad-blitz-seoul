/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,

  // 서버 전용 패키지 설정 (Next.js 13+)
  experimental: {
    serverComponentsExternalPackages: ['@napi-rs/canvas'],
  },

  webpack: (config, { isServer }) => {
    // MetaMask SDK의 React Native 관련 경고 무시
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      { module: /node_modules\/@metamask\/sdk/ },
    ];
    config.externals.push('pino-pretty', 'lokijs', 'encoding');

    // 클라이언트 사이드에서 서버 전용 라이브러리 완전 제외
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        '@napi-rs/canvas': false,
        canvas: false,
        '@react-native-async-storage/async-storage': false,
      };

      // 모든 canvas 관련 패키지를 클라이언트 번들에서 제외
      config.externals.push({
        '@napi-rs/canvas': 'commonjs @napi-rs/canvas',
      });
    } else {
      // 서버 사이드: @napi-rs/canvas를 external로 처리 (webpack이 번들링하지 않음)
      config.externals.push({
        '@napi-rs/canvas': 'commonjs @napi-rs/canvas',
      });
    }

    // SSR에서 브라우저 전용 라이브러리 제외
    if (isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        'idb-keyval': false,
        '@walletconnect/keyvaluestorage': false,
      };
    }

    return config;
  },
};

module.exports = nextConfig;
