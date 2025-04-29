// src/components/RequestScreen.tsx
"use client";

import React, { useState, useEffect } from "react";
import { FiArrowLeft } from "react-icons/fi";
import AlertModal from "./AlertModal";
import TokenSelector, { TokenOption } from "./TokenSelector";
import { useSearchParams } from "next/navigation";
import { useWalletClient } from "wagmi";

interface RequestScreenProps {
  address?: `0x${string}`;
  onBack: () => void;
}

const RequestScreen: React.FC<RequestScreenProps> = ({ address, onBack }) => {
  const searchParams = useSearchParams();
  const [amount, setAmount] = useState("");
  const [selectedToken, setSelectedToken] = useState<TokenOption>("ETH");
  const [contractAddress, setContractAddress] = useState("");
  const [link, setLink] = useState("");
  const [modalMessage, setModalMessage] = useState<string | null>(null);
  const { data: walletClient } = useWalletClient();

  // Pre-fill from URL, similar to SendScreen
  useEffect(() => {
    const w = searchParams.get("wallet");
    const a = searchParams.get("amount");
    const t = searchParams.get("token");
    const c = searchParams.get("contract");
    if (w) {
      // nothing to autofill in request besides amount
    }
    if (a) setAmount(a);
    if (t === "USDC") {
      setSelectedToken("USDC");
    } else if (t && t !== "ETH") {
      setSelectedToken("CUSTOM");
      if (c) setContractAddress(c);
    }
  }, [searchParams]);

  const generateLink = () => {
    if (!address) {
      setModalMessage("Connect wallet first");
      return;
    }
    if (!amount) {
      setModalMessage("Missing amount");
      return;
    }
    const params = new URLSearchParams();
    params.set("wallet", address);
    params.set("amount", amount);
    if (selectedToken !== "ETH") {
      params.set("token", selectedToken);
      params.set("contract", contractAddress);
    } else {
      params.set("token", "ETH");
    }
    setLink(`${window.location.origin}/?${params.toString()}`);
  };

  const copyLink = async () => {
    if (link) {
      await navigator.clipboard.writeText(link);
      setModalMessage("Link copied!");
    }
  };

  return (
    <div className="p-4 text-white bg-[#0f0d14] min-h-screen flex flex-col items-end">
      <button
        onClick={onBack}
        className="mb-4 flex items-center justify-end text-purple-400 text-lg px-4 py-2 bg-[#1a1725] rounded-lg max-w-[200px]"
      >
        <FiArrowLeft className="w-6 h-6 mr-2" /> Back
      </button>

      <h2 className="text-2xl font-bold mb-6 mx-auto">Request</h2>

      <div className="space-y-4 flex-1 w-full">
        <div className="relative">
          <input
            type="number"
            placeholder="Amount"
            className="w-full p-4 rounded-lg bg-[#1a1725] text-white text-base"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        <TokenSelector
          selected={selectedToken}
          onSelect={setSelectedToken}
          customAddress={contractAddress}
          onCustomAddressChange={setContractAddress}
          chainId={walletClient?.chain.id ?? 1}
        />

        <button
          onClick={generateLink}
          className="w-full py-4 rounded-2xl font-bold bg-purple-600 hover:bg-purple-700 text-lg"
        >
          Generate Link
        </button>

        {link && (
          <div className="mt-4 space-y-2">
            <input
              readOnly
              className="w-full p-4 rounded-lg bg-[#252435] text-white text-base"
              value={link}
            />
            <button
              onClick={copyLink}
              className="w-full py-4 rounded-2xl bg-blue-500 hover:bg-blue-600 text-lg font-bold"
            >
              Copy Link
            </button>
          </div>
        )}
      </div>

      {modalMessage && (
        <AlertModal message={modalMessage} onClose={() => setModalMessage(null)} />
      )}
    </div>
  );
};

export default RequestScreen;