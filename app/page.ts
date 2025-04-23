// src/app/page.ts
import type { Metadata } from 'next';

export async function generateMetadata({ searchParams }: { searchParams: { [key: string]: string } }): Promise<Metadata> {
  const wallet = searchParams.wallet;
  const amount = searchParams.amount;
  const token = searchParams.token || "ETH";

  const isPayment = wallet && amount;

  return {
    title: isPayment ? "WarpPay Payment" : "WarpBoard",
    description: isPayment
      ? `Pay ${amount} ${token} to ${wallet}`
      : "WarpPay. Easy payments of all kinds, in Warpcast or browser",
    other: {
      'fc:frame': JSON.stringify({
        version: "next",
        imageUrl: isPayment
          ? "https://warppay.lopezonchain.xyz/payment-frame.png"
          : "https://warppay.lopezonchain.xyz/WarpPayLogo.png",
        button: {
          title: isPayment ? "Pay Now 💸" : "Launch WarpPay 💸",
          action: {
            type: "launch_frame",
            url: isPayment
              ? `https://warppay.lopezonchain.xyz?wallet=${wallet}&amount=${amount}&token=${token}`
              : "https://warppay.lopezonchain.xyz",
            name: "WarpBoard",
            splashImageUrl: "https://warppay.lopezonchain.xyz/WarpPayLogo.png",
            splashBackgroundColor: "#17101f",
          },
        },
      }),
    },
  };
}
