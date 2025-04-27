import dynamic from 'next/dynamic';
import type { Metadata } from 'next';

const WarpPayApp = dynamic(() => import('./page-client'), { ssr: false });

export async function generateMetadata({ searchParams }: { searchParams: { [key: string]: string } }): Promise<Metadata> {
  const wallet = searchParams.wallet;
  const amount = searchParams.amount;
  const token = searchParams.token || "ETH";

  const isPayment = wallet && amount;

  const formattedAmount = amount ? `${amount} ${token}` : '';
  const shortWallet = wallet ? `${wallet.slice(0, 6)}...${wallet.slice(-4)}` : '';

  return {
    title: isPayment ? `WarpPay me ${formattedAmount} 💸` : "WarpPay",
    description: isPayment
      ? `Send ${formattedAmount} to ${shortWallet}`
      : "WarpPay. Easy payments of all kinds, in Warpcast or browser",
    other: {
      'fc:frame': JSON.stringify({
        version: "next",
        imageUrl: isPayment
          ? `https://warppay.lopezonchain.xyz/payment-frame.png`
          : "https://warppay.lopezonchain.xyz/WarpPayLogo.png",
        button: {
          title: isPayment ? `WarpPay me ${formattedAmount} 💸` : "Launch WarpPay 💸",
          action: {
            type: "launch_frame",
            url: isPayment
              ? `https://warppay.lopezonchain.xyz?wallet=${wallet}&amount=${amount}&token=${token}`
              : "https://warppay.lopezonchain.xyz",
            name: "WarpPay",
            splashImageUrl: "https://warppay.lopezonchain.xyz/WarpPayLogo.png",
            splashBackgroundColor: "#17101f",
          },
        },
      }),
    },
  };
}

export default function Page() {
  return <WarpPayApp />;
}
