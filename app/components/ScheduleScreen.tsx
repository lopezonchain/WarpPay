'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { FiArrowLeft } from 'react-icons/fi'
import AlertModal from './AlertModal'
import TokenSelector, { TokenOption } from './TokenSelector'
import { useWalletClient, usePublicClient } from 'wagmi'
import { parseEther, parseUnits } from 'viem'
import contractAbi from '../services/contractAbi.json'
import { getWarpPayContract, resolveRecipient } from '../services/contractService'
import { scheduleCyclicPayment, schedulePayment, cancelActivePayment, cancelCyclicPayment } from '../services/contractService'
import type { ScheduledPayment } from '../services/contractService'
import SuccessModal from './SuccessModal'
import { useAddFrame } from '@coinbase/onchainkit/minikit'

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
  const [minDateTime, setMinDateTime] = useState('')

  const [intervalValue, setIntervalValue] = useState<string>('')
  const [intervalUnit, setIntervalUnit] = useState<'days' | 'hours' | 'weeks'>('days')
  const [repetitions, setRepetitions] = useState<string>('1')

  // Management state
  const [statusFilter, setStatusFilter] = useState<Status>(0)
  const [payments, setPayments] = useState<ScheduledPayment[]>([])
  const [offset, setOffset] = useState(0)
  const limit = 10

  const [showSuccess, setShowSuccess] = useState(false);

  // Hook para añadir miniapp
  const addFrame = useAddFrame();
  const handleAddFrame = useCallback(async () => {
    await addFrame();
  }, [addFrame]);

  // Handler para compartir en Warpcast vía URL
  const handleShare = useCallback(() => {
    const text = `I've just created a scheduled transfer with WarpPay!! The all-in-one payments miniapp by @lopezonchain.eth 🚀 Send anything, anywhere to anyone just with a farcaster name or ENS, create request links, airdrops, or even EARN! https://warpcast.com/miniapps/V0727cQCBnfX/warppay- `;
    const url = `https://warpcast.com/~/compose?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  }, []);

  // Detect chainId
  useEffect(() => {
    publicClient?.getChainId().then(id => setChainId(id))
  }, [publicClient])

  // Set minimum datetime-local to "now"
  useEffect(() => {
    setMinDateTime(new Date().toISOString().slice(0, 16))
  }, [])

  // Fetch schedules when in Manage tab or filters change
  useEffect(() => {
    if (tab !== 'manage' || !walletClient || !publicClient) return;
    (async () => {
      try {
        const raw = await publicClient.readContract({
          address: getWarpPayContract(chainId),
          abi: contractAbi,
          functionName: 'getPaymentsByStatus',
          args: [statusFilter, BigInt(offset), BigInt(limit)],
        }) as ScheduledPayment[];

        // empacamos con su id real = offset + posición
        const withIds = raw.map((p, i) => ({
          ...p,
          _id: BigInt(offset + i),
        }));

        setPayments(withIds);
      } catch (e) {
        console.error('Error fetching payments', e);
        setModalMessage('Failed to load scheduled payments');
      }
    })();
  }, [tab, statusFilter, offset, walletClient, publicClient, chainId]);

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

  // Convert interval+unit to seconds
  function getIntervalSeconds() {
    const val = Number(intervalValue)
    if (isNaN(val) || val <= 0) return 0
    switch (intervalUnit) {
      case 'hours':
        return val * 3600
      case 'weeks':
        return val * 7 * 24 * 3600
      default:
        return val * 24 * 3600
    }
  }

  // Handle schedule creation
  const handleCreate = async () => {
    if (!walletClient || !publicClient) {
      setModalMessage('Please connect your wallet')
      return
    }
    if (!recipient || !amount || !executeTime) {
      setModalMessage('Please fill recipient, amount and date/time')
      return
    }

    try {
      setModalMessage('Resolving recipient…')
      const to = recipient.startsWith('0x')
        ? (recipient as `0x${string}`)
        : await resolveRecipient(recipient)

      setModalMessage('Preparing transaction…')
      const baseAmount = await parseAmount(amount)
      const execTs = Math.floor(new Date(executeTime).getTime() / 1000)

      let tx
      if (isCyclic) {
        const secs = getIntervalSeconds()
        if (!secs || !repetitions) {
          setModalMessage('Please fill a valid interval and repetitions')
          return
        }
        tx = await scheduleCyclicPayment(
          walletClient,
          publicClient,
          to,
          baseAmount,
          tokenAddress,
          secs,
          execTs,
          Number(repetitions),
        )
      } else {
        tx = await schedulePayment(
          walletClient,
          publicClient,
          to,
          baseAmount,
          tokenAddress,
          execTs,
        )
      }

      setModalMessage(null);
      setShowSuccess(true);
      // reset form
      setRecipient('')
      setAmount('')
      setExecuteTime('')
      setIntervalValue('')
      setIntervalUnit('days')
      setRepetitions('1')
    } catch (err: any) {
      console.error(err)
      setModalMessage(`Error: ${err.message || err}`)
    }
  }

  // Handle schedule cancellation
  const handleCancel = async (id: bigint, cyclicId: bigint) => {
    if (!walletClient) return;
    try {
      setModalMessage('Cancelling schedule…');

      let tx;
      if (cyclicId !== BigInt(0)) {
        tx = await cancelCyclicPayment(walletClient, cyclicId);
      } else {
        tx = await cancelActivePayment(walletClient, id);
      }

      setModalMessage(`Schedule cancelled: ${tx.hash}`);
      // refetch
      const refreshed = await publicClient?.readContract({
        address: getWarpPayContract(chainId),
        abi: contractAbi,
        functionName: 'getPaymentsByStatus',
        args: [statusFilter, BigInt(offset), BigInt(limit)],
      }) as ScheduledPayment[];
      setPayments(refreshed);
    } catch (e: any) {
      console.error('Error cancelling', e);
      setModalMessage(`Error cancelling: ${e.message}`);
    }
  };

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
    <div className="p-4 text-white bg-[#0f0d14] flex flex-col">
      <button
        onClick={onBack}
        className="mb-4 flex items-center justify-center text-purple-400 text-lg px-4 py-2 bg-[#1a1725] rounded-lg max-w-[200px]"
      >
        <FiArrowLeft className="w-6 h-6 mr-2" /> Back
      </button>
      <h2 className="text-2xl font-bold mb-6 mx-auto">Scheduler</h2>

      {/* Main Tabs */}
      <div className="flex space-x-4 mb-8">
        <button
          onClick={() => setTab('create')}
          className={`px-5 py-2 rounded-xl font-medium ${tab === 'create' ? 'bg-purple-600' : 'bg-[#1a1725]'
            }`}
        >
          Create
        </button>
        <button
          onClick={() => setTab('manage')}
          className={`px-5 py-2 rounded-xl font-medium ${tab === 'manage' ? 'bg-purple-600' : 'bg-[#1a1725]'
            }`}
        >
          Manage
        </button>
      </div>

      {tab === 'create' ? (
        <div className="flex-1 space-y-6">
          {/* One-Time / Cyclic Toggle */}
          <div className="flex space-x-2">
            <button
              onClick={() => setIsCyclic(false)}
              className={`flex-1 py-2 rounded-lg ${!isCyclic ? 'bg-purple-500' : 'bg-[#1a1725]'
                }`}
            >
              One-Time
            </button>
            <button
              onClick={() => setIsCyclic(true)}
              className={`flex-1 py-2 rounded-lg ${isCyclic ? 'bg-purple-500' : 'bg-[#1a1725]'
                }`}
            >
              Cyclic
            </button>
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-medium">Recipient</label>
            <input
              type="text"
              value={recipient}
              onChange={e => setRecipient(e.target.value)}
              className="w-full p-3 rounded-lg bg-[#1a1725] placeholder-gray-500 text-center"
              placeholder="Farcaster user, ENS, wallet"
            />
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-medium">Amount</label>
            <input
              type="text"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full p-3 rounded-lg bg-[#1a1725] placeholder-gray-500 text-center"
              placeholder="e.g. 0.5"
            />
          </div>

          <TokenSelector
            selected={tokenOption}
            onSelect={setTokenOption}
            customAddress={customAddress}
            onCustomAddressChange={setCustomAddress}
            chainId={chainId}
          />

          <div className="space-y-4">
            <label className="block text-sm font-medium">Execute Time</label>
            <input
              type="datetime-local"
              min={minDateTime}
              value={executeTime}
              onChange={e => setExecuteTime(e.target.value)}
              className="w-full p-3 rounded-lg bg-[#1a1725] text-center"
            />
          </div>

          {isCyclic && (
            <>
              <div className="space-y-2">
                <label className="block text-sm font-medium">
                  Interval
                </label>
                <input
                  type="number"
                  min="1"
                  value={intervalValue}
                  onChange={e => setIntervalValue(e.target.value)}
                  className="w-full p-3 rounded-lg bg-[#1a1725] text-center"
                  placeholder="Enter number"
                />
                <div className="flex space-x-2 mt-2">
                  {(['days', 'hours', 'weeks'] as const).map(u => (
                    <button
                      key={u}
                      onClick={() => setIntervalUnit(u)}
                      className={`flex-1 py-2 rounded-lg text-sm ${intervalUnit === u ? 'bg-purple-500' : 'bg-[#1a1725]'
                        }`}
                    >
                      {u.charAt(0).toUpperCase() + u.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium">Repetitions</label>
                <input
                  type="number"
                  min="1"
                  value={repetitions}
                  onChange={e => setRepetitions(e.target.value)}
                  className="w-full p-3 rounded-lg bg-[#1a1725] text-center"
                />
              </div>
            </>
          )}

          <button
            onClick={handleCreate}
            className="mt-6 w-full py-4 bg-purple-600 hover:bg-purple-700 rounded-xl text-lg font-bold transition"
          >
            {isCyclic ? 'Schedule Cyclic' : 'Schedule One-Time'}
          </button>
        </div>
      ) : (
        <>
          {/* Status Filter */}
          <div className="flex flex-wrap gap-1 mb-6">
            {([0, 1, 2] as Status[]).map(s => (
              <button
                key={s}
                onClick={() => { setStatusFilter(s); setOffset(0) }}
                className={`px-2 py-1 rounded-full font-medium transition ${statusFilter === s
                    ? 'bg-purple-500 hover:bg-purple-400'
                    : 'bg-[#1a1725] hover:bg-[#2a2635]'
                  }`}
              >
                {s === 0 ? 'Pending' : s === 1 ? 'Executed' : 'Failed'}
              </button>
            ))}
          </div>

          {visiblePayments.length === 0 ? (
            <p className="text-center text-gray-500 mt-12">No schedules found</p>
          ) : (
            <div className="flex flex-col items-start space-y-6 overflow-auto">
              {visiblePayments.map(p => {
                const id = p._id!;
                const dateStr = new Date(Number(p.executeTime) * 1000).toLocaleString()
                const amountEth = (Number(p.value) / 1e18).toLocaleString(undefined, {
                  minimumFractionDigits: 4,
                  maximumFractionDigits: 4
                })
                const status = p.isExecuted ? 'Executed' : p.isFailed ? 'Failed' : 'Pending'
                const shortAddr = `${p.recipient.slice(0, 6)}…${p.recipient.slice(-4)}`

                return (
                  <div
                    key={id}
                    className="w-full max-w-sm p-5 bg-gradient-to-br from-gray-800 to-gray-900 ring-1 ring-gray-700 rounded-2xl shadow-md hover:ring-purple-600 transition-all flex flex-col"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <span title={p.recipient} className="text-sm font-medium text-gray-300">
                        Recipient: {shortAddr}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${status === 'Pending'
                          ? 'bg-yellow-500'
                          : status === 'Executed'
                            ? 'bg-green-500'
                            : 'bg-red-500'
                        }`}>
                        {status}
                      </span>
                    </div>

                    <dl className="flex-1 space-y-3 text-sm">
                      <div>
                        <dt className="text-gray-400">Date</dt>
                        <dd className="text-white">{dateStr}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-400">Amount</dt>
                        <dd className="text-white">{amountEth} ETH</dd>
                      </div>
                    </dl>

                    {statusFilter === 0 && (
                      <button
                        onClick={() => handleCancel(id, p.cyclicId)}
                        className="mt-6 w-full py-2 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Pagination (solo si hay más de 5 resultados) */}
          {visiblePayments.length > 5 && (
            <div className="flex justify-between items-center mt-8">
              <button
                onClick={() => setOffset(o => Math.max(0, o - limit))}
                disabled={offset === 0}
                className="px-4 py-2 rounded-lg bg-[#1a1725] hover:bg-[#2a2438] disabled:opacity-50 transition"
              >
                Prev
              </button>
              <button
                onClick={() => setOffset(o => o + limit)}
                className="px-4 py-2 rounded-lg bg-[#1a1725] hover:bg-[#2a2438] transition"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {modalMessage && <AlertModal message={modalMessage} onClose={() => setModalMessage(null)} />}
      {/* Modal de éxito en la parte baja */}
      {showSuccess && (
        <SuccessModal
          onClose={() => setShowSuccess(false)}
          onShare={handleShare}
          onAdd={handleAddFrame}
        />
      )}
    </div>
  )
}