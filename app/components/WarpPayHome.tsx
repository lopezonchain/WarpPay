// src/components/WarpPayHome.tsx
"use client";

import React from "react";
import {
  FiSend,
  FiDollarSign,
  FiGift,
  FiClock,
} from "react-icons/fi";

export type WarpView = "send" | "request" | "airdrop" | "history";

interface WarpPayHomeProps {
  onAction: (view: WarpView) => void;
}

const WarpPayHome: React.FC<WarpPayHomeProps> = ({ onAction }) => {
  return (
    <div className="min-h-screen bg-[#0f0d14] text-white px-4 py-6 flex flex-col items-center">
      <div className="flex items-end">
        <h1 className="text-4xl font-bold mb-2">WarpPay</h1>
        <h3 className="text-xl font-bold text-[#8565CB]">beta</h3>
        <h3 className="text-4xl font-bold mb-2">💸</h3>
      </div>
      <p className="text-sm text-gray-400 mb-6">
        Send, request & drop tokens on Warpcast
      </p>
      <p className="text-sm text-gray-400 mb-6">Under construction</p>

      <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
        <ActionButton
          icon={<FiSend />}
          label="Send"
          onClick={() => onAction("send")}
        />
        <ActionButton
          icon={<FiDollarSign />}
          label="Request"
          onClick={() => onAction("request")}
        />
        <ActionButton
          icon={<FiGift />}
          label="Airdrop"
          onClick={() => onAction("airdrop")}
        />
        <ActionButton
          icon={<FiClock />}
          label="History"
          onClick={() => onAction("history")}
        />
      </div>

      <footer className="mt-12 text-xs text-gray-500">
        <div>Connected to Farcaster ✦ Powered by Minikit & Base</div>
      </footer>
    </div>
  );
};

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

const ActionButton: React.FC<ActionButtonProps> = ({
  icon,
  label,
  onClick,
}) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center justify-center bg-[#1a1725] border border-[#2e2948] rounded-2xl p-4 shadow hover:bg-[#29243c] transition w-full"
  >
    <div className="mb-2">{icon}</div>
    <span className="text-sm font-medium">{label}</span>
  </button>
);

export default WarpPayHome;
