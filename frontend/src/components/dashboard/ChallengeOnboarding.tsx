'use client';

import { CheckSquare, Target, Users, DollarSign } from 'lucide-react';

const onboardingItems = [
  { text: 'Connect your wallet', completed: false },
  { text: 'Join your first challenge', completed: false, progress: '0/1' },
  { text: 'Create your own DAO', completed: false },
  { text: 'Complete a challenge successfully', completed: false },
];

const quickStats = [
  { label: 'Active Challenges', value: '23', icon: Target },
  { label: 'Total Participants', value: '1.2K', icon: Users },
  { label: 'USDT in Pools', value: '$48K', icon: DollarSign },
];

export function ChallengeOnboarding() {
  return (
    <div className="space-y-8">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {quickStats.map((stat, index) => (
          <div
            key={index}
            className="bg-card border-border rounded-lg border p-4"
          >
            <div className="flex items-center gap-3">
              <div className="bg-accent flex h-10 w-10 items-center justify-center rounded-lg">
                <stat.icon className="text-accent-foreground h-5 w-5" />
              </div>
              <div>
                <p className="text-foreground text-2xl font-bold">
                  {stat.value}
                </p>
                <p className="text-muted-foreground text-sm">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Onboarding Checklist */}
      <div>
        <h2 className="text-foreground mb-4 text-lg font-medium">
          GETTING STARTED
        </h2>
        <div className="bg-card border-border rounded-lg border p-6">
          <div className="space-y-4">
            {onboardingItems.map((item, index) => (
              <div key={index} className="flex items-center gap-3">
                <CheckSquare
                  className={`h-4 w-4 ${item.completed ? 'text-green-500' : 'text-muted-foreground'}`}
                />
                <span className="text-foreground flex-1 text-sm">
                  {item.text}
                </span>
                {item.progress && (
                  <span className="text-muted-foreground text-xs">
                    {item.progress}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
