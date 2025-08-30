'use client';

import {
  Calendar,
  Users,
  DollarSign,
  Flame,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

const challenges = [
  {
    id: 1,
    title: '30-Day Fitness Challenge',
    description:
      'Complete 30 minutes of exercise daily for 30 days. Submit daily workout proof.',
    daoName: 'FitDAO',
    category: 'Health & Fitness',
    status: 'active',
    entryFee: 100,
    participants: 124,
    successRate: 68,
    endDate: 'Feb 15, 2024',
    daysLeft: 12,
    author: '0x1234...5678',
    totalPool: 12400,
  },
  {
    id: 2,
    title: 'Read 5 Books This Month',
    description:
      'Read and provide detailed summaries of 5 books. Minimum 200 pages each.',
    daoName: 'BookLoversDAO',
    category: 'Education',
    status: 'completed',
    entryFee: 50,
    participants: 89,
    successRate: 79,
    endDate: 'Jan 31, 2024',
    author: '0xabcd...efgh',
    totalPool: 4450,
    winners: 70,
    failures: 19,
    burned: 5225,
  },
  {
    id: 3,
    title: 'Build DeFi Protocol in 2 Weeks',
    description:
      'Design and deploy a complete DeFi protocol with smart contracts and frontend.',
    daoName: 'DevDAO',
    category: 'Technology',
    status: 'pending',
    entryFee: 500,
    participants: 0,
    successRate: 0,
    endDate: 'Feb 20, 2024',
    author: '0x9876...5432',
    totalPool: 0,
  },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
      return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    case 'completed':
      return 'bg-green-500/10 text-green-500 border-green-500/20';
    case 'pending':
      return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
    default:
      return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
  }
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'Health & Fitness':
      return 'bg-green-500/10 text-green-500';
    case 'Education':
      return 'bg-blue-500/10 text-blue-500';
    case 'Technology':
      return 'bg-purple-500/10 text-purple-500';
    default:
      return 'bg-gray-500/10 text-gray-500';
  }
};

export function ChallengesList() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-foreground text-lg font-medium">
          ACTIVE CHALLENGES
        </h2>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Create Challenge
        </Button>
      </div>

      <div className="space-y-4">
        {challenges.map(challenge => (
          <Card key={challenge.id} className="bg-card border-border">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-foreground">
                      {challenge.title}
                    </CardTitle>
                    <Badge
                      className={getStatusColor(challenge.status)}
                      variant="outline"
                    >
                      {challenge.status === 'active' && (
                        <Clock className="mr-1 h-3 w-3" />
                      )}
                      {challenge.status === 'completed' && (
                        <CheckCircle className="mr-1 h-3 w-3" />
                      )}
                      {challenge.status === 'pending' && (
                        <Clock className="mr-1 h-3 w-3" />
                      )}
                      {challenge.status}
                    </Badge>
                    <Badge
                      className={getCategoryColor(challenge.category)}
                      variant="secondary"
                    >
                      {challenge.category}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    {challenge.description}
                  </p>
                  <div className="text-muted-foreground flex items-center gap-4 text-xs">
                    <span>by {challenge.daoName}</span>
                    <span>•</span>
                    <span>{challenge.author}</span>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div className="space-y-1">
                  <p className="text-muted-foreground text-xs">Entry Fee</p>
                  <div className="flex items-center gap-1">
                    <DollarSign className="text-muted-foreground h-3 w-3" />
                    <span className="text-sm font-medium">
                      ${challenge.entryFee}
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground text-xs">Participants</p>
                  <div className="flex items-center gap-1">
                    <Users className="text-muted-foreground h-3 w-3" />
                    <span className="text-sm font-medium">
                      {challenge.participants}
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground text-xs">Success Rate</p>
                  <span className="text-sm font-medium text-green-500">
                    {challenge.successRate}%
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground text-xs">Total Pool</p>
                  <span className="text-sm font-medium">
                    ${challenge.totalPool.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Progress for completed challenges */}
              {challenge.status === 'completed' &&
                challenge.winners &&
                challenge.failures && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4">
                        <span className="text-green-500">
                          {challenge.winners} succeeded
                        </span>
                        <span className="text-red-500">
                          {challenge.failures} failed
                        </span>
                      </div>
                      <div className="text-muted-foreground flex items-center gap-1">
                        <Flame className="h-3 w-3" />
                        <span>
                          {challenge.burned?.toLocaleString()} MDAO burned
                        </span>
                      </div>
                    </div>
                    <Progress
                      value={(challenge.winners / challenge.participants) * 100}
                      className="h-2"
                    />
                  </div>
                )}

              {/* End date for active challenges */}
              {challenge.status === 'active' && challenge.daysLeft && (
                <div className="text-muted-foreground flex items-center gap-1 text-sm">
                  <Calendar className="h-3 w-3" />
                  <span>{challenge.daysLeft} days left</span>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                >
                  View Details
                </Button>
                {challenge.status === 'active' && (
                  <Button size="sm">
                    Join Challenge (${challenge.entryFee} USDT)
                  </Button>
                )}
                {challenge.status === 'pending' && (
                  <Button variant="secondary" size="sm" disabled>
                    Starting Soon
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty state when no challenges */}
      <div className="text-muted-foreground flex items-center justify-center gap-2 py-8">
        <div className="border-muted-foreground flex h-4 w-4 items-center justify-center rounded-full border">
          <div className="bg-muted-foreground h-1 w-1 rounded-full"></div>
        </div>
        <span>No more challenges available.</span>
      </div>
    </div>
  );
}
