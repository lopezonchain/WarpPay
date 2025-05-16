'use client'

import React, { useEffect, useState } from 'react'
import { FiChevronDown } from 'react-icons/fi'
import { useAccount } from 'wagmi'
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react'
import {
  base,
  mainnet,
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
  [mainnet.id]:    '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  [base.id]:       '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  [monadTestnet.id]:'0xf817257fed379853cde0fa4f97ab987181b1e5ea',
}

export default function TokenSelector({
  selected,
  onSelect,
  customAddress,
  onCustomAddressChange,
  chainId,
}: TokenSelectorProps) {
  const { address: walletAddress } = useAccount()

  const [walletTokens, setWalletTokens] = useState<
    Array<{ symbol: string; name: string; token_address: string }>
  >([])
  const [loadingTokens, setLoadingTokens] = useState(false)
  const [useWalletTokens, setUseWalletTokens] = useState(true)

  const ethLabel = chainId === monadTestnet.id ? 'MON' : 'ETH'
  const hasUsdc = Boolean(USDC_ADDRESSES[chainId])
  const usdcAddress = USDC_ADDRESSES[chainId] ?? USDC_ADDRESSES[mainnet.id]!

  // Auto‐fill USDC address
  useEffect(() => {
    if (selected === 'USDC' && hasUsdc) {
      onCustomAddressChange(usdcAddress)
    }
  }, [selected, chainId])

  // Fetch wallet tokens when CUSTOM + useWalletTokens
  useEffect(() => {
    if (selected !== 'CUSTOM' || !useWalletTokens || !walletAddress) return

    const loadTokens = async () => {
      setLoadingTokens(true)
      try {
        const chainHex = `0x${chainId.toString(16)}`
        const res = await fetch(
          `/api/token-balances?wallet=${walletAddress}&chainId=${chainHex}`
        )
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
        const raw = await res.json()
        if (Array.isArray(raw)) {
          setWalletTokens(
            raw.map((t: any) => ({
              symbol: t.symbol,
              name: t.name,
              token_address: t.token_address,
            }))
          )
        } else {
          setWalletTokens([])
        }
      } catch (err) {
        console.error('Fetch token-balances failed:', err)
        setWalletTokens([])
      } finally {
        setLoadingTokens(false)
      }
    }

    loadTokens()
  }, [selected, useWalletTokens, walletAddress, chainId])

  const options: TokenOption[] = hasUsdc
    ? ['ETH', 'USDC', 'CUSTOM']
    : ['ETH', 'CUSTOM']

  return (
    <>
      {/* ETH / USDC / Other buttons */}
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

      {/* Custom token UI */}
      {selected === 'CUSTOM' && (
        <div className="mt-4 space-y-2">
          {useWalletTokens ? (
            loadingTokens ? (
              <div className="p-4 bg-[#1a1725] rounded-lg text-center text-gray-400">
                Loading tokens…
              </div>
            ) : (
              <div className="relative w-full max-w-md mx-auto">
                <Listbox
                  value={customAddress}
                  onChange={onCustomAddressChange}
                >
                  <ListboxButton className="
                    w-full flex items-center justify-center
                    bg-[#1a1725] text-white text-lg
                    py-4 px-6 rounded-lg appearance-none
                    focus:outline-none focus:ring-2 focus:ring-indigo-500
                    transition
                  ">
                    <span className="truncate">
                      {walletTokens.find(t => t.token_address === customAddress)
                        ? `${walletTokens.find(t => t.token_address === customAddress)!.symbol}`
                        : 'Select a token'}
                    </span>
                    <FiChevronDown className="text-gray-400 ml-10" />
                  </ListboxButton>

                  <ListboxOptions className="
                    absolute z-10 mt-1 w-full max-h-64
                    overflow-auto rounded-lg bg-[#1a1725]
                    py-1
                  ">
                    {walletTokens.map(t => (
                      <ListboxOption
                        key={t.token_address}
                        value={t.token_address}
                        className={({ active, selected }) =>
                          `cursor-pointer select-none transition
                           ${active ? 'bg-indigo-600' : 'bg-[#1a1725]'}`
                        }
                      >
                        <div className="px-6 py-4 flex flex-col">
                          <span className="text-lg text-white">
                            {t.symbol}
                          </span>
                          <span className="text-sm text-gray-400">
                            {t.name}
                          </span>
                        </div>
                      </ListboxOption>
                    ))}
                  </ListboxOptions>
                </Listbox>
              </div>
            )
          ) : (
            <input
              type="text"
              placeholder="Token Contract Address"
              className="w-full p-4 rounded-lg bg-[#1a1725] text-white text-center text-lg"
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
