'use client';

import { Home, Target, Plus, Vote } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'My Challenges', href: '/challenges', icon: Target },
  { name: 'Review & Vote', href: '/review', icon: Vote },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="bg-card border-border flex w-64 flex-col border-r">
      <div className="p-6">
        <div className="flex items-center gap-2">
          <div className="bg-primary flex h-8 w-8 items-center justify-center rounded-lg">
            <span className="text-primary-foreground text-sm font-bold">M</span>
          </div>
          <span className="text-foreground text-lg font-bold">MonaDAO</span>
        </div>
      </div>

      <nav className="flex-1 px-4">
        <ul className="space-y-1">
          {navigation.map(item => {
            const isActive = pathname === item.href;
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'text-foreground bg-accent'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-border border-t p-4">
        <Link
          href="/create"
          className="text-muted-foreground hover:text-foreground hover:bg-accent flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
        >
          <Plus className="h-5 w-5" />
          Create Challenge
        </Link>
      </div>
    </div>
  );
}
