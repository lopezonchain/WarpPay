"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useAccount, useWalletClient, useConnect } from "wagmi";
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

// WarpPay Components
import WarpPayHome from "./components/WarpPayHome";
import SendScreen from "./components/SendScreen";
import RequestScreen from "./components/RequestScreen";
import AirdropScreen from "./components/AirdropScreen";
import HistoryScreen from "./components/HistoryScreen";

type WarpView = "home" | "send" | "request" | "airdrop" | "history";

export default function App(): JSX.Element {
  // Wagmi hooks
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  //const { connect } = useConnect();

  const searchParams = useSearchParams();

  // Coinbase MiniKit context
  const { setFrameReady, isFrameReady, context } = useMiniKit();
  const addFrame = useAddFrame();
  const openUrl = useOpenUrl();

  const [frameAdded, setFrameAdded] = useState(false);
  const [warpView, setWarpView] = useState<WarpView>("home");
  //const [triedAutoConnect, setTriedAutoConnect] = useState(false);

  // Auto-connect injected wallet on mount
  useEffect(() => {
    const to = searchParams.get("wallet");
    const amount = searchParams.get("amount");
    if (to && amount) setWarpView("send");
  }, [searchParams]);

  useEffect(() => { if (!isFrameReady) setFrameReady(); }, [isFrameReady, setFrameReady]);
  const handleAddFrame = useCallback(async () => {
    const added = await addFrame();
    setFrameAdded(Boolean(added));
  }, [addFrame]);
  const saveFrameButton = useMemo(() => {
    if (context && !context.client.added) {
      return (
        <Button /* ... */ onClick={handleAddFrame}>
          <Icon name="plus" /> Save Frame
        </Button>
      );
    }
    if (frameAdded) {
      return (
        <div className="animate-fade-out">
          <Icon name="check" /> Saved
        </div>
      );
    }
    return null;
  }, [context, frameAdded, handleAddFrame]);

  const handleBack = () => setWarpView("home");

  return (
    <div className="flex flex-col bg-[#0f0d14] min-h-screen font-sans text-[var(--app-foreground)] mini-app-theme from-[var(--app-background)] to-[var(--app-gray)]">
      <div className="w-full max-w-md mx-auto px-4 py-3">
        <header className="flex justify-between items-center mb-3 h-11">
          <div className="flex items-center space-x-2">
            {/* Coinbase Wallet Login Always */}
            <Wallet className="z-10">
              <ConnectWallet>
                <Name className="text-inherit" />
              </ConnectWallet>
              <WalletDropdown>
                <Identity className="px-4 pt-3 pb-2" hasCopyAddressOnClick>
                  <Avatar />
                  <Name />
                  <Address />
                  <EthBalance />
                </Identity>
                <WalletDropdownDisconnect />
              </WalletDropdown>
            </Wallet>
          </div>
          <div>{saveFrameButton}</div>
        </header>

        <main className="flex-1">
        {warpView === "home" && <WarpPayHome onAction={setWarpView} />}
        {warpView === "send" && <SendScreen walletClient={walletClient} address={address} onBack={handleBack} />}
        {warpView === "request" && <RequestScreen walletClient={walletClient} address={address} onBack={handleBack} />}
        {warpView === "airdrop" && <AirdropScreen walletClient={walletClient} address={address} onBack={handleBack} />}
        {warpView === "history" && <HistoryScreen address={address} onBack={handleBack} />}
      </main>

        <footer className="mt-2 pt-4 flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            className="text-[var(--ock-text-foreground-muted)] text-xs"
            onClick={() => openUrl("https://base.org/builders/minikit")}
          >
            Built on Base with MiniKit
          </Button>
        </footer>
      </div>
    </div>
  );
}