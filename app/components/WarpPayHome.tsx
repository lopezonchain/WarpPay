// src/components/WarpPayHome.tsx
"use client";

import React from "react";
import { FiSend, FiDollarSign, FiGift, FiClock, FiBookOpen } from "react-icons/fi";
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
      { icon: <FiSend />, label: "Send", desc: "Instantly send any currency to any wallet, ENS or Basename", action: "send", enabled: true, fee: 0 },
      { icon: <FiDollarSign />, label: "Request", desc: "Generate a payment request link that anyone can fulfill.", action: "request", enabled: true, fee: 0 },
      { icon: <FiGift />, label: "Airdrop", desc: "Distribute tokens to multiple addresses at once, saving time and gas fees.", action: "airdrop", enabled: true, fee: 2 },
      { icon: <FiClock />, label: "Scheduled", desc: "Schedule one-time or recurring payments.", action: "scheduled", enabled: false, fee: 3 },
      { icon: <FiBookOpen />, label: "History", desc: "View your past payments.", action: "history", enabled: false, fee: 0 },
    ];

  return (
    <div className="bg-[#0f0d14] text-white px-4 py-4 flex flex-col items-center w-full">
      <div className="flex items-end mb-2">
        <h1 className="text-4xl font-bold">WarpPay</h1>
        <h3 className="text-xl font-bold text-[#8565CB] ml-2">beta</h3>
        <span className="text-3xl ml-2">💸</span>
      </div>
      <p className="text-sm text-gray-400 mb-4 text-center">
        Easy Onchain Payments<br /> Farcaster and Coinbase Miniapp
      </p>

      <div className="flex flex-col space-y-4 w-full max-w-md">
        {actions.map(({ icon, label, desc, action, enabled, fee }) => (
          <button
            key={action}
            onClick={() => enabled && onAction(action)}
            disabled={!enabled}
            className={`relative w-full rounded-xl px-5 py-4 text-left shadow-md transition border ${enabled
              ? "bg-[#1a1725] hover:bg-[#2a2438] border-[#2a2438]"
              : "bg-[#1a1725] border-[#3a3448] opacity-50 cursor-not-allowed"
              }`}
          >
            {/* fee tag */}
            {action !== "history" && (
              <span
                className={`absolute top-2 right-2 text-xs font-semibold px-2 py-0.5 rounded 
                  ${fee === 0 ? "bg-green-600 text-white" : "bg-green-800 text-white"}`}
              >
                {fee === 0 ? "FREE" : `${fee}% fee`}
              </span>
            )}

            <div className="flex items-center space-x-3 mb-1">
              <div className="text-lg">{icon}</div>
              <span className="font-semibold text-white">{label}</span>
              {!enabled && (
                <span className="ml-auto text-xs text-purple-400">Coming soon</span>
              )}
            </div>
            <div className="text-xs text-gray-400 pl-8">{desc}</div>
            {/* Logo de red Base */}
            {(action === "airdrop" || action === "scheduled") && (
              <img
                src="https://github.com/base/brand-kit/blob/main/logo/symbol/Base_Symbol_Blue.png?raw=true"
                alt="Base logo"
                className="absolute bottom-1 right-1 w-4 h-4 opacity-80"
              />
            )}
          </button>
        ))}
      </div>

      <a
        href="?wallet=lopezonchain.eth&amount=0.01&token=ETH"
        className="mt-6 w-full max-w-sm bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg text-center shadow-lg transition"
      >
        Support WarpPay 💜
      </a>

      <footer className="mt-2 text-xs text-gray-500 text-center">
        <div>✦ Powered by Farcaster & Coinbase Minikit ✦</div>
      </footer>
    </div>
  );
};

export default WarpPayHome;
