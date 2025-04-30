"use client";

import React, { ReactNode, Suspense, useEffect, useState } from "react";
import { WagmiProvider, createConfig, http } from "wagmi";
import {
  base,               // Base
  mainnet,            // Ethereum
  arbitrum,           // Arbitrum One
  sonic,              // Sonic
  abstract,           // Abstract
  optimism,           // Optimism
  polygon,            // Polygon PoS
  avalanche,          // Avalanche C-Chain
  fantom,             // Fantom Opera
  gnosis,             // Gnosis Chain
  celo,               // Celo Mainnet
  bsc,                // Binance Smart Chain
  polygonZkEvm,       // Polygon zkEVM
  zksync,             // zkSync (L2)
  scroll,             // Scroll L2
  linea,              // Linea
  metis,              // Metis Andromeda
  dogechain,          // Dogechain
  tron,               // TRON EVM
  aurora,             // NEAR Aurora
  moonbeam,           // Moonbeam
  neonMainnet,        // Neon EVM (Solana)
} from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MiniKitProvider } from "@coinbase/onchainkit/minikit";
import { useWalletClient } from "wagmi";

// 1️⃣ Crear QueryClient para React Query
const queryClient = new QueryClient();

// 2️⃣ Crear wagmi config con todas las chains importadas
const chains = [
  base,
  mainnet,
  arbitrum,
  sonic,
  abstract,
  optimism,
  polygon,
  avalanche,
  fantom,
  gnosis,
  celo,
  bsc,
  polygonZkEvm,
  zksync,
  scroll,
  linea,
  metis,
  dogechain,
  tron,
  aurora,
  moonbeam,
  neonMainnet,
];

const transports = Object.fromEntries(
  chains.map((chain) => [chain.id, http({ url: chain.rpcUrls.default.http[0] })])
);

const config = createConfig({
  chains,
  transports,
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
  const [selectedChain, setSelectedChain] = useState<ChainType>(mainnet);

  const chainOptions: { label: string; chain: ChainType }[] = [
    { label: "Base", chain: base },
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
    { label: "Scroll", chain: scroll },
    { label: "Linea", chain: linea },
    { label: "Metis", chain: metis },
    { label: "Dogechain", chain: dogechain },
    { label: "Tron", chain: tron },
    { label: "Aurora", chain: aurora },
    { label: "Moonbeam", chain: moonbeam },
    { label: "Neon EVM", chain: neonMainnet },
  ];

  useEffect(() => {
    if (walletClient) {
      const found = chainOptions.find((o) => o.chain.id === walletClient.chain.id);
      if (found) {
        setSelectedChain(found.chain);
      }
    }
  }, [walletClient]);

  return (
    <MiniKitProvider
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
