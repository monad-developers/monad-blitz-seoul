'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Navbar } from '@/components/layout/Navbar';
import { useAllTasks, useDAOStats } from '@/hooks/useContracts';

export default function HomePage() {
  const allTasks = useAllTasks();
  const daos = useDAOStats();

  const stats = {
    totalChallenges: allTasks.length,
    activeChallenges: allTasks.filter(task => task && task.status === 1).length,
    totalParticipants: allTasks.reduce(
      (sum, task) => sum + (task?.currentParticipants || 0),
      0
    ),
    totalRewards: allTasks.reduce(
      (sum, task) => sum + parseFloat(task?.totalReward || '0'),
      0
    ),
  };

  const topDAOs = daos
    .sort((a, b) => b.totalRewards - a.totalRewards)
    .slice(0, 4);

  // Background style
  const backgroundStyle = {};

  return (
    <div className="bg-background flex min-h-screen flex-col">
      <Navbar />

      {/* Main Content */}
      <main className="flex flex-1 flex-col items-center justify-center space-y-16 p-6">
        {/* Hero Section */}
        <div className="mx-auto max-w-4xl space-y-12 text-center">
          <h1
            className="text-foreground text-6xl font-bold tracking-wider"
            style={{ fontFamily: 'monospace' }}
          >
            MonaDAO
          </h1>

          <div className="flex justify-center space-x-6">
            <Link href="/create">
              <Button
                className="border border-green-400 bg-green-500 px-8 py-6 text-lg text-white shadow-lg shadow-green-500/20 hover:bg-green-600"
                style={{ boxShadow: '0 0 15px rgba(34, 197, 94, 0.5)' }}
              >
                Create DAO
              </Button>
            </Link>
            <Link href="/daos">
              <Button
                className="border border-purple-400 bg-purple-500 px-8 py-6 text-lg text-white shadow-lg shadow-purple-500/20 hover:bg-purple-600"
                style={{ boxShadow: '0 0 15px rgba(168, 85, 247, 0.5)' }}
              >
                Explore DAOs
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-8 md:grid-cols-2">
          {/* DAO Ranking */}
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <h2 className="text-foreground mb-6 text-2xl font-bold">
                Top DAOs by TVL
              </h2>
              <div className="space-y-4">
                <div className="text-muted-foreground mb-2 grid grid-cols-4 text-sm">
                  <div>Rank</div>
                  <div>DAO Creator</div>
                  <div className="text-right">Challenges</div>
                  <div className="text-right">TVL (USDT)</div>
                </div>

                {topDAOs.map((dao, index) => (
                  <div
                    key={dao.id}
                    className="grid grid-cols-4 items-center border-b border-gray-800 py-2 last:border-0"
                  >
                    <div className="flex items-center">
                      <div className="mr-2 flex h-6 w-6 items-center justify-center rounded-full bg-gray-800 text-xs">
                        {index === 0
                          ? '🥇'
                          : index === 1
                            ? '🥈'
                            : index === 2
                              ? '🥉'
                              : '🏆'}
                      </div>
                      <span>{index + 1}</span>
                    </div>
                    <div className="text-sm">{dao.name}</div>
                    <div className="text-right">{dao.totalChallenges}</div>
                    <div className="text-right font-medium text-green-400">
                      ${dao.totalRewards.toFixed(0)}
                    </div>
                  </div>
                ))}

                {topDAOs.length === 0 && (
                  <div className="text-muted-foreground py-4 text-center">
                    No DAOs found. Create the first one!
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* About / Stats */}
          <Card className="bg-card border-border">
            <CardContent className="flex h-full flex-col items-center justify-center p-6">
              <h2 className="text-foreground mb-6 text-2xl font-bold">About</h2>

              <div className="text-center">
                <h3 className="text-muted-foreground mb-4 text-lg">
                  Total Burned Tokens
                </h3>
                <p
                  className="text-foreground text-5xl font-bold"
                  style={{ textShadow: '0 0 10px rgba(255, 255, 255, 0.3)' }}
                >
                  152,0000
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
