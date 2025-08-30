'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Navbar } from '@/components/layout/Navbar';
import {
  Users,
  Trophy,
  Target,
  Calendar,
  Clock,
  DollarSign,
  ArrowRight,
  Plus,
} from 'lucide-react';

export default function DAODetailPage({ params }: { params: { id: string } }) {
  const daoId = parseInt(params.id);
  const [activeTab, setActiveTab] = useState('overview');

  // Sample DAO data
  const dao = {
    id: daoId,
    name:
      daoId === 1
        ? 'FitDAO'
        : daoId === 2
          ? 'BookLoversDAO'
          : daoId === 3
            ? 'DevDAO'
            : daoId === 4
              ? 'MindfulDAO'
              : 'BuilderDAO',
    description:
      'A community-driven organization focused on helping members achieve their fitness goals through challenges, accountability, and rewards.',
    category: 'Health & Fitness',
    members: 1245,
    activeChallenges: 3,
    completedChallenges: 12,
    successRate: 78,
    createdAt: '2023-10-15',
    founder: '0x1234...5678',
  };

  // Sample challenges data
  const challenges = [
    {
      id: 1,
      title: '30-Day Fitness Challenge',
      status: 'active',
      entryFee: 100,
      startDate: '2024-01-15',
      endDate: '2024-02-15',
      daysLeft: 12,
      participants: 124,
      maxParticipants: 150,
      successRate: 68,
    },
    {
      id: 2,
      title: 'Weekly Workout Streak',
      status: 'active',
      entryFee: 50,
      startDate: '2024-02-01',
      endDate: '2024-02-28',
      daysLeft: 18,
      participants: 87,
      maxParticipants: 100,
      successRate: 75,
    },
    {
      id: 3,
      title: 'Nutrition Tracking Challenge',
      status: 'active',
      entryFee: 75,
      startDate: '2024-02-10',
      endDate: '2024-03-10',
      daysLeft: 28,
      participants: 56,
      maxParticipants: 100,
      successRate: 82,
    },
    {
      id: 4,
      title: 'Morning Yoga for 21 Days',
      status: 'completed',
      entryFee: 60,
      startDate: '2024-01-01',
      endDate: '2024-01-21',
      participants: 112,
      maxParticipants: 120,
      successRate: 79,
    },
    {
      id: 5,
      title: 'Run 100km in a Month',
      status: 'completed',
      entryFee: 120,
      startDate: '2023-12-01',
      endDate: '2023-12-31',
      participants: 95,
      maxParticipants: 100,
      successRate: 62,
    },
  ];

  const activeChallenges = challenges.filter(
    challenge => challenge.status === 'active'
  );
  const completedChallenges = challenges.filter(
    challenge => challenge.status === 'completed'
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-blue-500/10 text-blue-500';
      case 'completed':
        return 'bg-green-500/10 text-green-500';
      default:
        return 'bg-gray-500/10 text-gray-500';
    }
  };

  const backgroundStyle = {};

  return (
    <div className="bg-background min-h-screen">
      <Navbar />

      <main className="flex-1 p-6">
        <div className="mx-auto max-w-6xl space-y-6">
          {/* DAO Header */}
          <div className="mb-6 flex items-start justify-between">
            <div>
              <div className="mb-2 flex items-center gap-3">
                <h1 className="text-foreground text-4xl font-bold">
                  {dao.name}
                </h1>
                <Badge className="bg-primary/20 text-primary border-primary/50 border">
                  {dao.category}
                </Badge>
              </div>
              <p className="text-muted-foreground max-w-2xl">
                {dao.description}
              </p>
            </div>
            <Link href={`/daos/${daoId}/challenges/create`}>
              <Button className="bg-green-500 text-white hover:bg-green-600">
                <Plus className="mr-1 h-4 w-4" /> Create Challenge
              </Button>
            </Link>
          </div>

          {/* DAO Stats */}
          <div className="mb-8 grid grid-cols-4 gap-4">
            <Card className="bg-card/80 border-border backdrop-blur-sm">
              <CardContent className="flex flex-col items-center p-4">
                <Users className="text-primary mb-2 h-6 w-6" />
                <span className="text-2xl font-bold">{dao.members}</span>
                <span className="text-muted-foreground text-sm">Members</span>
              </CardContent>
            </Card>
            <Card className="bg-card/80 border-border backdrop-blur-sm">
              <CardContent className="flex flex-col items-center p-4">
                <Target className="text-primary mb-2 h-6 w-6" />
                <span className="text-2xl font-bold">
                  {dao.activeChallenges}
                </span>
                <span className="text-muted-foreground text-sm">
                  Active Challenges
                </span>
              </CardContent>
            </Card>
            <Card className="bg-card/80 border-border backdrop-blur-sm">
              <CardContent className="flex flex-col items-center p-4">
                <Trophy className="text-primary mb-2 h-6 w-6" />
                <span className="text-2xl font-bold">
                  {dao.completedChallenges}
                </span>
                <span className="text-muted-foreground text-sm">
                  Completed Challenges
                </span>
              </CardContent>
            </Card>
            <Card className="bg-card/80 border-border backdrop-blur-sm">
              <CardContent className="flex flex-col items-center p-4">
                <Trophy className="text-primary mb-2 h-6 w-6" />
                <span className="text-2xl font-bold">{dao.successRate}%</span>
                <span className="text-muted-foreground text-sm">
                  Success Rate
                </span>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs
            defaultValue="overview"
            className="w-full"
            onValueChange={setActiveTab}
          >
            <TabsList className="mb-6 grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="active">
                Active Challenges ({activeChallenges.length})
              </TabsTrigger>
              <TabsTrigger value="completed">
                Completed Challenges ({completedChallenges.length})
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <Card className="bg-card/80 border-border backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>DAO Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-muted-foreground mb-1 text-sm font-medium">
                        Created At
                      </h3>
                      <p className="font-medium">{dao.createdAt}</p>
                    </div>
                    <div>
                      <h3 className="text-muted-foreground mb-1 text-sm font-medium">
                        Category
                      </h3>
                      <p className="font-medium">{dao.category}</p>
                    </div>
                    <div>
                      <h3 className="text-muted-foreground mb-1 text-sm font-medium">
                        Success Rate
                      </h3>
                      <p className="font-medium">{dao.successRate}%</p>
                    </div>
                    <div>
                      <h3 className="text-muted-foreground mb-1 text-sm font-medium">
                        Founder
                      </h3>
                      <p className="font-medium">{dao.founder}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Recent Challenges</h2>
                <Link href={`/daos/${daoId}/challenges`}>
                  <Button
                    variant="outline"
                    className="text-primary border-primary hover:bg-primary/10"
                  >
                    View All Challenges <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {challenges.slice(0, 4).map(challenge => (
                  <Card
                    key={challenge.id}
                    className="bg-card/80 border-border hover:border-primary backdrop-blur-sm transition-colors"
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg font-bold">
                          {challenge.title}
                        </CardTitle>
                        <Badge className={getStatusColor(challenge.status)}>
                          {challenge.status === 'active'
                            ? 'Active'
                            : 'Completed'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-4 grid grid-cols-2 gap-2">
                        <div className="flex items-center">
                          <DollarSign className="text-muted-foreground mr-1 h-4 w-4" />
                          <span className="text-sm">
                            {challenge.entryFee} USDT Entry
                          </span>
                        </div>
                        <div className="flex items-center">
                          <Users className="text-muted-foreground mr-1 h-4 w-4" />
                          <span className="text-sm">
                            {challenge.participants}/{challenge.maxParticipants}{' '}
                            Participants
                          </span>
                        </div>
                        <div className="flex items-center">
                          <Calendar className="text-muted-foreground mr-1 h-4 w-4" />
                          <span className="text-sm">
                            Ends: {challenge.endDate}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <Trophy className="text-muted-foreground mr-1 h-4 w-4" />
                          <span className="text-sm">
                            {challenge.successRate}% Success Rate
                          </span>
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <Link
                          href={`/daos/${daoId}/challenges/${challenge.id}`}
                        >
                          <Button
                            variant="ghost"
                            className="text-primary hover:text-primary hover:bg-primary/10 h-auto p-2"
                          >
                            View Details <ArrowRight className="ml-1 h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Active Challenges Tab */}
            <TabsContent value="active" className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                {activeChallenges.map(challenge => (
                  <Card
                    key={challenge.id}
                    className="bg-card/80 border-border hover:border-primary backdrop-blur-sm transition-colors"
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-xl font-bold">
                          {challenge.title}
                        </CardTitle>
                        <Badge className={getStatusColor(challenge.status)}>
                          Active
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-4">
                        <div className="flex flex-col">
                          <span className="text-muted-foreground mb-1 flex items-center text-sm">
                            <DollarSign className="mr-1 h-4 w-4" /> Entry Fee
                          </span>
                          <span className="font-medium">
                            {challenge.entryFee} USDT
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-muted-foreground mb-1 flex items-center text-sm">
                            <Users className="mr-1 h-4 w-4" /> Participants
                          </span>
                          <span className="font-medium">
                            {challenge.participants}/{challenge.maxParticipants}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-muted-foreground mb-1 flex items-center text-sm">
                            <Clock className="mr-1 h-4 w-4" /> Time Left
                          </span>
                          <span className="font-medium">
                            {challenge.daysLeft} days
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-muted-foreground mb-1 flex items-center text-sm">
                            <Calendar className="mr-1 h-4 w-4" /> End Date
                          </span>
                          <span className="font-medium">
                            {challenge.endDate}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center">
                          <Trophy className="text-muted-foreground mr-1 h-4 w-4" />
                          <span className="text-muted-foreground text-sm">
                            {challenge.successRate}% Success Rate
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Link
                            href={`/daos/${daoId}/challenges/${challenge.id}`}
                          >
                            <Button
                              variant="outline"
                              className="border-primary text-primary hover:bg-primary/10"
                            >
                              View Details
                            </Button>
                          </Link>
                          <Link
                            href={`/daos/${daoId}/challenges/${challenge.id}/join`}
                          >
                            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                              Join Challenge
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Completed Challenges Tab */}
            <TabsContent value="completed" className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                {completedChallenges.map(challenge => (
                  <Card
                    key={challenge.id}
                    className="bg-card/80 border-border hover:border-primary backdrop-blur-sm transition-colors"
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-xl font-bold">
                          {challenge.title}
                        </CardTitle>
                        <Badge className={getStatusColor(challenge.status)}>
                          Completed
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-4">
                        <div className="flex flex-col">
                          <span className="text-muted-foreground mb-1 flex items-center text-sm">
                            <DollarSign className="mr-1 h-4 w-4" /> Entry Fee
                          </span>
                          <span className="font-medium">
                            {challenge.entryFee} USDT
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-muted-foreground mb-1 flex items-center text-sm">
                            <Users className="mr-1 h-4 w-4" /> Participants
                          </span>
                          <span className="font-medium">
                            {challenge.participants}/{challenge.maxParticipants}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-muted-foreground mb-1 flex items-center text-sm">
                            <Calendar className="mr-1 h-4 w-4" /> Start Date
                          </span>
                          <span className="font-medium">
                            {challenge.startDate}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-muted-foreground mb-1 flex items-center text-sm">
                            <Calendar className="mr-1 h-4 w-4" /> End Date
                          </span>
                          <span className="font-medium">
                            {challenge.endDate}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center">
                          <Trophy className="text-muted-foreground mr-1 h-4 w-4" />
                          <span className="text-muted-foreground text-sm">
                            {challenge.successRate}% Success Rate
                          </span>
                        </div>
                        <Link
                          href={`/daos/${daoId}/challenges/${challenge.id}`}
                        >
                          <Button
                            variant="outline"
                            className="border-primary text-primary hover:bg-primary/10"
                          >
                            View Results
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
