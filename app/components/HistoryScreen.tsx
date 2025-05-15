// src/components/HistoryScreen.tsx
'use client'

import React, { useEffect, useState } from 'react'
import { FiArrowLeft } from 'react-icons/fi'
import { useAccount } from 'wagmi'
import { fetchHistory, Tx } from '../services/contractService'

// WarpPay contract addresses
const WARPPAY_CONTRACT_BASE = process.env.NEXT_PUBLIC_WARPPAY_BASE_CONTRACT!
const WARPPAY_CONTRACT_MONAD = process.env.NEXT_PUBLIC_WARPPAY_MONAD_CONTRACT!

function getWarpPayContract(chainId: number): string | null {
  switch (chainId) {
    case 8453:
      return WARPPAY_CONTRACT_BASE.toLowerCase()
    case 10143:
      return WARPPAY_CONTRACT_MONAD.toLowerCase()
    default:
      return null
  }
}

interface HistoryScreenProps {
  address?: string
  onBack: () => void
}

export default function HistoryScreen({
  address,
  onBack,
}: HistoryScreenProps) {
  const { chain } = useAccount();
  const chainId = chain?.id ?? 0
  const warpPayAddress = getWarpPayContract(chainId)

  const [history, setHistory] = useState<Tx[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!address || chainId === 0) return

    setIsLoading(true)
    setError(null)
    fetchHistory(address, chain!)
      .then((txs) => {
        setHistory(txs)
      })
      .catch((err) => {
        console.error('Error fetching history', err)
        setError(
          err.message === 'NOTOK'
            ? 'Transaction history not available for this network'
            : err.message
        )
      })
      .finally(() => setIsLoading(false))
  }, [address, chainId])

  return (
    <div className="p-4 bg-[#0f0d14] min-h-screen flex flex-col text-white">
      <button
        onClick={onBack}
        className="mb-4 flex items-center text-purple-400 px-4 py-2 bg-[#1a1725] rounded-lg w-max"
      >
        <FiArrowLeft className="w-6 h-6 mr-2" /> Back
      </button>

      <h2 className="text-2xl font-bold mb-4">Transaction History</h2>

      {isLoading && (
        <p className="text-center text-gray-400">Loading transactions…</p>
      )}

      {error && (
        <p className="text-center text-red-500 mb-4">{error}</p>
      )}

      {!isLoading && !error && history.length === 0 && (
        <p className="text-center text-gray-500">No transactions found.</p>
      )}

      {!isLoading && history.length > 0 && (
        <ul className="space-y-3 overflow-auto flex-1">
          {history.map((tx, idx) => {
            // If the "to" or "summary" includes the WarpPay contract, mark it
            const isWarpPay =
              warpPayAddress != null &&
              (tx.hash.toLowerCase().includes(warpPayAddress) ||
                tx.summary.toLowerCase().includes(warpPayAddress))
            return (
              <li
                key={idx}
                className={`p-4 rounded-lg flex flex-col space-y-1 ${isWarpPay
                    ? 'bg-purple-700 border-l-4 border-purple-400'
                    : 'bg-[#1a1725]'
                  }`}
              >
                <div className="flex justify-between items-center">
                  <span
                    className={`text-sm font-semibold ${isWarpPay ? 'text-yellow-300' : 'text-white'
                      }`}
                  >
                    {isWarpPay ? 'WarpPay' : 'Standard'}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(tx.timestamp).toLocaleString()}
                  </span>
                </div>
                <p className="font-medium truncate">{tx.summary}</p>
                <p className="text-xs text-gray-400 truncate">
                  Hash: {tx.hash}
                </p>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
