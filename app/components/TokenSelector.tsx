'use client'

import React, { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
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
  [base.id]: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  [monadTestnet.id]: '0xf817257fed379853cde0fa4f97ab987181b1e5ea'
}

export default function TokenSelector({
  selected,
  onSelect,
  customAddress,
  onCustomAddressChange,
  chainId,
}: TokenSelectorProps) {
  const { address: walletAddress } = useAccount()

  // State for wallet-derived tokens & loading
  const [walletTokens, setWalletTokens] = useState<
    Array<{ symbol: string; token_address: string }>
  >([])
  const [loadingTokens, setLoadingTokens] = useState(false)
  // Toggle between “wallet tokens” vs. “manual address”
  const [useWalletTokens, setUseWalletTokens] = useState(true)

  // ETH label might change per chain (e.g. MON)
  const ethLabel = chainId === monadTestnet.id ? 'MON' : 'ETH'
  const hasUsdc = Boolean(USDC_ADDRESSES[chainId])
  const usdcAddress = USDC_ADDRESSES[chainId] ?? USDC_ADDRESSES[mainnet.id]!

  // Auto-fill USDC address when user picks USDC
  useEffect(() => {
    if (selected === 'USDC' && hasUsdc) {
      onCustomAddressChange(usdcAddress)
    }
  }, [selected, chainId])

  // Whenever Custom is selected *and* we're in wallet-tokens mode:
  // fetch your wallet's tokens once, with robust JSON handling
  useEffect(() => {
    if (selected !== 'CUSTOM' || !useWalletTokens || !walletAddress) return

    const loadTokens = async () => {
      setLoadingTokens(true)
      try {
        // convierte el chainId decimal a hex string (e.g. 8453 → "0x2105")
        const chainHex = `0x${chainId.toString(16)}`

        const res = await fetch(
          `/api/token-balances?wallet=${walletAddress}&chainId=${chainHex}`
        )
        if (!res.ok) {
          console.error(`Error fetching tokens: ${res.status} ${res.statusText}`)
          setWalletTokens([])
          return
        }

        const text = await res.text()
        let raw: any[] = []
        if (text) {
          try {
            raw = JSON.parse(text)
          } catch (e) {
            console.error('Failed to parse token-balances JSON:', e)
          }
        }

        const tokens = Array.isArray(raw)
          ? raw.map(t => ({
            symbol: t.symbol,
            token_address: t.token_address,
          }))
          : []
        setWalletTokens(tokens)
      } catch (err) {
        console.error('Fetch token-balances failed:', err)
        setWalletTokens([])
      } finally {
        setLoadingTokens(false)
      }
    }

    loadTokens()
  }, [selected, useWalletTokens, walletAddress, chainId])

  // Build the three main buttons exactly as before
  const options: TokenOption[] = hasUsdc
    ? ['ETH', 'USDC', 'CUSTOM']
    : ['ETH', 'CUSTOM']

  return (
    <>
      {/* === Original option buttons === */}
      <div className="flex space-x-2">
        {options.map(opt => {
          const label = opt === 'ETH'
            ? ethLabel
            : opt === 'USDC'
              ? 'USDC'
              : 'Other'

          return (
            <button
              key={opt}
              onClick={() => {
                onSelect(opt)
                // clear manual address when switching away
                if (opt !== 'CUSTOM') onCustomAddressChange('')
                setUseWalletTokens(true)
              }}
              className={`
                flex-1 py-3 rounded-lg text-center font-medium
                ${selected === opt ? 'bg-purple-600' : 'bg-[#1a1725]'}
                hover:bg-purple-500 transition
              `}
            >
              {label}
            </button>
          )
        })}
      </div>

      {/* === Custom sub-UI === */}
      {selected === 'CUSTOM' && (
        <div className="mt-2 space-y-2">
          {useWalletTokens ? (
            loadingTokens ? (
              <div className="p-4 bg-[#1a1725] rounded-lg text-center text-gray-400">
                Loading tokens…
              </div>
            ) : (
              <select
                className="w-full p-4 rounded-lg bg-[#1a1725] text-white text-base"
                value={customAddress}
                onChange={e => {
                  onCustomAddressChange(e.target.value)
                }}
              >
                <option value="">Select a token</option>
                {walletTokens.map(t => (
                  <option key={t.token_address} value={t.token_address}>
                    {t.symbol}
                  </option>
                ))}
              </select>
            )
          ) : (
            <input
              type="text"
              placeholder="Token Contract Address"
              className="w-full p-4 rounded-lg bg-[#1a1725] text-white text-center"
              value={customAddress}
              onChange={e => onCustomAddressChange(e.target.value)}
            />
          )}

          <button
            type="button"
            onClick={() => setUseWalletTokens(prev => !prev)}
            className="text-sm text-indigo-300 hover:text-indigo-100 transition"
          >
            {useWalletTokens
              ? 'Use custom address'
              : 'Select from wallet tokens'}
          </button>
        </div>
      )}
    </>
  )
}
