'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Calendar,
  Clock,
  MessageSquare,
  Download,
  Image as ImageIcon,
  Video,
} from 'lucide-react';
import Link from 'next/link';
import { useMonaDAO, useVote } from '@/hooks/useContracts';

const submissionData = {
  id: 1,
  challengeTitle: '30-Day Fitness Challenge',
  daoName: 'FitDAO',
  participant: {
    address: '0x1234...5678',
    avatar: 'AB',
    submissions: 18,
    totalRequired: 30,
  },
  submissionDate: '2024-02-14',
  submissionType: 'Daily Progress',
  day: 18,
  description:
    'Completed 45-minute strength training session at the gym. Focused on upper body exercises including bench press, pull-ups, and shoulder press. Feeling strong and motivated to continue!',
  evidence: [
    {
      type: 'image',
      url: '/placeholder.jpg',
      caption: 'Post-workout selfie at gym',
    },
    {
      type: 'image',
      url: '/placeholder.jpg',
      caption: 'Workout equipment setup',
    },
    {
      type: 'text',
      content:
        'Workout Log:\\n- Bench Press: 3x10 @ 185lbs\\n- Pull-ups: 3x8\\n- Shoulder Press: 3x12 @ 45lbs\\n- Duration: 45 minutes',
    },
  ],
  currentVotes: {
    approve: 12,
    reject: 3,
    total: 15,
  },
  minVotes: 20,
  deadline: '2024-02-16',
  myVote: null,
};

export default function EvidencePage() {
  const params = useParams();
  const taskId = Number(params?.submissionId || 0);
  const [voteReason, setVoteReason] = useState('');

  const { vote, isPending } = useMonaDAO();
  const voteData = useVote(taskId);

  const handleVote = async (voteChoice: 'approve' | 'reject') => {
    try {
      await vote(taskId, voteChoice === 'approve');
    } catch (error) {
      console.error('Failed to vote:', error);
    }
  };

  const approvalRate =
    voteData.totalVotes > 0
      ? Math.round((voteData.approvedVotes / voteData.totalVotes) * 100)
      : 0;

  return (
    <div className="bg-background min-h-screen">
      <Navbar />
      <main className="flex-1 p-6">
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="flex items-center gap-4">
            <Link href="/review">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Reviews
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <Card className="border-border bg-card/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-xl">
                        {submissionData.challengeTitle}
                      </CardTitle>
                      <Badge variant="secondary">
                        Day {submissionData.day}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {submissionData.participant.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {submissionData.participant.address}
                        </p>
                        <p className="text-muted-foreground text-sm">
                          {submissionData.participant.submissions}/
                          {submissionData.participant.totalRequired} submissions
                        </p>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <h3 className="font-medium">Submission Description</h3>
                    <p className="bg-muted rounded-lg p-4 text-sm">
                      {submissionData.description}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-medium">Evidence</h3>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {submissionData.evidence.map((item, index) => (
                        <div key={index} className="space-y-2">
                          {item.type === 'image' && (
                            <div className="bg-muted rounded-lg p-4 text-center">
                              <ImageIcon className="text-muted-foreground mx-auto mb-2 h-8 w-8" />
                              <p className="text-sm font-medium">
                                Photo Evidence
                              </p>
                              <p className="text-muted-foreground text-xs">
                                {item.caption}
                              </p>
                              <Button
                                variant="outline"
                                size="sm"
                                className="mt-2"
                              >
                                <Download className="mr-1 h-3 w-3" />
                                View Full Size
                              </Button>
                            </div>
                          )}
                          {item.type === 'text' && (
                            <div className="bg-muted rounded-lg p-4">
                              <div className="mb-2 flex items-center gap-2">
                                <MessageSquare className="h-4 w-4" />
                                <span className="text-sm font-medium">
                                  Workout Log
                                </span>
                              </div>
                              <pre className="whitespace-pre-wrap text-xs">
                                {item.content}
                              </pre>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {!voteData.myVote && (
                <Card className="border-border bg-card/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle>Cast Your Vote</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="reason">Voting Reason (Optional)</Label>
                      <Textarea
                        id="reason"
                        placeholder="Explain your vote..."
                        value={voteReason}
                        onChange={e => setVoteReason(e.target.value)}
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        onClick={() => handleVote('approve')}
                        disabled={isPending}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        {isPending ? 'Voting...' : 'Approve Submission'}
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                        onClick={() => handleVote('reject')}
                        disabled={isPending}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        {isPending ? 'Voting...' : 'Reject Submission'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="space-y-6">
              <Card className="border-border bg-card/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Voting Progress</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-sm">
                        Current Votes
                      </span>
                      <span className="font-medium">
                        {voteData.totalVotes}/{submissionData.minVotes}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm">Approve</span>
                        </div>
                        <span className="font-medium">
                          {voteData.approvedVotes}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <XCircle className="h-4 w-4 text-red-500" />
                          <span className="text-sm">Reject</span>
                        </div>
                        <span className="font-medium">
                          {voteData.rejectedVotes}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Approval Rate
                        </span>
                        <span className="font-medium text-green-500">
                          {approvalRate}%
                        </span>
                      </div>
                      <div className="bg-secondary h-2 w-full rounded-full">
                        <div
                          className="h-2 rounded-full bg-green-500 transition-all"
                          style={{ width: `${approvalRate}%` }}
                        />
                      </div>
                    </div>

                    <div className="text-muted-foreground flex items-center gap-2 text-xs">
                      <Clock className="h-3 w-3" />
                      <span>Deadline: {submissionData.deadline}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border bg-card/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Submission Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">
                      Challenge
                    </span>
                    <span className="text-sm font-medium">
                      {submissionData.challengeTitle}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">DAO</span>
                    <span className="text-sm font-medium">
                      {submissionData.daoName}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">
                      Submitted
                    </span>
                    <span className="text-sm font-medium">
                      {submissionData.submissionDate}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">Type</span>
                    <Badge variant="secondary">
                      {submissionData.submissionType}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
