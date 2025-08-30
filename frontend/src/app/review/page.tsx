'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Navbar } from '@/components/layout/Navbar';
import {
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Users,
  DollarSign,
  Calendar,
  MessageSquare,
} from 'lucide-react';
import {
  useMonaDAO,
  usePendingReviews,
  useAllTasks,
} from '@/hooks/useContracts';
import { ReviewCard } from '@/components/review/ReviewCard';

export default function ReviewPage() {
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const pendingTasks = usePendingReviews();
  const allTasks = useAllTasks();
  const { vote, isPending } = useMonaDAO();

  const handleVote = async (
    submissionId: number,
    voteChoice: 'approve' | 'reject'
  ) => {
    try {
      await vote(submissionId, voteChoice === 'approve');
    } catch (error) {
      console.error('Failed to vote:', error);
    }
  };

  const completedTasks = allTasks.filter(
    task => task && (task.status === 3 || task.status === 4) // Completed or Failed
  );

  return (
    <div className="bg-background min-h-screen">
      <Navbar />

      <main className="flex-1 p-6">
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="mb-8 text-center">
            <h1 className="text-foreground mb-4 text-4xl font-bold">
              Review & Vote
            </h1>
            <p className="text-muted-foreground text-lg">
              Review challenge submissions and vote on participant success
            </p>
          </div>

          {/* Pending Reviews */}
          <div className="space-y-4">
            <h2 className="text-foreground mb-4 text-center text-xl font-medium">
              PENDING REVIEWS
            </h2>

            {pendingTasks.map(
              task =>
                task && (
                  <ReviewCard
                    key={task.id}
                    task={task}
                    onVote={handleVote}
                    isPending={isPending}
                  />
                )
            )}
          </div>

          {/* Completed Reviews */}
          <div className="space-y-4">
            <h2 className="text-foreground mb-4 text-center text-xl font-medium">
              RECENT DECISIONS
            </h2>

            {completedTasks.map(
              task =>
                task && (
                  <Card
                    key={task.id}
                    className="border-border bg-card/80 opacity-75 backdrop-blur-sm"
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-foreground font-medium">
                            {task.title}
                          </p>
                          <p className="text-muted-foreground text-sm">
                            Creator: {task.creator}
                          </p>
                        </div>
                        <div className="space-y-1 text-right">
                          <Badge
                            className={
                              task.status === 3
                                ? 'bg-green-500/10 text-green-500'
                                : 'bg-red-500/10 text-red-500'
                            }
                          >
                            {task.status === 3 ? 'approved' : 'failed'}
                          </Badge>
                          <p className="text-muted-foreground text-xs">
                            ${task.participationFee} USDT
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
            )}
          </div>

          {/* Empty state */}
          {pendingTasks.length === 0 && (
            <div className="text-muted-foreground flex items-center justify-center gap-2 py-8">
              <div className="border-muted-foreground flex h-4 w-4 items-center justify-center rounded-full border">
                <div className="bg-muted-foreground h-1 w-1 rounded-full"></div>
              </div>
              <span>No submissions to review.</span>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
