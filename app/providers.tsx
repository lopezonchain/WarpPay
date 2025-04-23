// src/components/Providers.tsx
"use client";

import React, { useState, createContext, useContext, ReactNode, Suspense } from 'react';
import { MiniKitProvider } from '@coinbase/onchainkit/minikit';
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
} from 'wagmi/chains';

interface ChainOption {
  label: string;
  chain: any;
}

interface ChainContextType {
  chain: any;
  setChain: (c: any) => void;
  options: ChainOption[];
}

// Context para exponer chain y setChain
const ChainContext = createContext<ChainContextType | undefined>(undefined);
export function useChain() {
  const ctx = useContext(ChainContext);
  if (!ctx) throw new Error('useChain must be used within Providers');
  return ctx;
}

export function Providers({ children }: { children: ReactNode }) {
  // Lista de mainnets disponibles
  const options: ChainOption[] = [
    { label: 'Base', chain: base },
    { label: 'Ethereum', chain: mainnet },
    { label: 'Arbitrum', chain: arbitrum },
    { label: 'Optimism', chain: optimism },
    { label: 'Polygon', chain: polygon },
    { label: 'Avalanche', chain: avalanche },
    { label: 'Fantom', chain: fantom },
    { label: 'Gnosis', chain: gnosis },
    { label: 'Celo', chain: celo }
  ];

  // Estado de la red activa
  const [chain, setChain] = useState<any>(options[0].chain);

  return (
      <ChainContext.Provider value={{ chain, setChain, options }}>
        <MiniKitProvider
          apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
          chain={chain}
          config={{
            appearance: {
              mode: 'auto',
              theme: 'mini-app-theme',
              name: process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME,
              logo: process.env.NEXT_PUBLIC_ICON_URL,
            },
          }}
        >
          <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
        </MiniKitProvider>
      </ChainContext.Provider>

  );
}
