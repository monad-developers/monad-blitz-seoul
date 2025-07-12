"use client";

import React from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export function NavBar() {
  return (
    <nav className="z-10 sticky top-0 w-full border-none bg-[#836ef9]">
      <div className="flex items-center justify-between h-[84px] mx-auto px-4">
        <div className={"flex flex-row items-center gap-4 cursor-pointer"}>
          <span className={"flex text-2xl font-bold text-hype-100"}>
            MonaTX RPG
          </span>
        </div>
        <ConnectButton />
      </div>
    </nav>
  );
}
