'use client'

import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { ThemeProvider } from 'next-themes'
import { config } from '@/lib/wagmi'

const queryClient = new QueryClient()

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          {children}
          <Toaster 
            position="bottom-right"
            toastOptions={{
              duration: 4000,
              className: 'dark:bg-gray-800 dark:text-white bg-white text-gray-900',
            }}
          />
        </QueryClientProvider>
      </WagmiProvider>
    </ThemeProvider>
  )
}