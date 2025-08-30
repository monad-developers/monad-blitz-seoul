import type React from 'react';
import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { Suspense } from 'react';
import '@/styles/globals.css';
import dynamic from 'next/dynamic';

const Web3Provider = dynamic(() => import('@/providers/Web3Provider').then(mod => ({ default: mod.Web3Provider })), {
  ssr: false,
});

export const metadata: Metadata = {
  title: 'MonaDAO - Challenge-Based DAO Platform',
  description:
    "Decentralized challenge platform where failed participants' fees burn tokens forever",
  keywords: ['DAO', 'Monad', 'Blockchain', 'Challenges', 'DeFi', 'Burn'],
  authors: [{ name: 'MonaDAO Team' }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <Web3Provider>
          <Suspense fallback={null}>{children}</Suspense>
        </Web3Provider>
      </body>
    </html>
  );
}
