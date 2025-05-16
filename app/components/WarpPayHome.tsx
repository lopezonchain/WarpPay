// src/components/WarpPayHome.tsx
"use client";

import React, { useCallback } from "react";
import {
  FiSend,
  FiDollarSign,
  FiGift,
  FiClock,
  FiBookOpen,
  FiTrendingUp,
  FiAirplay
} from "react-icons/fi";
import { WarpView } from "../page-client";

interface WarpPayHomeProps {
  onAction: (view: WarpView) => void;
}

const WarpPayHome: React.FC<WarpPayHomeProps> = ({ onAction }) => {
  const actions: {
    icon: JSX.Element;
    label: string;
    desc: string;
    action: WarpView;
    enabled: boolean;
    fee: number;
  }[] = [
      {
        icon: <FiTrendingUp />,
        label: "Earn",
        desc: "Excute payments before the automatic execution, get 1%",
        action: "earn",
        enabled: false,
        fee: 0,
      },
      {
        icon: <FiSend />,
        label: "Send",
        desc: "Instantly send any currency to any Farcaster user, wallet, ENS or Basename, completely FREE!",
        action: "send",
        enabled: true,
        fee: 0,
      },
      {
        icon: <FiDollarSign />,
        label: "Request",
        desc: "Generate feed integrated request links that anyone can fulfill, anywhere, with just couple clicks!!",
        action: "request",
        enabled: true,
        fee: 0,
      },
      {
        icon: <FiGift />,
        label: "Airdrop",
        desc: "Distribute tokens to multiple addresses at once, saving time and gas fees. Seamlessly search and select your friends in Recommended mode (or randomize it a bit!!)",
        action: "airdrop",
        enabled: true,
        fee: 2,
      },
      {
        icon: <FiClock />,
        label: "Scheduler",
        desc: "Schedule one-time or recurring payments with our usual Farcaster names and ENS / Basenames support",
        action: "schedule",
        enabled: true,
        fee: 3,
      },
      /*{
        icon: <FiBookOpen />,
        label: "History",
        desc: "View your past payments",
        action: "history",
        enabled: false,
        fee: 0,
      },*/
    ];

    const handleShare = useCallback(() => {
      const text = `Do you know WarpPay?? The all-in-one payments miniapp by @lopezonchain.eth 🚀 Send anything, anywhere to anyone just with a farcaster name or ENS, create request links, airdrops, scheduled transfers, or even EARN! warppay.lopezonchain.xyz `;
      const url = `https://warpcast.com/~/compose?text=${encodeURIComponent(text)}`;
      window.open(url, "_blank");
    }, []);

  return (
    <div className="bg-[#0f0d14] text-white px-4 py-6 flex flex-col items-center w-full">
      <div className="flex items-end mb-2">
        <h1 className="text-4xl font-bold">WarpPay</h1>
        <h3 className="text-xl font-bold text-[#8565CB] ml-2">beta</h3>
        <span className="text-3xl ml-2">💸</span>
      </div>
      <p className="text-sm text-gray-400 mb-6 text-center">
        Easy Onchain Payments<br /> Decentralized Farcaster Miniapp<br />
      </p>

      <div className="flex flex-col space-y-4 w-full max-w-md">
        {actions.map(({ icon, label, desc, action, enabled, fee }) => {
          // detect “earn” para estilos especiales
          const isEarn = action === "earn";
          return (
            <button
              key={action}
              onClick={() => enabled && onAction(action)}
              disabled={!enabled}
              className={`
                relative w-full rounded-2xl px-5 py-4 text-left transition-shadow
                ${enabled ? "shadow-md hover:shadow-xl" : "opacity-50 cursor-not-allowed"}
                ${isEarn
                  ? "bg-yellow-500 hover:bg-yellow-400 text-black font-extrabold transform hover:scale-105"
                  : enabled
                    ? "bg-[#1a1725] hover:bg-[#2a2438] border border-[#2a2438] text-white"
                    : "bg-[#1a1725] border border-[#3a3448] text-gray-500"
                }
              `}
            >
              {/* fee tag omit for Earn */}
              {!isEarn && action !== "history" && (
                <span
                  className={`absolute top-2 right-2 text-xs font-semibold px-2 py-0.5 rounded ${fee === 0 ? "bg-green-600 text-white" : "bg-green-800 text-white"
                    }`}
                >
                  {fee === 0 ? "FREE" : `${fee}% fee`}
                </span>
              )}

              <div className={`flex items-center space-x-3 mb-1 ${isEarn ? "justify-center" : ""}`}>
                <div className="text-lg">{icon}</div>
                <span className={`font-semibold ${isEarn ? "text-xl" : ""}`}>
                  {label}
                </span>
                {!enabled && !isEarn && (
                  <span className="ml-auto text-xs text-purple-400">Coming soon</span>
                )}
              </div>
              {!isEarn && <div className="text-xs text-gray-400 pl-8">{desc}</div>}
              {(action === "airdrop" || action === "schedule" || action === "earn") ? (
                <div>
                  <img
                    src="https://github.com/base/brand-kit/blob/main/logo/symbol/Base_Symbol_Blue.png?raw=true"
                    alt="Base logo"
                    className="absolute bottom-1 right-6 w-4 h-4 opacity-80"
                  />
                  <img
                    src="https://cdn.prod.website-files.com/667c57e6f9254a4b6d914440/667d7104644c621965495f6e_LogoMark.svg"
                    alt="Monad Testnet logo"
                    className="absolute bottom-1 right-1 w-4 h-4 opacity-80"
                  />
                </div>
              ) : (action === "send" || action === "request") ? (
                <span className="absolute bottom-1 right-1 text-xs font-bold opacity-80">
                  ALL
                </span>
              ) : null}

            </button>
          );
        })}
      </div>

      <button
        onClick={handleShare}
        className="flex justify-center items-center mt-6 w-full max-w-sm bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-t-lg text-center shadow-lg border-b transition"
      >
        <FiAirplay className="mr-2" /> Share WarpPay <FiAirplay className="ml-2" />
      </button>

      <a
        href="?wallet=lopezonchain.eth&amount=0.01&token=ETH"
        className="w-full max-w-sm bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-b-lg text-center shadow-lg transition"
      >
        💜💜 Support 💜💜
      </a>


      <footer className="mt-4 text-xs text-gray-500 text-center">
        <div>✦ Powered by Farcaster & Coinbase Minikit ✦</div>
      </footer>
    </div>
  );
};

export default WarpPayHome;
