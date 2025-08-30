import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers/WagmiProvider";
import { SupabaseProvider } from "./providers/SupabaseProvider";

export const metadata: Metadata = {
  title: "Battle Monads - Price-based Monster Battles",
  description: "Real-time price-based monster battles powered by Chainlink Data Feeds on Monad blockchain",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <SupabaseProvider>
          <Providers>
            {children}
          </Providers>
        </SupabaseProvider>
      </body>
    </html>
  );
}
