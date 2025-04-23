// src/page.tsx
"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { useSearchParams } from "next/navigation";
import {
  useMiniKit,
  useAddFrame,
  useOpenUrl,
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
import { Button, Icon } from "./components/DemoComponents";
import WarpPayHome from "./components/WarpPayHome";
import SendScreen from "./components/SendScreen";
import RequestScreen from "./components/RequestScreen";
import AirdropScreen from "./components/AirdropScreen";
import HistoryScreen from "./components/HistoryScreen";

// Hook de contexto de cadena
import { useChain } from "./providers";

type WarpView = "home" | "send" | "request" | "airdrop" | "history";

export default function App(): JSX.Element {
  // obtener la cadena activa y opciones del contexto
  const { chain, options, setChain } = useChain();

  // Wagmi + MiniKit
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const searchParams = useSearchParams();
  const { setFrameReady, isFrameReady, context } = useMiniKit();
  const addFrame = useAddFrame();
  const openUrl = useOpenUrl();

  // UI state
  const [warpView, setWarpView] = useState<WarpView>("home");
  const [frameAdded, setFrameAdded] = useState(false);

  // Si hay params ?wallet=&amount=, saltar a la vista send
  useEffect(() => {
    const w = searchParams.get("wallet");
    const a = searchParams.get("amount");
    if (w && a) setWarpView("send");
  }, [searchParams]);

  // Preparar el frame de MiniKit
  useEffect(() => {
    if (!isFrameReady) setFrameReady();
  }, [isFrameReady, setFrameReady]);

  const handleAddFrame = useCallback(async () => {
    const added = await addFrame();
    setFrameAdded(Boolean(added));
  }, [addFrame]);

  const saveFrameButton = useMemo(() => {
    if (context && !context.client.added) {
      return (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleAddFrame}
          className="text-[var(--app-accent)] p-4"
          icon={<Icon name="plus" size="sm" />}
        >
          Save Frame
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

  const handleBack = () => setWarpView("home");

  return (
    <div className="flex flex-col bg-[#0f0d14] font-sans text-[var(--app-foreground)] mini-app-theme from-[var(--app-background)] to-[var(--app-gray)]">
      <div className="w-full max-w-md mx-auto px-4 py-3 min-h-screen">
        <header className="flex justify-between items-center mb-3 h-11">
          <div className="flex items-center space-x-2">
            <Wallet className="z-10">
              <ConnectWallet>
                <Name className="text-inherit" />
              </ConnectWallet>
              <WalletDropdown>
                <Identity address={address} chain={chain} className="px-4 pt-3 pb-2" hasCopyAddressOnClick>
                  <Avatar address={address} chain={chain} />
                  <Name address={address} chain={chain} />
                  <Address address={address} />
                  <EthBalance address={address} />
                </Identity>
                <WalletDropdownDisconnect />
              </WalletDropdown>
            </Wallet>
            {/* Selector de red */}
            <select
              value={chain.id}
              onChange={(e) => {
                const id = parseInt(e.target.value, 10);
                const found = options.find((o) => o.chain.id === id);
                if (found) setChain(found.chain);
              }}
              className="bg-[#1a1725] text-sm text-white p-2 rounded"
            >
              {options.map((o) => (
                <option key={o.chain.id} value={o.chain.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>{saveFrameButton}</div>
        </header>

        <main className="flex-1">
          {warpView === "home" && <WarpPayHome onAction={setWarpView} />}
          {warpView === "send" && (
            <SendScreen address={address} onBack={handleBack} />
          )}
          {warpView === "request" && (
            <RequestScreen address={address} onBack={handleBack} />
          )}
          {warpView === "airdrop" && (
            <AirdropScreen address={address} onBack={handleBack} />
          )}
          {warpView === "history" && (
            <HistoryScreen address={address} onBack={handleBack} />
          )}
        </main>
      </div>
    </div>
  );
}
