// src/components/SendScreen.tsx
"use client";

import React, { useState, useEffect } from "react";
import { FiArrowLeft } from "react-icons/fi";
import AlertModal from "./AlertModal";
import { sendTokens } from "../services/api";
import type { WalletClient } from "wagmi";
import { useSearchParams } from "next/navigation";
import { parseUnits } from "viem";

interface Props {
  walletClient?: WalletClient;
  address?: string;
  onBack: () => void;
}

const ERC20_ABI = [
  "function decimals() view returns (uint8)",
  "function approve(address spender, uint256 amount) returns (bool)",
];
// define en .env NEXT_PUBLIC_TOKEN_SPENDER_ADDRESS
const SPENDER_ADDRESS = process.env.NEXT_PUBLIC_TOKEN_SPENDER_ADDRESS!;

const SendScreen: React.FC<Props> = ({ walletClient, address, onBack }) => {
  const searchParams = useSearchParams();
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [tokenType, setTokenType] = useState<"ETH" | "ERC20">("ETH");
  const [contractAddress, setContractAddress] = useState("");
  const [modalMessage, setModalMessage] = useState<string | null>(null);

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
    if (!walletClient || !address || !to || !amount) {
      setModalMessage("Connect a wallet and fill the inputs");
      return;
    }
    try {
      if (tokenType === "ETH") {
        setModalMessage("Sending ETH...");
        const tx = await sendTokens(walletClient, address, to, amount);
        setModalMessage(`Sent: ${tx.summary}`);
      } else {
        if (!contractAddress) {
          setModalMessage("Missing token address");
          return;
        }
        const decimals = (await walletClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: ERC20_ABI,
          functionName: "decimals",
          args: [],
        })) as number;

        const unitAmount = parseUnits(amount, decimals);
        const approveHash = await walletClient.writeContract({
          address: contractAddress as `0x${string}`,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [SPENDER_ADDRESS, unitAmount],
        });
        await walletClient.waitForTransactionReceipt({ hash: approveHash });

        const tx = await sendTokens(
          walletClient,
          address,
          to,
          amount,
          contractAddress
        );
        setModalMessage(`Sent: ${tx.summary}`);
      }
    } catch (err) {
      setModalMessage(`Error: ${(err as Error).message}`);
    }
  };

  return (
    <div className="p-4 text-white min-h-screen bg-[#0f0d14]">
      <button onClick={onBack} className="mb-4 flex items-center text-purple-400">
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
        <AlertModal message={modalMessage} onClose={() => setModalMessage(null)} />
      )}
    </div>
  );
};

export default SendScreen;
