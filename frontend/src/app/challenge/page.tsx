'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  Users,
  Target,
  Upload,
  CheckCircle,
  Clock,
  Flame,
  Camera,
} from 'lucide-react';
import Link from 'next/link';
import {
  useTask,
  useParticipant,
  useMonaDAO,
  useUSDTApproval,
} from '@/hooks/useContracts';
import { useAccount } from 'wagmi';

export default function ChallengeDetailPage() {
  const { address } = useAccount();
  const [taskId, setTaskId] = useState(1);
  
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    if (id) setTaskId(Number(id));
  }, []);

  const task = useTask(taskId);
  const participant = useParticipant(taskId);
  const { joinTask, submitTask, isPending } = useMonaDAO();
  const { approve, allowance, isPending: isApproving } = useUSDTApproval();

  const [isJoining, setIsJoining] = useState(false);
  const [showSubmissionForm, setShowSubmissionForm] = useState(false);
  const [submission, setSubmission] = useState({
    description: '',
    proofType: 'photo',
    file: null as File | null,
  });

  const handleJoinChallenge = async () => {
    if (!task) return;

    try {
      setIsJoining(true);

      const needsApproval =
        parseFloat(allowance) < parseFloat(task.participationFee);
      if (needsApproval) {
        await approve(task.participationFee);
      }

      await joinTask(taskId);
    } catch (error) {
      console.error('Failed to join challenge:', error);
    } finally {
      setIsJoining(false);
    }
  };

  const handleSubmitProof = async () => {
    try {
      await submitTask(taskId);
      setShowSubmissionForm(false);
    } catch (error) {
      console.error('Failed to submit proof:', error);
    }
  };

  if (!task) {
    return (
      <div className="bg-background min-h-screen">
        <Navbar />
        <main className="flex-1 p-6">
          <div className="mx-auto max-w-4xl">
            <div className="py-8 text-center">
              <p className="text-muted-foreground">Challenge not found</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const progressPercentage = Math.round(
    (task.currentParticipants / task.maxParticipants) * 100
  );
  const isParticipant = participant?.isActive || false;
  const hasSubmitted = participant?.hasSubmitted || false;

  return (
    <div className="bg-background min-h-screen">
      <Navbar />
      <main className="flex-1 p-6">
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="flex items-center gap-4">
            <Link href="/challenges">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Challenges
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <Card className="border-border bg-card/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-2xl">{task.title}</CardTitle>
                        <Badge className="bg-blue-500/10 text-blue-500">
                          <Clock className="mr-1 h-3 w-3" />
                          {task.status === 0
                            ? 'Open'
                            : task.status === 1
                              ? 'In Progress'
                              : 'Completed'}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground">
                        Created by {task.creator}
                      </p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  <p className="text-foreground">{task.description}</p>

                  <div className="space-y-3">
                    <h3 className="text-foreground font-medium">
                      Reward Structure
                    </h3>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="rounded-lg border border-green-500/20 bg-green-500/10 p-3">
                        <div className="mb-2 flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="font-medium text-green-500">
                            Success
                          </span>
                        </div>
                        <p className="text-sm">
                          Get your entry fee + 20% bonus
                        </p>
                      </div>
                      <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3">
                        <div className="mb-2 flex items-center gap-2">
                          <Flame className="h-4 w-4 text-red-500" />
                          <span className="font-medium text-red-500">
                            Failure
                          </span>
                        </div>
                        <p className="text-sm">Only get 80% back, 20% burned</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {showSubmissionForm && (
                <Card className="border-border bg-card/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Upload className="h-5 w-5" />
                      Submit Today&apos;s Progress
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="description">Workout Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Describe your workout today..."
                        value={submission.description}
                        onChange={e =>
                          setSubmission({
                            ...submission,
                            description: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="proof">Upload Proof</Label>
                      <div className="border-border rounded-lg border-2 border-dashed p-6 text-center">
                        <Camera className="text-muted-foreground mx-auto mb-2 h-8 w-8" />
                        <p className="text-muted-foreground mb-2 text-sm">
                          Upload photo or video proof
                        </p>
                        <Input
                          type="file"
                          accept="image/*,video/*"
                          onChange={e =>
                            setSubmission({
                              ...submission,
                              file: e.target.files?.[0] || null,
                            })
                          }
                          className="mx-auto max-w-xs"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={handleSubmitProof}
                        disabled={!submission.description || isPending}
                      >
                        {isPending ? 'Submitting...' : 'Submit Proof'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowSubmissionForm(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="space-y-6">
              <Card className="border-border bg-card/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Challenge Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-sm">
                        Entry Fee
                      </span>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        <span className="font-medium">
                          ${task.participationFee} USDT
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-sm">
                        Participants
                      </span>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span className="font-medium">
                          {task.currentParticipants}/{task.maxParticipants}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Filled</span>
                        <span className="font-medium">
                          {progressPercentage}%
                        </span>
                      </div>
                      <Progress value={progressPercentage} className="h-2" />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-sm">
                        Deadline
                      </span>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span className="font-medium">
                          {task.deadline.toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-sm">
                        Total Pool
                      </span>
                      <span className="font-medium">
                        ${task.totalReward} USDT
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border bg-card/80 backdrop-blur-sm">
                <CardContent className="pt-6">
                  {!isParticipant ? (
                    <div className="space-y-4">
                      <Button
                        className="w-full"
                        onClick={handleJoinChallenge}
                        disabled={
                          task.currentParticipants >= task.maxParticipants ||
                          isJoining ||
                          isPending
                        }
                      >
                        {isJoining
                          ? 'Joining...'
                          : `Join Challenge ($${task.participationFee} USDT)`}
                      </Button>
                      <p className="text-muted-foreground text-center text-xs">
                        {task.maxParticipants - task.currentParticipants} spots
                        remaining
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-2 text-center">
                        <CheckCircle className="mx-auto h-8 w-8 text-green-500" />
                        <p className="font-medium text-green-500">
                          Challenge Joined!
                        </p>
                        <p className="text-muted-foreground text-sm">
                          You&apos;ve successfully joined the challenge.
                        </p>
                      </div>
                      {!hasSubmitted && task.status === 1 && (
                        <Button
                          className="w-full"
                          onClick={() => setShowSubmissionForm(true)}
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          Submit Today&apos;s Progress
                        </Button>
                      )}
                      {hasSubmitted && (
                        <div className="text-center">
                          <Badge className="bg-green-500/10 text-green-500">
                            Submitted
                          </Badge>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
