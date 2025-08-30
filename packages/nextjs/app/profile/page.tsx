"use client";

import React, { useState } from "react";
import { useAccount } from "wagmi";
import {
  Trophy,
  Award,
  Coins,
  Clock,
  Shield,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  ExternalLink,
  Copy,
  Edit,
  History,
  Lock,
  Unlock,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Mock data - replace with actual blockchain data
const mockUserData = {
  address: "0x742d35Cc6634C0532925a3b844Bc8e70ea6b8963",
  username: "CryptoBuilder",
  joinedAt: "2024-01-15",
  sbtTokenId: 42,
  karma: 1250,
  disputeRate: 15,
  totalStake: "25.5",
  availableStake: "22.3",
  lockedStake: "3.2",
  pendingRewards: "5.8",
  nextEpochIn: "3 days",
  reputation: {
    level: "Gold",
    nextLevel: "Platinum",
    progress: 75,
  },
  stats: {
    totalPosts: 45,
    totalComments: 128,
    challengesWon: 8,
    challengesLost: 2,
    successRate: 80,
  },
};

const mockWithdrawableBonds = [
  {
    id: 1,
    type: "post",
    title: "Web3 Security Best Practices",
    amount: "0.1",
    unlockedAt: "2024-03-20",
    contentId: 123,
  },
  {
    id: 2,
    type: "comment",
    title: "Re: Monad Testnet Guide",
    amount: "0.1",
    unlockedAt: "2024-03-19",
    contentId: 124,
  },
];

const mockActiveDisputes = [
  {
    id: 1,
    type: "challenger",
    content: "Suspicious trading advice",
    status: "voting",
    stake: "0.2",
    createdAt: "2 days ago",
  },
  {
    id: 2,
    type: "defendant",
    content: "DeFi yield farming guide",
    status: "pending",
    stake: "0.1",
    createdAt: "1 day ago",
  },
];

const mockHistory = [
  {
    id: 1,
    action: "Post Created",
    description: "Web3 Security Best Practices",
    amount: "-0.1 MDT",
    timestamp: "2024-03-15 14:23",
    status: "completed",
  },
  {
    id: 2,
    action: "Challenge Won",
    description: "Reported spam content",
    amount: "+0.08 MDT",
    timestamp: "2024-03-14 09:15",
    status: "completed",
  },
  {
    id: 3,
    action: "Rewards Claimed",
    description: "Weekly epoch rewards",
    amount: "+2.3 MDT",
    timestamp: "2024-03-13 00:00",
    status: "completed",
  },
];

export default function ProfilePage() {
  const { address, isConnected } = useAccount();
  const [copiedAddress, setCopiedAddress] = useState(false);

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopiedAddress(true);
      toast.success("Address copied!");
      setTimeout(() => setCopiedAddress(false), 2000);
    }
  };

  const handleWithdrawBond = (bondId: number) => {
    console.log("Withdrawing bond:", bondId);
    toast.success("Bond withdrawn successfully!");
  };

  const handleClaimRewards = () => {
    console.log("Claiming rewards");
    toast.success(`${mockUserData.pendingRewards} MDT claimed!`);
  };

  const handleStakeMore = () => {
    console.log("Opening stake modal");
    // Open staking modal
  };

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please connect your wallet to view your profile.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Profile Header */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={`https://avatar.vercel.sh/${address}`} />
                <AvatarFallback>
                  {address?.slice(2, 4).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold mb-1">{mockUserData.username}</h1>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <code className="bg-secondary px-2 py-1 rounded">
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={copyAddress}
                  >
                    {copiedAddress ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <div className="flex items-center gap-4 mt-2">
                  <Badge variant="outline">
                    SBT #{mockUserData.sbtTokenId}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Joined {mockUserData.joinedAt}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
              <Button variant="outline" size="sm">
                <ExternalLink className="h-4 w-4 mr-2" />
                View on Explorer
              </Button>
            </div>
          </div>

          {/* Reputation Bar */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                <span className="font-semibold">{mockUserData.reputation.level} Tier</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {mockUserData.reputation.progress}% to {mockUserData.reputation.nextLevel}
              </span>
            </div>
            <Progress value={mockUserData.reputation.progress} className="h-2" />
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{mockUserData.karma}</div>
              <div className="text-xs text-muted-foreground">Karma</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{mockUserData.stats.totalPosts}</div>
              <div className="text-xs text-muted-foreground">Posts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{mockUserData.stats.successRate}%</div>
              <div className="text-xs text-muted-foreground">Success Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{mockUserData.disputeRate}%</div>
              <div className="text-xs text-muted-foreground">Dispute Rate</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="staking" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="staking">Staking</TabsTrigger>
          <TabsTrigger value="bonds">Bonds</TabsTrigger>
          <TabsTrigger value="disputes">Disputes</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* Staking Tab */}
        <TabsContent value="staking" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Coins className="h-5 w-5" />
                  Staking Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Staked</span>
                    <span className="font-bold">{mockUserData.totalStake} MDT</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Available</span>
                    <span className="font-medium text-green-600">
                      {mockUserData.availableStake} MDT
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Locked</span>
                    <span className="font-medium text-orange-600">
                      {mockUserData.lockedStake} MDT
                    </span>
                  </div>
                </div>
                <Separator />
                <Button className="w-full" onClick={handleStakeMore}>
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Stake More MDT
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Staking Rewards
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pending Rewards</span>
                    <span className="font-bold text-green-600">
                      {mockUserData.pendingRewards} MDT
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Next Epoch</span>
                    <span className="text-sm">{mockUserData.nextEpochIn}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Multiplier</span>
                    <Badge variant="secondary">1.5x</Badge>
                  </div>
                </div>
                <Separator />
                <Button 
                  className="w-full" 
                  onClick={handleClaimRewards}
                  disabled={parseFloat(mockUserData.pendingRewards) === 0}
                >
                  <Award className="h-4 w-4 mr-2" />
                  Claim Rewards
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Bonds Tab */}
        <TabsContent value="bonds" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Withdrawable Bonds</CardTitle>
              <CardDescription>
                Content bonds that have passed the 7-day challenge window
              </CardDescription>
            </CardHeader>
            <CardContent>
              {mockWithdrawableBonds.length > 0 ? (
                <div className="space-y-3">
                  {mockWithdrawableBonds.map((bond) => (
                    <div
                      key={bond.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "h-10 w-10 rounded-lg flex items-center justify-center",
                          bond.type === "post" ? "bg-blue-100" : "bg-green-100"
                        )}>
                          {bond.type === "post" ? (
                            <Shield className="h-5 w-5 text-blue-600" />
                          ) : (
                            <MessageSquare className="h-5 w-5 text-green-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{bond.title}</p>
                          <p className="text-xs text-muted-foreground">
                            Unlocked on {bond.unlockedAt}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary">{bond.amount} MDT</Badge>
                        <Button
                          size="sm"
                          onClick={() => handleWithdrawBond(bond.id)}
                        >
                          <Unlock className="h-4 w-4 mr-1" />
                          Withdraw
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Lock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No withdrawable bonds at the moment</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Disputes Tab */}
        <TabsContent value="disputes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Disputes</CardTitle>
              <CardDescription>
                Your ongoing challenges and defenses
              </CardDescription>
            </CardHeader>
            <CardContent>
              {mockActiveDisputes.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Role</TableHead>
                      <TableHead>Content</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Stake</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockActiveDisputes.map((dispute) => (
                      <TableRow key={dispute.id}>
                        <TableCell>
                          <Badge
                            variant={dispute.type === "challenger" ? "default" : "secondary"}
                          >
                            {dispute.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {dispute.content}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={dispute.status === "voting" ? "destructive" : "outline"}
                          >
                            {dispute.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{dispute.stake} MDT</TableCell>
                        <TableCell className="text-muted-foreground">
                          {dispute.createdAt}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No active disputes</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Transaction History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Action</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockHistory.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.action}</TableCell>
                      <TableCell>{item.description}</TableCell>
                      <TableCell>
                        <span className={cn(
                          "font-medium",
                          item.amount.startsWith("+") ? "text-green-600" : "text-red-600"
                        )}>
                          {item.amount}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.timestamp}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          {item.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}