import type React from "react";
import "./globals.css";
import Providers from "./PrivyProviders";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://hangeul.pstatic.net/hangeul_static/css/NanumKarGugSu.css"
          rel="stylesheet"
        />
      </head>
      <body className={`font-sans antialiased`}>
        <Providers>
          <div
            className="absolute inset-0 z-0"
            style={{
              backgroundImage: "url(/monstar-arcade.png)",
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          />
          {children}
        </Providers>
      </body>
    </html>
  );
}
