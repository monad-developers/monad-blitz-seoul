import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Clock, Eye } from 'lucide-react';
import Link from 'next/link';
import { useVote } from '@/hooks/useContracts';

interface ReviewCardProps {
  task: {
    id: number;
    title: string;
    description: string;
    participationFee: string;
    creator: string;
    deadline: Date;
  };
  onVote: (taskId: number, vote: 'approve' | 'reject') => void;
  isPending: boolean;
}

export function ReviewCard({ task, onVote, isPending }: ReviewCardProps) {
  const voteData = useVote(task.id);
  const minVotes = 20;

  return (
    <Card className="border-border bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">{task.title}</CardTitle>
              <Badge variant="secondary">Under Review</Badge>
            </div>
            <div className="text-muted-foreground flex items-center gap-4 text-sm">
              <span>by {task.creator}</span>
              <span>•</span>
              <span>Deadline: {task.deadline.toLocaleDateString()}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">${task.participationFee} USDT</p>
            <p className="text-muted-foreground text-xs">at stake</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-foreground text-sm">{task.description}</p>

        <div className="bg-muted space-y-3 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Voting Progress</span>
            <span className="text-muted-foreground text-sm">
              {voteData.totalVotes}/{minVotes} votes
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Approve</span>
              </div>
              <span className="font-medium">{voteData.approvedVotes}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-500" />
                <span>Reject</span>
              </div>
              <span className="font-medium">{voteData.rejectedVotes}</span>
            </div>
          </div>

          <div className="text-muted-foreground flex items-center gap-2 text-xs">
            <Clock className="h-3 w-3" />
            <span>Deadline: {task.deadline.toLocaleDateString()}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Link href={`/evidence/${task.id}`}>
            <Button variant="outline" size="sm">
              <Eye className="mr-2 h-4 w-4" />
              View Evidence
            </Button>
          </Link>

          {!voteData.myVote ? (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                onClick={() => onVote(task.id, 'reject')}
                disabled={isPending}
              >
                <XCircle className="mr-2 h-4 w-4" />
                {isPending ? 'Voting...' : 'Reject'}
              </Button>
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700"
                onClick={() => onVote(task.id, 'approve')}
                disabled={isPending}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                {isPending ? 'Voting...' : 'Approve'}
              </Button>
            </div>
          ) : (
            <Badge
              className={
                voteData.myVote.approved
                  ? 'bg-green-500/10 text-green-500'
                  : 'bg-red-500/10 text-red-500'
              }
            >
              You voted: {voteData.myVote.approved ? 'approve' : 'reject'}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
