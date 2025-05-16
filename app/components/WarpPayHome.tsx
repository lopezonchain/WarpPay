// src/components/WarpPayHome.tsx
"use client";

import React, { useCallback, useState } from "react";
import {
  FiSend,
  FiDollarSign,
  FiGift,
  FiClock,
  FiBookOpen,
  FiTrendingUp,
  FiAirplay,
  FiInfo
} from "react-icons/fi";
import { WarpView } from "../page-client";
import { motion } from 'framer-motion';

interface WarpPayHomeProps {
  onAction: (view: WarpView) => void;
}

const WarpPayHome: React.FC<WarpPayHomeProps> = ({ onAction }) => {

  const [openDesc, setOpenDesc] = useState<string | null>(null);
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
        desc: "Excute payments, get 1%",
        action: "earn",
        enabled: true,
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
        desc: "Generate feed integrated request links that anyone can fulfill, anywhere, with just couple clicks!! Customize your link embed and preview with a reason",
        action: "request",
        enabled: true,
        fee: 0,
      },
      {
        icon: <FiClock />,
        label: "Schedule",
        desc: "Schedule one-time or recurring payments with our usual Farcaster names and ENS / Basenames support, as long as wallet addresses",
        action: "schedule",
        enabled: true,
        fee: 3,
      },
      {
        icon: <FiGift />,
        label: "Airdrop",
        desc: "Distribute tokens to multiple addresses at once, saving time and gas fees. Seamlessly search and select your friends in Recommended mode (or randomize it a bit!!)",
        action: "airdrop",
        enabled: true,
        fee: 2,
      },
      /*{
        icon: <FiGift />,
        label: "Escrow",
        desc: "Escrow any work, or earn",
        action: "escrow",
        enabled: true,
        fee: 2,
      },
      {
        icon: <FiBookOpen />,
        label: "History",
        desc: "View your past payments",
        action: "history",
        enabled: false,
        fee: 0,
      },*/
    ];

    const handleShare = useCallback(() => {
      const text = `Do you know WarpPay?? The all-in-one payments miniapp by @lopezonchain.eth 🚀 Send anything, anywhere to anyone just with a farcaster name or ENS, create request links, airdrops, scheduled transfers, or even EARN! https://warpcast.com/miniapps/V0727cQCBnfX/warppay- `;
      const url = `https://warpcast.com/~/compose?text=${encodeURIComponent(text)}`;
      window.open(url, "_blank");
    }, []);

return (
    <div className="bg-[#0f0d14] text-white px-4 py-3 flex flex-col items-center w-full">
      {/* Header */}
      <div className="flex items-end mb-4">
        <h1 className="text-4xl font-bold">WarpPay</h1>
        <h3 className="text-xl font-bold text-[#8565CB] ml-2">beta</h3>
        <span className="text-3xl ml-2 animate-pulse">💸</span>
      </div>
      <p className="text-sm text-gray-400 mb-6 text-center leading-snug">
        Easy Onchain Payments<br />
        Decentralized Farcaster Miniapp
      </p>

      {/* Actions list */}
      <div className="flex flex-col space-y-4 w-full max-w-md">
        {actions.map(({ icon, label, desc, action, enabled, fee }, idx) => {
          const isEarn = action === 'earn';
          const isOpen = openDesc === action;

          return (
            <motion.div
              key={action}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
            >
              <div className="relative">
                <motion.button
                  onClick={() => enabled && onAction(action)}
                  disabled={!enabled}
                  whileHover={enabled ? { scale: 1.02 } : {}}
                  whileTap={enabled ? { scale: 0.98 } : {}}
                  className={`
                    relative w-full rounded-2xl px-5 py-4 pr-16 flex items-center
                    ${enabled
                      ? 'bg-[#1a1725] hover:shadow-lg'
                      : 'bg-[#1a1725] opacity-50 cursor-not-allowed'}
                    transition-shadow duration-200
                    ${isEarn
                    ? "bg-yellow-500 hover:bg-yellow-400 text-black font-extrabold transform hover:scale-105"
                    : enabled
                      ? "bg-[#1a1725] hover:bg-[#2a2438] border border-[#2a2438] text-white"
                      : "bg-[#1a1725] border border-[#3a3448] text-gray-500"
                  }
                  `}
                >
                  {/* Fee badge en la izquierda */}
                  {!isEarn && action !== 'history' && (
                    <span
                      className={`absolute left-4 text-xs font-semibold px-2 py-0.5 rounded-full ${
                        fee === 0 ? 'bg-green-600' : 'bg-green-800'
                      }`}
                    >
                      {fee === 0 ? 'FREE' : `${fee}% fee`}
                    </span>
                  )}

                  {(action === "airdrop" || action === "schedule" || action === "earn") ? (
                    <div>
                      <img
                        src="https://github.com/base/brand-kit/blob/main/logo/symbol/Base_Symbol_Blue.png?raw=true"
                        alt="Base logo"
                        className="absolute bottom-1 right-16 w-4 h-4 opacity-80"
                      />
                      <img
                        src="https://cdn.prod.website-files.com/667c57e6f9254a4b6d914440/667d7104644c621965495f6e_LogoMark.svg"
                        alt="Monad Testnet logo"
                        className="absolute bottom-1 right-12 w-4 h-4 opacity-80"
                      />
                    </div>
                  ) : (action === "send" || action === "request") ? (
                    <span className="absolute bottom-1 right-14 text-xs font-bold opacity-80">
                      ALL
                    </span>
                  ) : null}

                  {/* Icon + label */}
                  <div className="flex justify-center items-center w-full space-x-2">
                    <span className="text-lg">{icon}</span>
                    <span className="font-semibold text-xl">
                      {label}
                    </span>
                  </div>

                  {/* Info toggle ocupa todo el lado derecho */}
                  {!isEarn && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenDesc(isOpen ? null : action);
                      }}
                      className="absolute inset-y-0 right-0 w-12 flex items-center justify-center"
                      aria-label="Show description"
                    >
                      <div className="p-3 bg-gray-700 rounded-full hover:bg-gray-600 transition-colors">
                        <FiInfo className="text-2xl" />
                      </div>
                    </button>
                  )}
                </motion.button>

                {/* Descripción desplegable */}
                {!isEarn && (
                  <div
                    className={`
                      overflow-hidden transition-[max-height] duration-300
                      ${isOpen ? 'max-h-40 mt-2' : 'max-h-0'}
                    `}
                  >
                    <p className="text-s text-gray-400 px-6 pb-2">{desc}</p>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Share + Support con animación al cargar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: actions.length * 0.1, duration: 0.5 }}
        className="flex flex-col mt-6 w-full max-w-sm space-y-2"
      >
        <motion.button
          onClick={handleShare}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="
            flex justify-center items-center py-3 rounded-2xl bg-purple-600
            hover:bg-purple-700 transition-colors duration-200 shadow-lg
          "
        >
          <FiAirplay className="mr-2" /> Share <FiAirplay className="ml-2" />
        </motion.button>
        <motion.a
          href="?wallet=lopezonchain.eth&amount=0.01&token=ETH"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="
            flex justify-center items-center py-3 rounded-2xl bg-purple-600
            hover:bg-purple-700 transition-colors duration-200 shadow-lg
          "
        >
          💜💜 Support WarpPay 💜💜
        </motion.a>
      </motion.div>

      {/* Footer */}
      <footer className="mt-4 text-xs text-gray-500 text-center">
        ✦ Powered by Farcaster & Coinbase Minikit ✦
      </footer>
    </div>
  );
};

export default WarpPayHome;
