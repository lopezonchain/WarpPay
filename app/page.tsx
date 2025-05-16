import dynamic from 'next/dynamic';
import type { Metadata } from 'next';

const WarpPayApp = dynamic(() => import('./page-client'), { ssr: false });

export async function generateMetadata({ searchParams }: { searchParams: { [key: string]: string } }): Promise<Metadata> {
  const wallet    = searchParams.wallet;
  const amount    = searchParams.amount;
  const token     = searchParams.token;
  const contract  = searchParams.contract;
  const reason    = searchParams.reason;
  const isPayment = wallet && amount;

  const reasonText = reason ? ` ${reason}` : "";

  const formattedAmount = amount ? `${amount} ${token}` : "";
  const shortWallet     = wallet ? `${wallet.slice(0, 6)}...${wallet.slice(-4)}` : "";

  const title = reasonText !== "" ? reasonText : `WarpPay me ${formattedAmount} 💸 ${reasonText}`

  return {
    title: isPayment
      ? title
      : "WarpPay",
    description: isPayment
      ? `Send ${formattedAmount}${reasonText} to ${shortWallet}`
      : "WarpPay. Easy payments of all kinds, in Farcaster or browser",
    other: {
      "fc:frame": JSON.stringify({
        version: "next",
        imageUrl: isPayment
          ? "https://warppay.lopezonchain.xyz/payment-frame.png"
          : "https://warppay.lopezonchain.xyz/WarpPayLogo.png",
        button: {
          title: isPayment
            ? title
            : "Launch WarpPay 💸",
          action: {
            type: "launch_frame",
            url: isPayment
              ? `https://warppay.lopezonchain.xyz?wallet=${encodeURIComponent(wallet!)}&amount=${encodeURIComponent(amount!)}&token=${encodeURIComponent(token!)}&contract=${encodeURIComponent(contract! || "")}${reason ? `&reason=${encodeURIComponent(reason)}` : ""}`
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
