// src/components/ScheduleScreen.tsx
'use client'

import React, { useEffect, useState } from 'react'
import { FiArrowLeft } from 'react-icons/fi'
import AlertModal from './AlertModal'
import TokenSelector, { TokenOption } from './TokenSelector'
import { useWalletClient, usePublicClient } from 'wagmi'
import { parseEther, parseUnits, encodeFunctionData } from 'viem'
import contractAbi from '../services/contractAbi.json'
import { getWarpPayContract } from '../services/contractService'
import { resolveEnsName } from '../services/ensResolver'
import type { ScheduledPayment } from '../services/contractService'

type Tab = 'create' | 'manage'
type Status = 0 | 1 | 2 // 0 = pending, 1 = executed, 2 = failed
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

export default function ScheduleScreen({ onBack }: { onBack: () => void }) {
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()
  const [chainId, setChainId] = useState<number>(0)

  const [tab, setTab] = useState<Tab>('create')
  const [modalMessage, setModalMessage] = useState<string | null>(null)

  // Creation form state
  const [isCyclic, setIsCyclic] = useState(false)
  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')
  const [tokenOption, setTokenOption] = useState<TokenOption>('ETH')
  const [customAddress, setCustomAddress] = useState('')
  const tokenAddress = tokenOption === 'ETH' ? null : (customAddress as `0x${string}`)
  const [executeTime, setExecuteTime] = useState<string>('')
  const [intervalSec, setIntervalSec] = useState<string>('')
  const [repetitions, setRepetitions] = useState<string>('1')

  // Management state
  const [statusFilter, setStatusFilter] = useState<Status>(0)
  const [payments, setPayments] = useState<ScheduledPayment[]>([])
  const [offset, setOffset] = useState(0)
  const limit = 10

  // Detect chainId
  useEffect(() => {
    publicClient?.getChainId().then(id => setChainId(id))
  }, [publicClient])

  // Fetch schedules when in Manage tab or filters change
  useEffect(() => {
    if (tab !== 'manage' || !walletClient || !publicClient) return
    ;(async () => {
      try {
        const list = await publicClient.readContract({
          address: getWarpPayContract(chainId),
          abi: contractAbi,
          functionName: 'getPaymentsByStatus',
          args: [statusFilter, BigInt(offset), BigInt(limit)],
        })
        setPayments(list as ScheduledPayment[])
      } catch (e) {
        console.error('Error fetching payments', e)
        setModalMessage('Failed to load scheduled payments')
      }
    })()
  }, [tab, statusFilter, offset, walletClient, publicClient, chainId])

  // Parse user-entered amount
  async function parseAmount(amt: string) {
    if (tokenOption === 'ETH') return parseEther(amt)
    const decimals = (await publicClient?.readContract({
      address: tokenAddress!,
      abi: [
        {
          type: 'function',
          name: 'decimals',
          stateMutability: 'view',
          inputs: [],
          outputs: [{ internalType: 'uint8', name: '', type: 'uint8' }],
        },
      ],
      functionName: 'decimals',
    })) as number
    return parseUnits(amt, decimals)
  }

  // Handle schedule creation
  const handleCreate = async () => {
    if (!walletClient || !publicClient) {
      setModalMessage('Please connect your wallet')
      return
    }
    if (!recipient || !amount || !executeTime) {
      setModalMessage('Please fill recipient, amount, and date/time')
      return
    }

    try {
      setModalMessage('Resolving recipient…')
      const toAddress: `0x${string}` = recipient.startsWith('0x')
        ? (recipient as `0x${string}`)
        : await resolveEnsName(recipient)

      setModalMessage('Preparing transaction…')
      const baseAmount = await parseAmount(amount)
      const taxedAmount = (baseAmount * BigInt(103)) / BigInt(100) // +3%
      const execTs = BigInt(Math.floor(new Date(executeTime).getTime() / 1000))
      const warpContract = getWarpPayContract(chainId)

      let data: `0x${string}`
      let overrides: any = {}

      if (isCyclic) {
        if (!intervalSec || !repetitions) {
          setModalMessage('Please fill interval and repetitions')
          return
        }
        data = encodeFunctionData({
          abi: contractAbi,
          functionName: 'scheduleCyclicPayment',
          args: [
            toAddress,
            baseAmount,
            tokenAddress ?? ZERO_ADDRESS,
            BigInt(Number(intervalSec)),
            execTs,
            BigInt(Number(repetitions)),
          ],
        })
        overrides = { value: taxedAmount }
      } else {
        data = encodeFunctionData({
          abi: contractAbi,
          functionName: 'schedulePayment',
          args: [
            toAddress,
            baseAmount,
            tokenAddress ?? ZERO_ADDRESS,
            execTs,
          ],
        })
        overrides = { value: taxedAmount }
      }

      const txHash = await walletClient.sendTransaction({
        to: warpContract,
        data,
        ...overrides,
      })

      setModalMessage(`Transaction submitted: ${txHash}`)
      // Reset form
      setRecipient('')
      setAmount('')
      setExecuteTime('')
      setIntervalSec('')
      setRepetitions('1')
    } catch (err: any) {
      console.error('Error creating schedule', err)
      setModalMessage(`Error: ${err.message}`)
    }
  }

  // Handle schedule cancellation
  const handleCancel = async (item: ScheduledPayment) => {
    if (!walletClient) return
    try {
      setModalMessage('Cancelling schedule…')
      const fn =
        item.cyclicId !== BigInt(0)
          ? 'cancelCyclicPayment'
          : 'cancelActivePayment'
      const args = [
        item.cyclicId !== BigInt(0) ? item.cyclicId : item.executeTime,
      ]
      const data = encodeFunctionData({
        abi: contractAbi,
        functionName: fn,
        args,
      })
      const tx = await walletClient.sendTransaction({
        to: getWarpPayContract(chainId),
        data,
      })
      setModalMessage(`Schedule cancelled: ${tx}`)
      // Refetch
      const refreshed = (await publicClient.readContract({
        address: getWarpPayContract(chainId),
        abi: contractAbi,
        functionName: 'getPaymentsByStatus',
        args: [statusFilter, BigInt(offset), BigInt(limit)],
      })) as ScheduledPayment[]
      setPayments(refreshed)
    } catch (e: any) {
      console.error('Error cancelling', e)
      setModalMessage(`Error cancelling: ${e.message}`)
    }
  }

  // Unsupported network message
  if (chainId && chainId !== 8453 && chainId !== 10143) {
    return (
      <div className="p-4 text-white bg-[#0f0d14] min-h-screen">
        <button onClick={onBack} className="flex items-center text-purple-400 mb-4">
          <FiArrowLeft className="mr-2" /> Back
        </button>
        <p>This feature works only on Base or Monad Testnet</p>
      </div>
    )
  }

  // Hide pending with zero-address
  const visiblePayments = payments.filter(
    p => !(statusFilter === 0 && p.recipient === ZERO_ADDRESS)
  )

  return (
    <div className="p-4 text-white bg-[#0f0d14] min-h-screen flex flex-col">
      <button onClick={onBack} className="flex items-center text-purple-400 mb-4">
        <FiArrowLeft className="mr-2" /> Back
      </button>
      <h2 className="text-2xl font-bold mb-4">Scheduler</h2>

      {/* Tabs */}
      <div className="flex space-x-2 mb-6">
        <button
          onClick={() => setTab('create')}
          className={`px-4 py-2 rounded-lg ${
            tab === 'create' ? 'bg-purple-600' : 'bg-[#1a1725]'
          }`}
        >
          Create
        </button>
        <button
          onClick={() => setTab('manage')}
          className={`px-4 py-2 rounded-lg ${
            tab === 'manage' ? 'bg-purple-600' : 'bg-[#1a1725]'
          }`}
        >
          Manage
        </button>
      </div>

      {tab === 'create' ? (
        <div className="space-y-4 flex-1">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={isCyclic}
              onChange={() => setIsCyclic(!isCyclic)}
            />
            <span>Cyclic?</span>
          </label>

          <div className="space-y-2">
            <label className="block text-sm font-medium">Recipient (address or ENS)</label>
            <input
              type="text"
              value={recipient}
              onChange={e => setRecipient(e.target.value)}
              className="w-full p-2 rounded bg-[#1a1725]"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">Amount</label>
            <input
              type="text"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full p-2 rounded bg-[#1a1725]"
            />
          </div>

          <TokenSelector
            selected={tokenOption}
            onSelect={setTokenOption}
            customAddress={customAddress}
            onCustomAddressChange={setCustomAddress}
            chainId={chainId}
          />

          <div className="space-y-2">
            <label className="block text-sm font-medium">Execute Time</label>
            <input
              type="datetime-local"
              value={executeTime}
              onChange={e => setExecuteTime(e.target.value)}
              className="w-full p-2 rounded bg-[#1a1725]"
            />
          </div>

          {isCyclic && (
            <>
              <div className="space-y-2">
                <label className="block text-sm font-medium">Interval (seconds)</label>
                <input
                  type="number"
                  value={intervalSec}
                  onChange={e => setIntervalSec(e.target.value)}
                  className="w-full p-2 rounded bg-[#1a1725]"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium">Repetitions</label>
                <input
                  type="number"
                  value={repetitions}
                  onChange={e => setRepetitions(e.target.value)}
                  className="w-full p-2 rounded bg-[#1a1725]"
                />
              </div>
            </>
          )}

          <button
            onClick={handleCreate}
            className="mt-4 w-full py-3 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-bold"
          >
            {isCyclic ? 'Schedule Cyclic' : 'Schedule One-Time'}
          </button>
        </div>
      ) : (
        <div className="flex-1">
          <div className="flex flex-wrap gap-2 mb-4">
            {([0, 1, 2] as Status[]).map(s => (
              <button
                key={s}
                onClick={() => {
                  setStatusFilter(s)
                  setOffset(0)
                }}
                className={`px-3 py-1 rounded-full text-sm ${
                  statusFilter === s ? 'bg-purple-600' : 'bg-[#1a1725]'
                }`}
              >
                {s === 0 ? 'Pending' : s === 1 ? 'Executed' : 'Failed'}
              </button>
            ))}
          </div>

          {visiblePayments.length === 0 ? (
            <p className="text-center text-gray-500">No schedules found</p>
          ) : (
            <div className="flex flex-col">
              {visiblePayments.map((p, i) => (
                <div
                  key={i}
                  className="p-4 bg-[#1a1725] rounded-2xl shadow-md flex flex-col justify-between "
                >
                  <div className="space-y-1">
                    <p>
                      <span className="font-semibold">To:</span> {p.recipient}
                    </p>
                    <p>
                      <span className="font-semibold">At:</span>{' '}
                      {new Date(Number(p.executeTime) * 1000).toLocaleString()}
                    </p>
                    <p>
                      <span className="font-semibold">Amount:</span> {p.value.toString()}
                    </p>
                    <p>
                      <span className="font-semibold">Status:</span>{' '}
                      {p.isExecuted ? 'Done' : p.isFailed ? 'Failed' : 'Pending'}
                    </p>
                  </div>
                  {statusFilter === 0 && (
                    <button
                      onClick={() => handleCancel(p)}
                      className="mt-4 self-end px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          <div className="flex justify-between mt-6">
            <button
              onClick={() => setOffset(o => Math.max(0, o - limit))}
              disabled={offset === 0}
              className="px-3 py-1 bg-[#1a1725] rounded-lg disabled:opacity-50"
            >
              Prev
            </button>
            <button
              onClick={() => setOffset(o => o + limit)}
              className="px-3 py-1 bg-[#1a1725] rounded-lg"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {modalMessage && <AlertModal message={modalMessage} onClose={() => setModalMessage(null)} />}
    </div>
  )
}
