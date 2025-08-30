"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAccount } from "wagmi";
import {
  ArrowBigUp,
  ArrowBigDown,
  MessageSquare,
  Share2,
  Shield,
  Award,
  AlertCircle,
  Coins,
  Clock,
  ChevronUp,
  Flag,
  MoreVertical,
  Send,
  User,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Mock data - replace with actual blockchain data
const mockPost = {
  id: 1,
  author: "0x742d...8963",
  authorKarma: 1250,
  title: "Monad 테스트넷에서 첫 DApp 배포 성공!",
  content: `드디어 Monad 테스트넷에 첫 DApp을 배포했습니다. 가스비가 정말 저렴하고 속도도 빠르네요.

몇 가지 공유하고 싶은 팁들:
1. RPC 엔드포인트 설정할 때 주의사항
2. 컨트랙트 배포 시 가스 예측이 정확하지 않을 수 있음
3. 테스트넷 토큰은 디스코드에서 받을 수 있습니다

더 자세한 내용이 궁금하신 분들은 댓글로 질문해주세요!`,
  community: "dev",
  timestamp: "2시간 전",
  upvotes: 42,
  downvotes: 3,
  bond: "0.1",
  status: "published",
  hasVoted: null,
  bondWithdrawable: false,
  bondWithdrawableAt: "5일 후",
};

const mockComments = [
  {
    id: 1,
    author: "0x5c9e...7fa1",
    authorKarma: 890,
    content: "축하합니다! RPC 설정 부분 좀 더 자세히 알려주실 수 있나요?",
    timestamp: "1시간 전",
    upvotes: 5,
    downvotes: 0,
    hasVoted: "up",
    bond: "0.1",
  },
  {
    id: 2,
    author: "0x8f3a...2b4c",
    authorKarma: 520,
    content: "저도 배포해봤는데 정말 빠르더라구요. 이더리움 대비 10배는 빠른 것 같아요.",
    timestamp: "30분 전",
    upvotes: 3,
    downvotes: 1,
    hasVoted: null,
    bond: "0.1",
  },
];

export default function PostDetailPage() {
  const params = useParams();
  const { isConnected } = useAccount();
  const [comment, setComment] = useState("");
  const [showChallengeDialog, setShowChallengeDialog] = useState(false);
  const [challengeReason, setChallengeReason] = useState("");
  const [challengeEvidence, setChallengeEvidence] = useState("");

  const handleVote = (type: "up" | "down", isComment = false, id?: number) => {
    console.log(`Voting ${type} on ${isComment ? "comment" : "post"} ${id || params.id}`);
    toast.success(`Vote recorded!`);
  };

  const handleSubmitComment = () => {
    if (!comment.trim()) return;
    console.log("Submitting comment:", comment);
    toast.success("Comment posted! (0.1 MDT bond locked)");
    setComment("");
  };

  const handleChallenge = () => {
    console.log("Challenging with:", { challengeReason, challengeEvidence });
    toast.warning("Challenge submitted! (0.2 MDT bond locked)");
    setShowChallengeDialog(false);
  };

  const handleWithdrawBond = () => {
    console.log("Withdrawing bond");
    toast.success("Bond withdrawn successfully!");
  };

  const CommentCard = ({ comment }: { comment: typeof mockComments[0] }) => (
    <div className="flex gap-3 py-4">
      <Avatar className="h-8 w-8">
        <AvatarImage src={`https://avatar.vercel.sh/${comment.author}`} />
        <AvatarFallback>U</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium">{comment.author}</span>
          <Badge variant="secondary" className="text-xs">
            <Award className="h-3 w-3 mr-1" />
            {comment.authorKarma}
          </Badge>
          <span className="text-xs text-muted-foreground">• {comment.timestamp}</span>
        </div>
        <p className="text-sm">{comment.content}</p>
        <div className="flex items-center gap-3 mt-2">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-6 w-6", comment.hasVoted === "up" && "text-orange-500")}
              onClick={() => handleVote("up", true, comment.id)}
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
            <span className="text-xs font-medium">{comment.upvotes - comment.downvotes}</span>
          </div>
          <Button variant="ghost" size="sm" className="h-6 text-xs">
            Reply
          </Button>
          <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
            <Coins className="h-3 w-3" />
            <span>{comment.bond} MDT</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Post Content */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 mb-4">
              <Avatar className="h-10 w-10">
                <AvatarImage src={`https://avatar.vercel.sh/${mockPost.author}`} />
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{mockPost.author}</span>
                  <Badge variant="secondary">
                    <Award className="h-3 w-3 mr-1" />
                    {mockPost.authorKarma}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline" className="text-xs">
                    r/{mockPost.community}
                  </Badge>
                  <span>• {mockPost.timestamp}</span>
                </div>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Flag className="mr-2 h-4 w-4" />
                  Report
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <h1 className="text-2xl font-bold mb-4">{mockPost.title}</h1>
        </CardHeader>

        <CardContent>
          <div className="prose prose-sm max-w-none mb-6 whitespace-pre-wrap">
            {mockPost.content}
          </div>

          {/* Post Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "gap-1",
                    mockPost.hasVoted === "up" && "text-orange-500"
                  )}
                  onClick={() => handleVote("up")}
                >
                  <ArrowBigUp className="h-5 w-5" />
                  {mockPost.upvotes}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "gap-1",
                    mockPost.hasVoted === "down" && "text-blue-500"
                  )}
                  onClick={() => handleVote("down")}
                >
                  <ArrowBigDown className="h-5 w-5" />
                  {mockPost.downvotes}
                </Button>
              </div>
              <Button variant="ghost" size="sm">
                <MessageSquare className="h-4 w-4 mr-2" />
                {mockComments.length} Comments
              </Button>
              <Button variant="ghost" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Coins className="h-4 w-4" />
                <span>{mockPost.bond} MDT</span>
              </div>
              {isConnected && mockPost.status === "published" && (
                <Dialog open={showChallengeDialog} onOpenChange={setShowChallengeDialog}>
                  <DialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Shield className="h-4 w-4 mr-2" />
                      Challenge
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Challenge This Content</DialogTitle>
                      <DialogDescription>
                        Submit a challenge if this content violates community guidelines.
                        This will lock 0.2 MDT as a challenge bond.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Reason for Challenge</Label>
                        <RadioGroup value={challengeReason} onValueChange={setChallengeReason}>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="spam" id="spam" />
                            <Label htmlFor="spam">Spam or Scam</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="harassment" id="harassment" />
                            <Label htmlFor="harassment">Harassment or Hate Speech</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="misinformation" id="misinformation" />
                            <Label htmlFor="misinformation">Misinformation</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="illegal" id="illegal" />
                            <Label htmlFor="illegal">Illegal Content</Label>
                          </div>
                        </RadioGroup>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="evidence">Evidence (Optional)</Label>
                        <Textarea
                          id="evidence"
                          placeholder="Provide additional context or evidence..."
                          value={challengeEvidence}
                          onChange={(e) => setChallengeEvidence(e.target.value)}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowChallengeDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleChallenge} disabled={!challengeReason}>
                        Submit Challenge (0.2 MDT)
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>

          {/* Bond Status Alert */}
          {mockPost.bondWithdrawable && (
            <Alert className="mt-4">
              <Coins className="h-4 w-4" />
              <AlertTitle>Bond Available for Withdrawal</AlertTitle>
              <AlertDescription className="flex items-center justify-between">
                <span>Your content bond of {mockPost.bond} MDT can now be withdrawn.</span>
                <Button size="sm" onClick={handleWithdrawBond}>
                  Withdraw Bond
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {!mockPost.bondWithdrawable && (
            <Alert className="mt-4">
              <Clock className="h-4 w-4" />
              <AlertDescription>
                Bond will be withdrawable in {mockPost.bondWithdrawableAt} if no challenges are received.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Comment Section */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Comments</h2>
        </CardHeader>
        <CardContent>
          {/* Comment Form */}
          {isConnected && (
            <div className="mb-6 pb-6 border-b">
              <div className="flex gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={`https://avatar.vercel.sh/you`} />
                  <AvatarFallback>Y</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Textarea
                    placeholder="What are your thoughts?"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="min-h-[80px]"
                  />
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <AlertCircle className="h-4 w-4" />
                      <span>Posting will lock 0.1 MDT as bond</span>
                    </div>
                    <Button 
                      onClick={handleSubmitComment}
                      disabled={!comment.trim()}
                      size="sm"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Comment
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Comments List */}
          <div className="space-y-1">
            {mockComments.map((comment, index) => (
              <React.Fragment key={comment.id}>
                <CommentCard comment={comment} />
                {index < mockComments.length - 1 && <Separator />}
              </React.Fragment>
            ))}
          </div>

          {mockComments.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No comments yet. Be the first to share your thoughts!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}