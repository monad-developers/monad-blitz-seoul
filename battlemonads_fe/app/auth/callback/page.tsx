'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase/client';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          router.push('/?error=auth_failed');
          return;
        }

        if (data?.session) {
          console.log('Auth successful, redirecting to home...');
          router.push('/');
        } else {
          console.log('No session found, redirecting to home...');
          router.push('/');
        }
      } catch (error) {
        console.error('Unexpected error in auth callback:', error);
        router.push('/?error=auth_failed');
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen bg-[#121619] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-pulse text-6xl mb-4">⚔️</div>
        <h2 className="text-2xl font-bold text-[#5AD8CC] mb-2">
          Completing Discord Login...
        </h2>
        <p className="text-[#8B9299]">
          Please wait while we redirect you back to the game.
        </p>
      </div>
    </div>
  );
}