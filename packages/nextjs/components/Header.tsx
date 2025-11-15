"use client";

import React, { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { hardhat } from "viem/chains";
import { Bars3Icon, BugAntIcon, TicketIcon, RectangleStackIcon } from "@heroicons/react/24/outline";
import { FaucetButton, RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { useOutsideClick, useTargetNetwork } from "~~/hooks/scaffold-eth";



type HeaderMenuLink = {
  label: string;
  href: string;
  icon?: React.ReactNode;
};

export const menuLinks: HeaderMenuLink[] = [
  {
    label: 'Home',
    href: '/'
  },
  {
    label: 'Events',
    href: '/events',
    icon: <TicketIcon className="h-4 w-4" />
  },
  {
    label: 'My Tickets',
    href: '/my-tickets',
    icon: <RectangleStackIcon className="h-4 w-4" />
  },
  {
    label: 'Debug Contracts',
    href: '/debug',
    icon: <BugAntIcon className="h-4 w-4" />
  }
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
                isActive
                  ? "text-[#6E54FF] font-semibold"
                  : "text-base-content/70 hover:text-[#6E54FF]"
              } py-2 px-3 text-sm rounded-lg gap-2 grid grid-flow-col font-mono transition-all hover:bg-base-content/5`}
            >
              {icon}
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
    <div className="sticky lg:static top-0 navbar backdrop-blur-xl bg-base-100/80 border-b border-base-content/10 min-h-0 shrink-0 justify-between z-20 px-4 sm:px-6 py-3">
      <div className="navbar-start w-auto lg:w-1/2">
        <details className="dropdown" ref={burgerMenuRef}>
          <summary className="ml-1 btn btn-ghost lg:hidden hover:bg-transparent">
            <Bars3Icon className="h-6 w-6 text-[#6E54FF]" />
          </summary>
          <ul
            className="menu menu-compact dropdown-content mt-3 p-3 glass-card-strong rounded-box w-56 space-y-1"
            onClick={() => {
              burgerMenuRef?.current?.removeAttribute("open");
            }}
          >
            <HeaderMenuLinks />
          </ul>
        </details>
        <Link href="/" passHref className="hidden lg:flex items-center gap-3 ml-4 mr-8 shrink-0 hover:opacity-80 transition-opacity">
          <div
            className="relative w-32 h-10 px-3 py-2"
            style={{
              filter: 'drop-shadow(0 0 12px rgba(255, 255, 255, 0.8))',
            }}
          >
            <Image
              alt="Monad Ticket logo"
              className="cursor-pointer"
              fill
              src="/service-logo.png"
              style={{ objectFit: 'contain' }}
              priority
            />
          </div>
        </Link>
        <ul className="hidden lg:flex lg:flex-nowrap menu menu-horizontal px-1 gap-1">
          <HeaderMenuLinks />
        </ul>
      </div>
      <div className="navbar-end grow mr-2 gap-2">
        <RainbowKitCustomConnectButton />
        {isLocalNetwork && <FaucetButton />}
      </div>
    </div>
  );
};