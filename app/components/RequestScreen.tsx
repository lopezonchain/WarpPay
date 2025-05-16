"use client";

import React, { useState } from "react";
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
  const [reason, setReason] = useState("");
  const [selectedToken, setSelectedToken] = useState<TokenOption>("ETH");
  const [contractAddress, setContractAddress] = useState("");
  const [link, setLink] = useState("");
  const [modalMessage, setModalMessage] = useState<string | null>(null);
  const { data: walletClient } = useWalletClient();

  const handleShare = () => {
      const url = `https://warpcast.com/~/compose?text=${encodeURIComponent(link)}`;
      window.open(url, "_blank");
    }

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
    if (reason) {
      params.set("reason", reason);
    }
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
    <div className="p-4 text-white bg-[#0f0d14] flex flex-col">
      <button
        onClick={onBack}
        className="mb-4 flex items-center justify-center text-purple-400 text-lg px-4 py-2 bg-[#1a1725] rounded-lg max-w-[200px]"
      >
        <FiArrowLeft className="w-6 h-6 mr-2" /> Back
      </button>
      <h2 className="text-2xl font-bold mb-6 mx-auto">Request</h2>

      <div className="space-y-4 flex-2 w-full">
        <input
          type="number"
          placeholder="Amount"
          className="w-full p-4 rounded-lg bg-[#1a1725] text-white text-center"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        <input
          type="text"
          placeholder="Reason (optional)"
          className="w-full p-4 rounded-lg bg-[#1a1725] text-white text-center"
          value={reason}
          maxLength={30}
          onChange={(e) => setReason(e.target.value)}
        />

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
              className="w-full p-4 rounded-lg bg-[#252435] text-white text-center"
              value={link}
            />
            <button
              onClick={copyLink}
              className="w-full py-4 rounded-2xl bg-blue-500 hover:bg-blue-600 text-lg font-bold"
            >
              Copy Link
            </button>
            <button
              onClick={handleShare}
              className="w-full py-4 rounded-2xl font-bold bg-purple-600 hover:bg-purple-700 text-lg"
            >
              Cast it!
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
