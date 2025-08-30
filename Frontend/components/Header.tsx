'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';

export default function Header() {
  const pathname = usePathname();
  const { isConnected } = useAccount();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-xl border-b border-[#744CCC]/10">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link 
          href="/" 
          className="text-xl font-bold text-white hover:text-[#744CCC] transition-colors"
        >
          MusicWithNow
        </Link>

        <div className="flex items-center gap-6">
          {isConnected && (
            <nav className="flex items-center gap-6">
              <Link 
                href="/music" 
                className={`text-sm ${
                  pathname === '/music' 
                    ? 'text-[#744CCC]' 
                    : 'text-gray-400 hover:text-white'
                } transition-colors`}
              >
                내 음악
              </Link>
              <Link 
                href="/collaborate" 
                className={`text-sm ${
                  pathname.startsWith('/collaborate') 
                    ? 'text-[#744CCC]' 
                    : 'text-gray-400 hover:text-white'
                } transition-colors`}
              >
                협업하기
              </Link>
            </nav>
          )}
          <div className="h-8 w-px bg-white/10" />
          <ConnectButton.Custom>
            {({
              account,
              chain,
              openAccountModal,
              openChainModal,
              openConnectModal,
              mounted,
            }) => {
              const ready = mounted;
              const connected = ready && account && chain;

              return (
                <div
                  {...(!ready && {
                    'aria-hidden': true,
                    style: {
                      opacity: 0,
                      pointerEvents: 'none',
                      userSelect: 'none',
                    },
                  })}
                >
                  {(() => {
                    if (!connected) {
                      return (
                        <button
                          onClick={openConnectModal}
                          className="bg-[#744CCC] hover:bg-[#744CCC]/90 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                          지갑 연결하기
                        </button>
                      );
                    }

                    return (
                      <div className="flex items-center gap-4">
                        <button
                          onClick={openChainModal}
                          className="flex items-center gap-2 bg-[#744CCC]/10 text-[#744CCC] px-3 py-1.5 rounded-lg hover:bg-[#744CCC]/20 transition-colors"
                        >
                          {chain.hasIcon && (
                            <div className="w-5 h-5">
                              {chain.iconUrl && (
                                <img
                                  alt={chain.name ?? 'Chain icon'}
                                  src={chain.iconUrl}
                                  className="w-5 h-5"
                                />
                              )}
                            </div>
                          )}
                          {chain.name}
                        </button>

                        <button
                          onClick={openAccountModal}
                          className="flex items-center gap-2 bg-[#744CCC]/10 hover:bg-[#744CCC]/20 rounded-lg px-3 py-1.5 transition-colors"
                        >
                          <div className="w-5 h-5 rounded-full bg-[#744CCC]/30 flex items-center justify-center">
                            <span className="text-xs font-medium text-[#744CCC]">
                              {account.displayName.charAt(0)}
                            </span>
                          </div>
                          <span className="text-sm text-[#744CCC]">
                            {account.displayName}
                          </span>
                        </button>
                      </div>
                    );
                  })()}
                </div>
              );
            }}
          </ConnectButton.Custom>
        </div>
      </div>
    </header>
  );
}
