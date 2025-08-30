'use client';

import { Search, Sun, Moon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';

export function NewHeader() {
  const { address, isConnected } = useAccount();

  return (
    <header className="border-border bg-card border-b">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="max-w-md flex-1">
          <div className="relative">
            <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform" />
            <Input
              placeholder="Search challenges or DAOs"
              className="bg-background border-border pl-10"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isConnected ? (
            <>
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 text-xs text-white">
                  {address?.slice(2, 4).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-foreground text-sm">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </span>
            </>
          ) : (
            <ConnectButton.Custom>
              {({ openConnectModal }) => (
                <Button onClick={openConnectModal} variant="default" size="sm">
                  Connect Wallet
                </Button>
              )}
            </ConnectButton.Custom>
          )}
          <Button variant="ghost" size="sm">
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>
        </div>
      </div>
    </header>
  );
}
