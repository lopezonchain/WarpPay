// src/components/SendScreen.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { FiArrowLeft, FiCompass, FiInfo } from "react-icons/fi";
import AlertModal from "./AlertModal";
import SuccessModal from "./SuccessModal";
import { sendTokens } from "../services/contractService";
import { useWalletClient, usePublicClient, useAccount } from "wagmi";
import { useSearchParams } from "next/navigation";
import { parseUnits, parseEther } from "viem";
import TokenSelector, { TokenOption } from "./TokenSelector";
import { useAddFrame } from '@coinbase/onchainkit/minikit'
import { motion } from "framer-motion";

interface SendScreenProps {
  address?: `0x${string}`;
  onBack: () => void;
}

// Minimal ERC20 ABI for decimals
const ERC20_ABI = [
  {
    type: "function",
    name: "decimals",
    stateMutability: "view",
    inputs: [],
    outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
  },
];

const SendScreen: React.FC<SendScreenProps> = ({ address, onBack }) => {
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const connectedWallet = useAccount();

  const searchParams = useSearchParams();
  const isPayment = !!searchParams.get("wallet");

  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedToken, setSelectedToken] = useState<TokenOption>("ETH");
  const [contractAddress, setContractAddress] = useState("");
  const [reason, setReason] = useState<string | null>(null);
  const [modalMessage, setModalMessage] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // Hook para añadir miniapp
  const addFrame = useAddFrame();
  const handleAddFrame = useCallback(async () => {
    await addFrame();
  }, [addFrame]);

  // Handler para compartir en Warpcast vía URL
  const handleShare = useCallback(() => {
    const text = `I've just sent crypto for FREE with WarpPay!! The all-in-one payments miniapp by @lopezonchain.eth 🚀 Create request links, airdrops, scheduled transfers, or even EARN! https://warpcast.com/miniapps/V0727cQCBnfX/warppay- `;
    const url = `https://warpcast.com/~/compose?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  }, []);

  // Pre-fill from URL params
  useEffect(() => {
    const w = searchParams.get("wallet");
    const a = searchParams.get("amount");
    const t = searchParams.get("token");
    const c = searchParams.get("contract");
    const r = searchParams.get("reason"); 
    if (w) setTo(w);
    if (a) setAmount(a);
    if (t === "USDC") {
      setSelectedToken("USDC");
    } else if (t && t !== "ETH") {
      setSelectedToken("CUSTOM");
      if (c) setContractAddress(c);
    } 
    if (r) setReason(r);  
  }, [searchParams]);

  const getTokenType = () => (selectedToken === "ETH" ? "ETH" : "ERC20");

  const handleSend = async () => {
    if (!walletClient || !publicClient || !address || !to || !amount) {
      setModalMessage("Connect wallet and fill all fields");
      return;
    }

    const tokenType = getTokenType();

    try {
      if (tokenType === "ETH") {
        setModalMessage("Sending...");
        const value = parseEther(amount);
        const tx = await sendTokens(walletClient, to, value);
        await publicClient.waitForTransactionReceipt({ hash: tx.hash as `0x${string}` });
      } else {
        // ERC20 flow
        if (!contractAddress) {
          setModalMessage("Missing token contract address");
          return;
        }
        setModalMessage("Reading token decimals...");
        const decimals = (await publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: ERC20_ABI,
          functionName: "decimals",
        })) as number;

        const parsed = parseUnits(amount, decimals);
        setModalMessage("Sending tokens...");
        const tx = await sendTokens(walletClient, to, parsed, contractAddress as `0x${string}`);
        await publicClient.waitForTransactionReceipt({ hash: tx.hash as `0x${string}` });
      }

      // Al completarse con éxito, mostramos el SuccessModal
      setModalMessage(null);
      setShowSuccess(true);
    } catch (err) {
      setModalMessage(`Error: ${(err as Error).message}`);
    }
  };

  return (
    <div className="p-4 text-white bg-[#0f0d14] flex flex-col">
      <button
        onClick={onBack}
        className="mb-4 flex items-center justify-center text-purple-400 text-lg px-4 py-2 bg-[#1a1725] rounded-lg max-w-[200px]"
      >
        {isPayment ? (
          <>
            <FiCompass className="w-6 h-6 mr-2" />
            Explore
          </>
        ) : (
          <>
            <FiArrowLeft className="w-6 h-6 mr-2" />
            Back
          </>
        )}
      </button>

      <h2 className="text-2xl font-bold mb-6 mx-auto">Send</h2>

      {reason && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="
            w-full max-w-md mb-4 p-3 flex items-center space-x-2
            bg-indigo-700 bg-opacity-90 rounded-xl shadow-lg
          "
        >
          <FiInfo className="w-6 h-6 text-white" />
          <div>
            <span className="block text-xs text-gray-200 uppercase">Reason</span>
            <span className="block font-medium text-white">{reason}</span>
          </div>
        </motion.div>
      )}

      <div className="space-y-4 flex-2 w-full">
        <input
          type="text"
          placeholder="Recipient (Farcaster user, ENS, wallet)"
          className="w-full p-4 rounded-lg bg-[#1a1725] text-white text-center"
          value={to}
          onChange={(e) => setTo(e.target.value)}
        />

        <input
          type="number"
          placeholder="Amount"
          className="w-full p-4 rounded-lg bg-[#1a1725] text-white text-center"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        <TokenSelector
          selected={selectedToken}
          onSelect={setSelectedToken}
          customAddress={contractAddress}
          onCustomAddressChange={setContractAddress}
          chainId={walletClient?.chain.id ?? 1}
        />

        <button
          onClick={handleSend}
          className="w-full py-4 rounded-2xl font-bold bg-purple-600 hover:bg-purple-700 text-lg"
        >
          Send
        </button>
      </div>

      {/* Modal de error/transición */}
      {modalMessage && !showSuccess && (
        <AlertModal message={modalMessage} onClose={() => setModalMessage(null)} />
      )}

      {/* Modal de éxito en la parte baja */}
      {showSuccess && (
        <SuccessModal
          onClose={() => setShowSuccess(false)}
          onShare={handleShare}
          onAdd={handleAddFrame}
        />
      )}
    </div>
  );
};

export default SendScreen;
