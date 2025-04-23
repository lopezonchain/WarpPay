"use client";

import React, { ReactNode, Suspense, useEffect, useState } from "react";
import { WagmiProvider, createConfig, http } from "wagmi";
import {
  mainnet,
  arbitrum,
  optimism,
  polygon,
  avalanche,
  fantom,
  gnosis,
  celo,
  base,
} from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MiniKitProvider } from "@coinbase/onchainkit/minikit";
import { useWalletClient } from "wagmi";

// 1️⃣ Crear QueryClient para React Query
const queryClient = new QueryClient();

// 2️⃣ Crear wagmi config
const config = createConfig({
  chains: [mainnet, arbitrum, optimism, polygon, avalanche, fantom, gnosis, celo, base],
  transports: {
    [mainnet.id]: http(),
    [arbitrum.id]: http(),
    [optimism.id]: http(),
    [polygon.id]: http(),
    [avalanche.id]: http(),
    [fantom.id]: http(),
    [gnosis.id]: http(),
    [celo.id]: http(),
    [base.id]: http(),
  },
  ssr: true,
});

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={config}>
        <MiniKitWrapper>{children}</MiniKitWrapper>
      </WagmiProvider>
    </QueryClientProvider>
  );
}

function MiniKitWrapper({ children }: { children: ReactNode }) {
  const { data: walletClient } = useWalletClient();
  const [selectedChain, setSelectedChain] = useState(mainnet);

  const chainOptions = [
    { label: "Base", chain: base },
    { label: "Ethereum", chain: mainnet },
    { label: "Arbitrum", chain: arbitrum },
    { label: "Optimism", chain: optimism },
    { label: "Polygon", chain: polygon },
    { label: "Avalanche", chain: avalanche },
    { label: "Fantom", chain: fantom },
    { label: "Gnosis", chain: gnosis },
    { label: "Celo", chain: celo },
  ];

  useEffect(() => {
    if (walletClient) {
      const found = chainOptions.find((o) => o.chain.id === walletClient.chain.id);
      if (found) setSelectedChain(found.chain);
    }
  }, [walletClient]);

  return (
    <MiniKitProvider
      key={selectedChain.id}
      apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
      chain={selectedChain}
      config={{
        appearance: {
          mode: "auto",
          theme: "mini-app-theme",
          name: process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME,
          logo: process.env.NEXT_PUBLIC_ICON_URL,
        },
      }}
    >
      <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
    </MiniKitProvider>
  );
}
