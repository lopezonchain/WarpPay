// src/app/layout.tsx
import './theme.css';
import '@coinbase/onchainkit/styles.css';
import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Providers } from './providers';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export async function generateMetadata(): Promise<Metadata> {
  const URL = process.env.NEXT_PUBLIC_URL;
  return {
    title: "WarpBoard",
    description: "WarpPay. Easy payments of all kinds, in Warpcast or browser",
    other: {
      'fc:frame': JSON.stringify({
        version: "next",
        imageUrl: "https://warppay.lopezonchain.xyz/WarpPayLogo.png",
        button: {
          title: "Launch WarpPay 💸",
          action: {
            type: 'launch_frame',
            name: "WarpBoard",
            url: "https://warppay.lopezonchain.xyz",
            splashImageUrl: "https://warppay.lopezonchain.xyz/WarpPayLogo.png",
            splashBackgroundColor: "#17101f",
          },
        },
      }),
    },
  };  
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-background">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
