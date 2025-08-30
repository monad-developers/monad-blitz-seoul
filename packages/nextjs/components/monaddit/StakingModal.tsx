"use client";

import React, { useState } from "react";
import { useAccount, useBalance } from "wagmi";
import { formatEther, parseEther } from "viem";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Coins,
  Lock,
  ArrowDownToLine,
  ArrowUpFromLine,
  AlertCircle,
  CheckCircle,
  Timer,
  Shield,
} from "lucide-react";
import { toast } from "sonner";

interface StakingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const mockUserStake = {
  totalStaked: "100",
  available: "85",
  locked: "15",
  stakedAt: Date.now() - 10 * 24 * 60 * 60 * 1000, // 10 days ago
  isEligible: true,
};

const mockMdtBalance = "500";

export default function StakingModal({ open, onOpenChange }: StakingModalProps) {
  const { address, isConnected } = useAccount();
  const [amount, setAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState("stake");

  const handleStake = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setIsProcessing(true);
    try {
      // TODO: Implement actual staking logic
      console.log("Staking", amount, "MDT");
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate transaction
      toast.success(`Successfully staked ${amount} MDT`);
      setAmount("");
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to stake MDT");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWithdraw = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (parseFloat(amount) > parseFloat(mockUserStake.available)) {
      toast.error("Insufficient available balance");
      return;
    }

    setIsProcessing(true);
    try {
      // TODO: Implement actual withdrawal logic
      console.log("Withdrawing", amount, "MDT");
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate transaction
      toast.success(`Successfully withdrew ${amount} MDT`);
      setAmount("");
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to withdraw MDT");
    } finally {
      setIsProcessing(false);
    }
  };

  const stakeAge = Math.floor((Date.now() - mockUserStake.stakedAt) / (1000 * 60 * 60 * 24));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Manage Your Stake</DialogTitle>
          <DialogDescription>
            Stake MDT tokens to participate in the Monaddit ecosystem
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Stake Overview */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Staked</span>
              <span className="font-semibold flex items-center gap-1">
                <Coins className="h-4 w-4" />
                {mockUserStake.totalStaked} MDT
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Available</span>
              <span className="text-green-600 dark:text-green-400 font-medium">
                {mockUserStake.available} MDT
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Locked in Content</span>
              <span className="text-orange-600 dark:text-orange-400 font-medium flex items-center gap-1">
                <Lock className="h-3 w-3" />
                {mockUserStake.locked} MDT
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Stake Age</span>
              <Badge variant="secondary" className="text-xs">
                <Timer className="h-3 w-3 mr-1" />
                {stakeAge} days
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Eligibility</span>
              {mockUserStake.isEligible ? (
                <Badge variant="default" className="bg-green-600 text-xs">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Eligible for Rewards
                </Badge>
              ) : (
                <Badge variant="destructive" className="text-xs">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Not Eligible
                </Badge>
              )}
            </div>
          </div>

          {/* Staking Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="stake">
                <ArrowDownToLine className="h-4 w-4 mr-2" />
                Stake
              </TabsTrigger>
              <TabsTrigger value="withdraw">
                <ArrowUpFromLine className="h-4 w-4 mr-2" />
                Withdraw
              </TabsTrigger>
            </TabsList>

            <TabsContent value="stake" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="stake-amount">Amount to Stake</Label>
                <div className="relative">
                  <Input
                    id="stake-amount"
                    type="number"
                    placeholder="0.0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pr-16"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    MDT
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Wallet Balance:</span>
                  <button
                    className="hover:text-primary transition-colors"
                    onClick={() => setAmount(mockMdtBalance)}
                  >
                    {mockMdtBalance} MDT (Max)
                  </button>
                </div>
              </div>

              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Minimum stake: 10 MDT. Staking locks your tokens for governance and content moderation.
                  You need to maintain minimum stake to participate.
                </AlertDescription>
              </Alert>

              <Button
                className="w-full"
                onClick={handleStake}
                disabled={isProcessing || !amount}
              >
                {isProcessing ? "Processing..." : `Stake ${amount || "0"} MDT`}
              </Button>
            </TabsContent>

            <TabsContent value="withdraw" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="withdraw-amount">Amount to Withdraw</Label>
                <div className="relative">
                  <Input
                    id="withdraw-amount"
                    type="number"
                    placeholder="0.0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pr-16"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    MDT
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Available to Withdraw:</span>
                  <button
                    className="hover:text-primary transition-colors"
                    onClick={() => setAmount(mockUserStake.available)}
                  >
                    {mockUserStake.available} MDT (Max)
                  </button>
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  You must maintain at least 10 MDT staked to participate. 
                  {mockUserStake.locked} MDT is currently locked in content bonds.
                </AlertDescription>
              </Alert>

              <Button
                className="w-full"
                variant="destructive"
                onClick={handleWithdraw}
                disabled={isProcessing || !amount}
              >
                {isProcessing ? "Processing..." : `Withdraw ${amount || "0"} MDT`}
              </Button>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}