'use client'

import React, { useEffect, useState } from 'react'
import { FiArrowLeft } from 'react-icons/fi'
import AlertModal from './AlertModal'
import { useWalletClient, usePublicClient } from 'wagmi'
import { getWarpPayContract, executeSinglePayment } from '../services/contractService'
import contractAbi from '../services/contractAbi.json'
import type { ScheduledPayment } from '../services/contractService'

export default function EarnScreen({ onBack }: { onBack: () => void }) {
    const { data: walletClient } = useWalletClient()
    const publicClient = usePublicClient()
    const [chainId, setChainId] = useState<number>(0)

    const [due, setDue] = useState<ScheduledPayment | null>(null)
    const [overdueTime, setOverdueTime] = useState<number>(0)
    const [rewardEth, setRewardEth] = useState<string>('0.0000')
    const [modalMessage, setModalMessage] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    // Detect chain
    useEffect(() => {
        publicClient?.getChainId().then(setChainId)
    }, [publicClient])

    // Load the oldest due payment
    const loadDue = async () => {
        if (!publicClient || !chainId) return
        try {
            const warp = getWarpPayContract(chainId)

            // 1) Trae índices y tiempos de overdue
            const [indexes, overdueTimes] = (await publicClient.readContract({
                address: warp,
                abi: contractAbi,
                functionName: 'getDuePayments',
                args: []
            })) as [bigint[], bigint[]]

            if (indexes.length === 0) {
                setDue(null)
                return
            }

            const idx = indexes[0]
            setOverdueTime(Number(overdueTimes[0]))

            // 2) En lugar de mapping, usamos getPaymentsByStatus para traer el struct
            const list = (await publicClient.readContract({
                address: warp,
                abi: contractAbi,
                functionName: 'getPaymentsByStatus',
                args: [
                    0,             // status = pending
                    idx,           // offset = índice hallado
                    BigInt(1)      // limit = 1
                ]
            })) as ScheduledPayment[]

            const p = list[0]
            setDue(p)

            // 3) Trae el porcentaje de reward on-chain
            const pct = (await publicClient.readContract({
                address: warp,
                abi: [{
                    inputs: [],
                    name: 'executorRewardPercent',
                    outputs: [{ internalType: 'uint256', type: 'uint256' }],
                    stateMutability: 'view',
                    type: 'function'
                }],
                functionName: 'executorRewardPercent'
            })) as bigint

            // 4) Calcula la recompensa y formatea
            const rewardWei = (p.value * pct) / BigInt(100)
            const reward = (Number(rewardWei) / 1e18).toLocaleString(undefined, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 5
            })
            setRewardEth(reward)
        } catch (err) {
            console.error('Error loading due payment', err)
            setModalMessage('Failed to load due payment')
        }
    }

    useEffect(() => {
        if (chainId) loadDue()
    }, [chainId])

    const handleExecute = async () => {
        if (!walletClient) return
        setLoading(true)
        try {
            setModalMessage('Executing payment…')
            const tx = await executeSinglePayment(walletClient)
            setModalMessage(`Executed: ${tx.hash}`)
            await loadDue()
        } catch (e: any) {
            console.error(e)
            setModalMessage(`Error: ${e.message || e}`)
        } finally {
            setLoading(false)
        }
    }

    // Formateo de datos para la UI
    const dateStr = due
        ? new Date(Number(due.executeTime) * 1000).toLocaleString()
        : ''
    const amountEth = due
        ? (Number(due.value) / 1e18).toLocaleString(undefined, {
            minimumFractionDigits: 4,
            maximumFractionDigits: 4
        })
        : '0.0000'

    return (
  <div className="p-6 text-white bg-[#0f0d14] min-h-screen flex flex-col items-center">
    <button
      onClick={onBack}
      className="self-start flex items-center text-purple-400 mb-6 hover:text-purple-300 transition"
    >
      <FiArrowLeft className="mr-2" /> Back
    </button>

    <h2 className="text-3xl font-bold mb-6">Earn</h2>

    {/* How does this work? – siempre visible */}
    <div className="w-full max-w-md bg-gradient-to-r from-purple-700 to-purple-500 p-5 rounded-2xl shadow-xl mb-8">
      <h3 className="text-xl font-semibold text-white mb-3">How does this work?</h3>
      <ol className="list-decimal list-inside space-y-1 text-sm text-gray-200">
        <li>Add the WarpPay app (with notifications enabled).</li>
        <li>
          When you receive a notification, open the app and be the first executing the payment within
          <span className="font-bold text-white"> 15 minutes </span>before it’s auto-executed.
        </li>
        <li>Enjoy your <span className="text-green-400 font-bold">1% reward</span>!</li>
      </ol>
    </div>

    {/* Pago pendiente (o mensaje de no hay) */}
    {due ? (
      <div className="w-full max-w-md bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-2xl shadow-lg flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <span className="text-lg font-medium">Next Payout</span>
          <span className="text-xs uppercase px-2 py-1 bg-yellow-500 rounded-full font-semibold">
            Pending
          </span>
        </div>
        <dl className="space-y-4 flex-1">
          <div>
            <dt className="text-gray-400 text-sm">Date</dt>
            <dd className="text-white font-medium">{dateStr}</dd>
          </div>
          <div>
            <dt className="text-gray-400 text-sm">Amount</dt>
            <dd className="text-white font-medium">{amountEth} ETH</dd>
          </div>
          <div>
            <dt className="text-gray-400 text-sm">Your Reward (1%)</dt>
            <dd className="text-green-400 font-bold text-xl">+{rewardEth} ETH</dd>
          </div>
          <div>
            <dt className="text-gray-400 text-sm">Overdue by</dt>
            <dd className="text-red-500 font-medium">
              {Math.floor(overdueTime/3600)}h {Math.floor((overdueTime%3600)/60)}m
            </dd>
          </div>
        </dl>
        <button
          onClick={handleExecute}
          disabled={loading}
          className="mt-6 py-3 bg-green-600 hover:bg-green-700 rounded-xl font-bold text-lg transition disabled:opacity-50"
        >
          {loading ? 'Executing…' : 'Execute Payment'}
        </button>
      </div>
    ) : (
      <p className="text-center text-gray-500 mt-20">No pending payouts</p>
    )}

    {modalMessage && (
      <AlertModal message={modalMessage} onClose={() => setModalMessage(null)} />
    )}
  </div>
)



}
