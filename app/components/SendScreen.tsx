// src/components/SendScreen.tsx
"use client";

import React, { useState, useEffect } from "react";
import { FiArrowLeft } from "react-icons/fi";
import AlertModal from "./AlertModal";
import { sendTokens } from "../services/contractService";
import { useWalletClient, usePublicClient, useAccount } from "wagmi";
import { useSearchParams } from "next/navigation";
import { parseUnits, parseEther } from "viem";
import TokenSelector, { TokenOption } from "./TokenSelector";

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
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedToken, setSelectedToken] = useState<TokenOption>("ETH");
  const [contractAddress, setContractAddress] = useState("");
  const [modalMessage, setModalMessage] = useState<string | null>(null);

  // Pre-fill from URL
  useEffect(() => {
    const w = searchParams.get("wallet");
    const a = searchParams.get("amount");
    const t = searchParams.get("token");
    const c = searchParams.get("contract");
    if (w) setTo(w);
    if (a) setAmount(a);
    if (t === "USDC") {
      // Selecting USDC triggers TokenSelector effect to set the proper address
      setSelectedToken("USDC");
    } else if (t && t !== "ETH") {
      setSelectedToken("CUSTOM");
      if (c) setContractAddress(c);
    }
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
        setModalMessage("Sending ETH...");
        const value = parseEther(amount);
        const tx = await sendTokens(walletClient, address, to as `0x${string}`, value);
        await publicClient.waitForTransactionReceipt({ hash: tx.hash as `0x${string}` });
        setModalMessage(`Sent: ${tx.summary}`);
      } else {
        // ERC20 flow
        let addr = contractAddress;
        if (!addr) {
          setModalMessage("Missing token contract address");
          return;
        }
        setModalMessage("Reading token decimals...");
        const decimals = (await publicClient.readContract({
          address: addr as `0x${string}`,
          abi: ERC20_ABI,
          functionName: "decimals",
        })) as number;

        const parsed = parseUnits(amount, decimals);

        setModalMessage("Sending tokens...");
        const tx = await sendTokens(
          walletClient,
          address,
          to as `0x${string}`,
          parsed,
          addr as `0x${string}`
        );
        await publicClient.waitForTransactionReceipt({ hash: tx.hash as `0x${string}` });
        setModalMessage(`Sent: ${tx.summary}`);
      }
    } catch (err) {
      setModalMessage(`Error: ${(err as Error).message}`);
    }
  };

  return (
    <div className="p-4 text-white bg-[#0f0d14] min-h-screen flex flex-col items-end ">
      <button
        onClick={onBack}
        className="mb-4 flex items-center justify-end text-purple-400 text-lg px-4 py-2 bg-[#1a1725] rounded-lg max-w-[200px]"
      >
        <FiArrowLeft className="w-6 h-6 mr-2" /> Back
      </button>

      <h2 className="text-2xl font-bold mb-6 mx-auto">Send</h2>

      <div className="space-y-4 flex-1 w-full">
        <input
          type="text"
          placeholder="Recipient Address"
          className="w-full p-4 rounded-lg bg-[#1a1725] text-white text-base"
          value={to}
          onChange={(e) => setTo(e.target.value)}
        />

        <input
          type="number"
          placeholder="Amount"
          className="w-full p-4 rounded-lg bg-[#1a1725] text-white text-base"
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
