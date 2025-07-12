import { ConnectButton } from "@rainbow-me/rainbowkit";
import React from "react";

export const WalletConnectButton = () => {
  return (
    <ConnectButton.Custom>
      {(props) => {
        const {
          account,
          chain,
          // openAccountModal,
          openChainModal,
          openConnectModal,
          authenticationStatus,
          mounted,
        } = props;
        const ready = mounted && authenticationStatus !== "loading";
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus || authenticationStatus === "authenticated");

        return (
          <div>
            {(() => {
              if (!ready) {
                return (
                  <button
                    disabled={true}
                    type="button"
                    // variant={"hype"}
                    className={
                      "font-bold cursor-pointer w-full h-full text-4xl font-bold animate-pulse"
                    }
                  >
                    Connect Wallet To Start Game
                  </button>
                );
              }

              if (!connected) {
                return (
                  <button
                    onClick={openConnectModal}
                    type="button"
                    // variant={"hype"}
                    className={
                      "font-bold cursor-pointer max-w-full max-h-full text-4xl font-bold animate-pulse"
                    }
                  >
                    Connect Wallet To Start Game
                  </button>
                );
              }

              if (chain.unsupported) {
                return (
                  <button
                    onClick={openChainModal}
                    type="button"
                    // variant={"hype"}
                    className={
                      "font-bold cursor-pointer w-full h-full text-4xl font-bold animate-pulse"
                    }
                  >
                    Wrong network
                  </button>
                );
              }

              return <div className={"flex flex-row gap-2 items-center"}></div>;
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
};
