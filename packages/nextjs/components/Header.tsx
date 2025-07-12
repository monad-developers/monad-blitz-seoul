"use client";

import React, { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { hardhat } from "viem/chains";
import { FaucetButton, RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { useOutsideClick, useTargetNetwork } from "~~/hooks/scaffold-eth";

type HeaderMenuLink = {
  label: string;
  href: string;
  icon?: string;
};

export const menuLinks: HeaderMenuLink[] = [
  {
    label: "홈",
    href: "/",
    icon: "ri-home-line",
  },
  {
    label: "명판 만들기",
    href: "/create",
    icon: "ri-user-add-line",
  },
  {
    label: "갤러리",
    href: "/gallery",
    icon: "ri-gallery-line",
  },
  {
    label: "에어드랍",
    href: "/airdrop",
    icon: "ri-rocket-line",
  },
  {
    label: "로그인",
    href: "/login",
    icon: "ri-login-box-line",
  },
  {
    label: "디버그",
    href: "/debug",
    icon: "ri-code-line",
  },
  {
    label: "탐색기",
    href: "/blockexplorer",
    icon: "ri-search-line",
  },
];

export const HeaderMenuLinks = () => {
  const pathname = usePathname();

  return (
    <>
      {menuLinks.map(({ label, href, icon }) => {
        const isActive = pathname === href;
        return (
          <li key={href}>
            <Link
              href={href}
              passHref
              className={`${
                isActive ? "text-white bg-white/20" : "text-white/70"
              } hover:text-white hover:bg-white/10 transition-colors py-2 px-4 text-sm rounded-full gap-3 flex items-center`}
            >
              {icon && <i className={`${icon} text-base`}></i>}
              <span>{label}</span>
            </Link>
          </li>
        );
      })}
    </>
  );
};

/**
 * Site header
 */
export const Header = () => {
  const { targetNetwork } = useTargetNetwork();
  const isLocalNetwork = targetNetwork.id === hardhat.id;

  const burgerMenuRef = useRef<HTMLDetailsElement>(null);
  useOutsideClick(burgerMenuRef, () => {
    burgerMenuRef?.current?.removeAttribute("open");
  });

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="text-3xl font-bold text-white font-pacifico">
            MintMe
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/gallery" className="text-white/70 hover:text-white transition-colors">갤러리</Link>
            <Link href="/create" className="bg-white text-black px-6 py-2 rounded-full font-medium hover:bg-white/90 transition-all">
              명판 만들기
            </Link>
            <RainbowKitCustomConnectButton />
            {isLocalNetwork && <FaucetButton />}
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden">
            <details className="dropdown dropdown-end" ref={burgerMenuRef}>
              <summary className="btn btn-ghost m-1">
                <i className="ri-menu-line text-white text-xl"></i>
              </summary>
              <ul
                className="dropdown-content menu p-4 shadow-lg bg-black/90 backdrop-blur-md border border-white/10 rounded-2xl w-64 mt-4"
                onClick={() => {
                  burgerMenuRef?.current?.removeAttribute("open");
                }}
              >
                <HeaderMenuLinks />
                <li className="mt-4 pt-4 border-t border-white/10">
                  <div className="flex flex-col gap-3">
                    <RainbowKitCustomConnectButton />
                    {isLocalNetwork && <FaucetButton />}
                  </div>
                </li>
              </ul>
            </details>
          </div>
        </div>
      </div>
    </nav>
  );
};
