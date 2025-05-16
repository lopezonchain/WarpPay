// src/components/TokenSelector.tsx
'use client'

import React, { useEffect } from 'react'
import {
  base,
  mainnet,
  arbitrum,
  optimism,
  polygon,
  polygonZkEvm,
  avalanche,
  fantom,
  gnosis,
  celo,
  bsc,
  zksync,
  scroll,
  linea,
  metis,
  dogechain,
  tron,
  aurora,
  moonbeam,
  neonMainnet,
  monadTestnet,
} from 'wagmi/chains'

export type TokenOption = 'ETH' | 'USDC' | 'CUSTOM'

interface TokenSelectorProps {
  selected: TokenOption
  onSelect: (t: TokenOption) => void
  customAddress: string
  onCustomAddressChange: (addr: string) => void
  chainId: number
}

// USDC contract per chain
const USDC_ADDRESSES: Record<number, string> = {
  [mainnet.id]: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  [base.id]:    '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  // …otros…
}

export default function TokenSelector({
  selected,
  onSelect,
  customAddress,
  onCustomAddressChange,
  chainId,
}: TokenSelectorProps) {
  // ¿Cadena 10143? entonces “ETH” será “MON”
  const ethLabel = chainId === 10143 ? 'MON' : 'ETH'

  // ¿Soporta USDC en esta red?
  const hasUsdc = USDC_ADDRESSES[chainId] !== undefined
  const usdcAddress = USDC_ADDRESSES[chainId] ?? USDC_ADDRESSES[mainnet.id]!

  // Al seleccionar USDC, auto‐llenamos la dirección
  useEffect(() => {
    if (selected === 'USDC' && hasUsdc) {
      onCustomAddressChange(usdcAddress)
    }
  }, [selected, chainId, hasUsdc, usdcAddress, onCustomAddressChange])

  // Qué opciones mostramos
  const options: TokenOption[] = hasUsdc
    ? ['ETH', 'USDC', 'CUSTOM']
    : ['ETH', 'CUSTOM']

  return (
    <>
      <div className="flex space-x-2">
        {options.map((opt) => {
          // Etiqueta a mostrar: ETH → ethLabel, CUSTOM → “Other”, USDC → “USDC”
          const label =
            opt === 'ETH'
              ? ethLabel
              : opt === 'CUSTOM'
              ? 'Other'
              : 'USDC'

          return (
            <button
              key={opt}
              onClick={() => {
                onSelect(opt)
                // al elegir ETH o CUSTOM, limpiamos customAddress
                if (opt === 'ETH' || opt === 'CUSTOM') {
                  onCustomAddressChange('')
                }
              }}
              className={`flex-1 py-3 rounded-lg text-center font-medium
                ${selected === opt ? 'bg-purple-600' : 'bg-[#1a1725]'}
                hover:bg-purple-500 transition`}
            >
              {label}
            </button>
          )
        })}
      </div>

      {selected === 'CUSTOM' && (
        <input
          type="text"
          placeholder="Token Contract Address"
          className="w-full p-4 mt-2 rounded-lg bg-[#1a1725] text-white text-center"
          value={customAddress}
          onChange={(e) => onCustomAddressChange(e.target.value)}
        />
      )}
    </>
  )
}
