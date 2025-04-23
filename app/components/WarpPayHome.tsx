// src/components/WarpPayHome.tsx
"use client";

import React from "react";
import {
  FiSend,
  FiDollarSign,
  FiGift,
  FiClock,
  FiBookOpen 
} from "react-icons/fi";

export type WarpView = "send" | "request" | "airdrop" | "scheduled" | "history";

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
  }[] = [
    {
      icon: <FiSend />,
      label: "Send",
      desc: "Instantly send ETH or tokens to any wallet on-chain.",
      action: "send",
      enabled: true,
    },
    {
      icon: <FiDollarSign />,
      label: "Request",
      desc: "Generate a payment request that others can fulfill easily.",
      action: "request",
      enabled: true,
    },
    {
      icon: <FiGift />,
      label: "Multisend / Airdrop",
      desc: "Distribute tokens to multiple addresses at once.",
      action: "airdrop",
      enabled: false,
    },
    {
      icon: <FiClock />,
      label: "Scheduled",
      desc: "Schedule future transactions or token drops.",
      action: "scheduled",
      enabled: false,
    },
    {
      icon: <FiBookOpen />,
      label: "Txs History",
      desc: "View your past transactions and activity logs.",
      action: "history",
      enabled: false,
    },
  ];

  return (
    <div className="bg-[#0f0d14] text-white px-4 py-6 flex flex-col items-center w-full">
      {/* Call to Action */}
      <a
        href="?wallet=0xa74C3EBF7e700175945702Cd9Ea3D09D5e654321&amount=0.01&token=ETH"
        className="mb-6 w-full max-w-sm bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg text-center shadow-lg transition"
      >
        Support WarpPay 💜
      </a>

      {/* Header */}
      <div className="flex items-end mb-4">
        <h1 className="text-4xl font-bold">WarpPay</h1>
        <h3 className="text-xl font-bold text-[#8565CB] ml-2">beta</h3>
        <span className="text-3xl ml-2">💸</span>
      </div>
      <p className="text-sm text-gray-400 mb-8 text-center">
        Send, request & drop tokens on Warpcast
      </p>

      {/* Buttons with improved layout */}
      <div className="flex flex-col space-y-4 w-full max-w-md">
        {actions.map(({ icon, label, desc, action, enabled }) => (
          <button
            key={label}
            onClick={() => enabled && onAction(action)}
            disabled={!enabled}
            className={`w-full rounded-xl px-5 py-4 text-left shadow-md transition border ${
              enabled
                ? "bg-[#1a1725] hover:bg-[#2a2438] border-[#2a2438]"
                : "bg-[#1a1725] border-[#3a3448] opacity-50 cursor-not-allowed"
            }`}
          >
            <div className="flex items-center space-x-3 mb-1">
              <div className="text-lg">{icon}</div>
              <span className="font-semibold text-white">{label}</span>
              {!enabled && (
                <span className="ml-auto text-xs text-purple-400">
                  Coming soon
                </span>
              )}
            </div>
            <div className="text-xs text-gray-400 pl-8">{desc}</div>
          </button>
        ))}
      </div>

      {/* Footer */}
      <footer className="mt-12 text-xs text-gray-500 text-center">
        <div>Connected to Farcaster ✦ Powered by Minikit & Base</div>
      </footer>
    </div>
  );
};

export default WarpPayHome;
