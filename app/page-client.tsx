// src/app/page.tsx
"use client";

import React, { useState, useEffect, useMemo, useCallback, ReactNode, useRef } from "react";
import { useAccount, useWalletClient, useConnect } from "wagmi";
import { useSearchParams } from "next/navigation";
import {
  useMiniKit,
  useAddFrame,
} from "@coinbase/onchainkit/minikit";
import {
  Name,
  Identity,
  Address,
  Avatar,
  EthBalance,
} from "@coinbase/onchainkit/identity";
import {
  ConnectWallet,
  Wallet,
  WalletDropdown,
  WalletDropdownDisconnect,
} from "@coinbase/onchainkit/wallet";
import WarpPayHome from "./components/WarpPayHome";
import SendScreen from "./components/SendScreen";
import RequestScreen from "./components/RequestScreen";
import AirdropScreen from "./components/AirdropScreen";
import HistoryScreen from "./components/HistoryScreen";
import { Listbox, ListboxButton, ListboxOption, ListboxOptions, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";
import { sdk } from '@farcaster/frame-sdk';

import {
  mainnet, arbitrum, optimism, polygon, avalanche, fantom, gnosis, celo, base, abstract, aurora, bsc, dogechain,
  linea, metis, moonbeam, neonMainnet, polygonZkEvm, sonic, tron, zksync,
  baseSepolia, monadTestnet
} from "wagmi/chains";
import ScheduleScreen from "./components/ScheduleScreen";
import EarnScreen from "./components/EarnScreen";

export type WarpView = "home" | "send" | "request" | "airdrop" | "schedule" | "history"  | "earn" ;

const chainOptions = [
  //{ label: "Sepolia", chain: baseSepolia },
  { label: "Base", chain: base },
  { label: "Monad Testnet", chain: monadTestnet },
  { label: "Ethereum", chain: mainnet },
  { label: "Arbitrum", chain: arbitrum },
  { label: "Sonic", chain: sonic },
  { label: "Abstract", chain: abstract },
  { label: "Optimism", chain: optimism },
  { label: "Polygon", chain: polygon },
  { label: "Avalanche", chain: avalanche },
  { label: "Fantom", chain: fantom },
  { label: "Gnosis", chain: gnosis },
  { label: "Celo", chain: celo },
  { label: "BSC", chain: bsc },
  { label: "Polygon zkEVM", chain: polygonZkEvm },
  { label: "zkSync", chain: zksync },
  //{ label: "Scroll", chain: scroll },
  { label: "Linea", chain: linea },
  { label: "Metis", chain: metis },
  { label: "Dogechain", chain: dogechain },
  { label: "Tron", chain: tron },
  { label: "Aurora", chain: aurora },
  { label: "Moonbeam", chain: moonbeam },
  { label: "Neon EVM", chain: neonMainnet },
] as const;


type ButtonProps = {
  children: ReactNode;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  icon?: ReactNode;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  onClick,
  disabled = false,
  type = "button",
  icon,
}: ButtonProps) {
  const baseClasses =
    "inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0052FF] disabled:opacity-50 disabled:pointer-events-none";

  const variantClasses = {
    primary:
      "bg-[var(--app-accent)] hover:bg-[var(--app-accent-hover)] text-[var(--app-background)]",
    secondary:
      "bg-[var(--app-gray)] hover:bg-[var(--app-gray-dark)] text-[var(--app-foreground)]",
    outline:
      "border border-[var(--app-accent)] hover:bg-[var(--app-accent-light)] text-[var(--app-accent)]",
    ghost:
      "hover:bg-[var(--app-accent-light)] text-[var(--app-foreground-muted)]",
  };

  const sizeClasses = {
    sm: "text-xs px-2.5 py-1.5 rounded-md",
    md: "text-sm px-4 py-2 rounded-lg",
    lg: "text-base px-6 py-3 rounded-lg",
  };

  return (
    <button
      type={type}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {icon && <span className="flex items-center mr-2">{icon}</span>}
      {children}
    </button>
  );
}

type IconProps = {
  name: "heart" | "star" | "check" | "plus" | "arrow-right";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Icon({ name, size = "md", className = "" }: IconProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  const icons = {
    heart: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <title>Heart</title>
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
    star: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <title>Star</title>
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
    check: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <title>Check</title>
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
    plus: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <title>Plus</title>
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    ),
    "arrow-right": (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <title>Arrow Right</title>
        <line x1="5" y1="12" x2="19" y2="12" />
        <polyline points="12 5 19 12 12 19" />
      </svg>
    ),
  };

  return (
    <span className={`inline-block ${sizeClasses[size]} ${className}`}>
      {icons[name]}
    </span>
  );
}

export default function Page(): JSX.Element {
  const { address } = useAccount();
  const { connectAsync, connectors } = useConnect();
  const { data: walletClient } = useWalletClient();
  const searchParams = useSearchParams();
  const { setFrameReady, isFrameReady, context } = useMiniKit();
  const addFrame = useAddFrame();

  const [warpView, setWarpView] = useState<WarpView>("home");
  const [frameAdded, setFrameAdded] = useState(false);
  const [selectedChain, setSelectedChain] = useState<any>(base);
  const triedAutoConnect = useRef(false);

  useEffect(() => {
    if (!isFrameReady) setFrameReady();
    (async () => {
      await sdk.actions.ready({ disableNativeGestures: true });
    })();
  }, [isFrameReady, setFrameReady]);

  useEffect(() => {
    if (!triedAutoConnect.current && !address && connectors.length) {
      triedAutoConnect.current = true;
      const injected = connectors.find((c) => c.id === "injected") ?? connectors[0];
      connectAsync({ connector: injected });
    }
  }, [address, connectors, connectAsync]);

  useEffect(() => {
    if (walletClient) {
      const found = chainOptions.find((o) => o.chain.id === walletClient.chain.id);
      if (found && selectedChain.id !== found.chain.id) {
        setSelectedChain(found.chain);
      }
    }
  }, [walletClient, selectedChain.id]);

  useEffect(() => {
    const w = searchParams.get("wallet");
    const a = searchParams.get("amount");
    if (w && a) setWarpView("send");
  }, [searchParams]);

  const handleAddFrame = useCallback(async () => {
    const added = await addFrame();
    setFrameAdded(Boolean(added));
  }, [addFrame]);

  const saveFrameButton = useMemo(() => {
    if (context && !context.client.added) {
      return (
        <Button variant="ghost" size="sm" onClick={handleAddFrame} className="p-4" icon={<Icon name="plus" size="sm" />}>
          Save Miniapp
        </Button>
      );
    }
    if (frameAdded) {
      return (
        <div className="flex items-center space-x-1 text-sm font-medium text-[#0052FF] animate-fade-out">
          <Icon name="check" size="sm" className="text-[#0052FF]" />
          <span>Saved</span>
        </div>
      );
    }
    return null;
  }, [context, frameAdded, handleAddFrame]);

  const handleChainChange = async (id: number) => {
    const found = chainOptions.find((o) => o.chain.id === id);
    if (found && walletClient) {
      try {
        await walletClient.switchChain({ id });
        setSelectedChain(found.chain);
      } catch (error: any) {
        if (error.code === 4902) {
          try {
            await walletClient.addChain({ chain: found.chain });
            await walletClient.switchChain({ id });
            setSelectedChain(found.chain);
          } catch (addError) {
            console.error("Error adding chain:", addError);
          }
        } else {
          console.error("Error switching chain:", error);
        }
      }
    }
  };

  const handleBack = () => setWarpView("home");

  return (
    <div className="flex flex-col bg-[#0f0d14] font-sans text-[var(--app-foreground)] mini-app-theme">
      <div className="w-full max-w-md mx-auto px-4 py-3 min-h-screen">
        <header className="flex justify-between items-center mb-3 h-11">
          <div className="flex items-center justify-between space-x-2 w-full">
            {address && (
              <Listbox value={selectedChain.id} onChange={(id: number) => handleChainChange(id)}>
                <div className="relative w-48 text-base">
                  <ListboxButton className="w-full flex justify-between items-center bg-[#1a1725] text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600">
                    <div className="flex items-center space-x-2">
                      {selectedChain.id === 8453 && (
                        <img
                          src="https://github.com/base/brand-kit/blob/main/logo/symbol/Base_Symbol_Blue.png?raw=true"
                          alt="Base logo"
                          className="w-5 h-5"
                        />
                      )}
                      {selectedChain.id === 10143 && (
                        <img
                          src="https://cdn.prod.website-files.com/667c57e6f9254a4b6d914440/667d7104644c621965495f6e_LogoMark.svg"
                          alt="Monad Testnet logo"
                          className="w-5 h-5"
                        />
                      )}
                      <span>
                        {chainOptions.find((o) => o.chain.id === selectedChain.id)?.label}
                      </span>
                    </div>
                    <FiChevronDown className="ml-2" />
                  </ListboxButton>

                  <Transition
                    as={Fragment}
                    leave="transition ease-in duration-100"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                  >
                    <ListboxOptions className="absolute z-10 mt-1 w-full bg-[#1a1725] rounded-lg shadow-lg max-h-60 overflow-auto focus:outline-none">
                      {chainOptions.map((o) => (
                        <ListboxOption
                          key={o.chain.id}
                          value={o.chain.id}
                          className={({ active, selected }) =>
                            `cursor-pointer select-none px-4 py-2 ${active ? "bg-purple-600 text-white" : "text-gray-300"
                            } ${selected ? "font-semibold" : ""}`
                          }
                        >
                          {({ selected }) => (
                            <div className="flex justify-between items-center">
                              <div className="flex items-center space-x-2">
                                {o.chain.id === 8453 && (
                                  <img
                                    src="https://github.com/base/brand-kit/blob/main/logo/symbol/Base_Symbol_Blue.png?raw=true"
                                    alt="Base logo"
                                    className="w-4 h-4"
                                  />
                                )}
                                {o.chain.id === 10143 && (
                                  <img
                                    src="https://cdn.prod.website-files.com/667c57e6f9254a4b6d914440/667d7104644c621965495f6e_LogoMark.svg"
                                    alt="Monad Testnet logo"
                                    className="w-5 h-5"
                                  />
                                )}
                                <span>{o.label}</span>
                              </div>
                              {selected && <FiChevronUp className="text-purple-400" />}
                            </div>
                          )}
                        </ListboxOption>
                      ))}
                    </ListboxOptions>
                  </Transition>
                </div>
              </Listbox>
            )}

            <Wallet className="z-10">
              <ConnectWallet>
                <Name className="text-inherit" />
              </ConnectWallet>
              <WalletDropdown>
                <Identity address={address} chain={selectedChain} className="px-4 pt-3 pb-2" hasCopyAddressOnClick>
                  <Avatar address={address} chain={selectedChain} />
                  <Name address={address} chain={selectedChain} />
                  <Address address={address} />
                  <EthBalance address={address} />
                </Identity>
                <WalletDropdownDisconnect />
              </WalletDropdown>
            </Wallet>

            <div>{saveFrameButton}</div>
          </div>
          
        </header>

        <main className="flex-1">
          {warpView === "home" && <WarpPayHome onAction={(view) => setWarpView(view)} />}
          {warpView === "send" && <SendScreen address={address} onBack={handleBack} />}
          {warpView === "request" && <RequestScreen address={address} onBack={handleBack} />}
          {warpView === "airdrop" && <AirdropScreen address={address} onBack={handleBack} />}
          {warpView === "schedule" && <ScheduleScreen onBack={handleBack} />}
          {warpView === "earn" && <EarnScreen onBack={handleBack} />}
        </main>
      </div>
    </div>
  );
}
//{warpView === "history" && <HistoryScreen address={address} onBack={handleBack} />}