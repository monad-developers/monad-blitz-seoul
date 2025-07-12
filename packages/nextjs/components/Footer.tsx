import React from "react";
import Link from "next/link";
import { hardhat } from "viem/chains";
import { SwitchTheme } from "~~/components/SwitchTheme";
import { Faucet } from "~~/components/scaffold-eth";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";
import { useGlobalState } from "~~/services/store/store";

/**
 * Site footer
 */
export const Footer = () => {
  const nativeCurrencyPrice = useGlobalState(state => state.nativeCurrency.price);
  const { targetNetwork } = useTargetNetwork();
  const isLocalNetwork = targetNetwork.id === hardhat.id;

  return (
    <>
      {/* Floating Tools */}
      <div className="fixed flex justify-between items-center w-full z-40 p-4 bottom-0 left-0 pointer-events-none">
        <div className="flex flex-col md:flex-row gap-2 pointer-events-auto">
          {nativeCurrencyPrice > 0 && (
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-3 py-2 flex items-center gap-2 text-white text-sm">
              <i className="ri-money-dollar-circle-line"></i>
              <span>${nativeCurrencyPrice.toFixed(2)}</span>
            </div>
          )}
          {isLocalNetwork && (
            <>
              <Faucet />
              <Link href="/blockexplorer" className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-3 py-2 flex items-center gap-2 text-white text-sm hover:bg-white/20 transition-colors">
                <i className="ri-search-line"></i>
                <span>Block Explorer</span>
              </Link>
            </>
          )}
        </div>
        <SwitchTheme className={`pointer-events-auto ${isLocalNetwork ? "self-end md:self-auto" : ""}`} />
      </div>

      {/* Main Footer */}
      <footer className="border-t border-white/10 py-12 bg-black">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-2xl font-bold text-white mb-6 md:mb-0 font-pacifico">
              MintMe
            </div>
            <div className="flex items-center space-x-8">
              <Link href="/gallery" className="text-white/60 hover:text-white transition-colors">갤러리</Link>
              <Link href="/create" className="text-white/60 hover:text-white transition-colors">명판 만들기</Link>
              <div className="flex items-center space-x-4">
                <a href="#" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors">
                  <i className="ri-twitter-line text-white"></i>
                </a>
                <a href="#" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors">
                  <i className="ri-discord-line text-white"></i>
                </a>
                <a href="https://github.com/scaffold-eth/se-2" target="_blank" rel="noreferrer" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors">
                  <i className="ri-github-line text-white"></i>
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 mt-8 pt-8 text-center text-white/50 text-sm">
            © 2024 MintMe. Web3 시대의 새로운 명함 플랫폼.
          </div>
        </div>
      </footer>
    </>
  );
};
