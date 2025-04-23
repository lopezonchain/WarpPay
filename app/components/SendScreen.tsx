// src/components/SendScreen.tsx
"use client";

import React, { useState, useEffect } from "react";
import { FiArrowLeft } from "react-icons/fi";
import AlertModal from "./AlertModal";
import { sendTokens } from "../services/api";
import { useWalletClient, usePublicClient, useAccount } from "wagmi";
import { useSearchParams } from "next/navigation";
import { parseUnits, parseEther } from "viem";

interface SendScreenProps {
  address?: `0x${string}`;
  onBack: () => void;
}

// Reemplaza tu ERC20_ABI de strings por ABI JSON:
const ERC20_ABI = [
  {
    type: "function",
    name: "decimals",
    stateMutability: "view",
    inputs: [],
    outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
  },
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { internalType: "address", name: "spender", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
  },
];

const SendScreen: React.FC<SendScreenProps> = ({ address, onBack }) => {
  // walletClient para enviar/transaccionar, publicClient para lecturas on-chain
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const connectedWallet = useAccount();

  const searchParams = useSearchParams();
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [tokenType, setTokenType] = useState<"ETH" | "ERC20">("ETH");
  const [contractAddress, setContractAddress] = useState("");
  const [modalMessage, setModalMessage] = useState<string | null>(null);

  // Pre-llenar desde la URL si vienen params
  useEffect(() => {
    const w = searchParams.get("wallet");
    const a = searchParams.get("amount");
    const t = searchParams.get("token");
    const c = searchParams.get("contract");
    if (w) setTo(w);
    if (a) setAmount(a);
    if (t && t !== "ETH") {
      setTokenType("ERC20");
      if (c) setContractAddress(c);
    }
  }, [searchParams]);

  const handleSend = async () => {
    if (!walletClient || !publicClient || !address || !to || !amount) {
      setModalMessage("Connect wallet and fill all fields");
      return;
    }
  
    try {
      if (tokenType === "ETH") {
        setModalMessage("Sending ETH...");
        // parseamos a bigint de wei
        const value = parseEther(amount);
        // enviamos ETH on‐chain
        const tx = await sendTokens(walletClient, address, to as `0x${string}`, value);
        // esperamos confirmación
        await publicClient.waitForTransactionReceipt({ hash: tx.hash as `0x${string}` });
        setModalMessage(`Sent: ${tx.summary}`);
      } else {
        if (!contractAddress) {
          setModalMessage("Missing token contract address");
          return;
        }
        setModalMessage("Reading token decimals...");
        // leemos los decimales con publicClient
        const decimals = (await publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: ERC20_ABI,
          functionName: "decimals",
        })) as number;
  
        const parsed = parseUnits(amount, decimals);
  
        setModalMessage("Approving token...");
        /*
        // approval a SPENDER_ADDRESS
        const approveHash = await walletClient.writeContract({
          address: contractAddress as `0x${string}`,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [connectedWallet.address as `0x${string}`, parsed],
        });
        // esperamos la aprobación
        await publicClient.waitForTransactionReceipt({ hash: approveHash });
  */
        setModalMessage("Sending tokens...");
        // transfer ERC20
        const tx = await sendTokens(
          walletClient,
          address,
          to as `0x${string}`,
          parsed,
          contractAddress as `0x${string}`
        );
        // esperamos la transferencia
        await publicClient.waitForTransactionReceipt({ hash: tx.hash as `0x${string}` });
        setModalMessage(`Sent: ${tx.summary}`);
      }
    } catch (err) {
      setModalMessage(`Error: ${(err as Error).message}`);
    }
  };
  

  return (
    <div className="p-4 text-white bg-[#0f0d14]">
      <button
        onClick={onBack}
        className="mb-4 flex items-center text-purple-400"
      >
        <FiArrowLeft className="w-5 h-5 mr-1" /> Back
      </button>
      <h2 className="text-2xl font-bold mb-4">Send Tokens</h2>
      <div className="space-y-4">
        <input
          type="text"
          placeholder="Recipient Address"
          className="w-full p-3 rounded-lg bg-[#1a1725] text-white"
          value={to}
          onChange={(e) => setTo(e.target.value)}
        />
        <input
          type="number"
          placeholder="Amount"
          className="w-full p-3 rounded-lg bg-[#1a1725] text-white"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        <div className="flex space-x-4">
          <label className="flex items-center">
            <input
              type="radio"
              checked={tokenType === "ETH"}
              onChange={() => setTokenType("ETH")}
            />
            <span className="ml-1">ETH</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              checked={tokenType === "ERC20"}
              onChange={() => setTokenType("ERC20")}
            />
            <span className="ml-1">ERC20</span>
          </label>
        </div>

        {tokenType === "ERC20" && (
          <input
            type="text"
            placeholder="Token Contract Address"
            className="w-full p-3 rounded-lg bg-[#1a1725] text-white"
            value={contractAddress}
            onChange={(e) => setContractAddress(e.target.value)}
          />
        )}

        <button
          onClick={handleSend}
          className="w-full py-3 rounded-xl font-bold bg-purple-600 hover:bg-purple-700"
        >
          Send
        </button>
      </div>

      {modalMessage && (
        <AlertModal
          message={modalMessage}
          onClose={() => setModalMessage(null)}
        />
      )}
    </div>
  );
};

export default SendScreen;
