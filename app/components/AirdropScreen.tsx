// src/components/AirdropScreen.tsx
import React, { useState } from "react";
import { FiArrowLeft } from "react-icons/fi";
import AlertModal from "./AlertModal";
import { createAirdrop } from "../services/contractService";
import { useWalletClient } from "wagmi";

interface AirdropScreenProps {
  address?: string;
  onBack: () => void;
}

const AirdropScreen: React.FC<AirdropScreenProps> = ({
  address,
  onBack,
}) => {
  const { data: walletClient } = useWalletClient();
  const [token, setToken] = useState("ETH");
  const [total, setTotal] = useState("");
  const [quantity, setQuantity] = useState("");
  const [modalMessage, setModalMessage] = useState<string | null>(null);

  const handleAirdrop = async () => {
    if (!walletClient || !address) return;
    setModalMessage("Creando airdrop...");

  };

  return (
    <div className="p-4 text-white bg-[#0f0d14]">
      <button
        onClick={onBack}
        className="mb-4 flex items-center text-purple-400"
      >
        <FiArrowLeft className="w-5 h-5 mr-1" /> Back
      </button>

      <h2 className="text-2xl font-bold mb-4">Create Airdrop</h2>
      <div className="space-y-4">
        <input
          type="text"
          placeholder="Token (e.g. ETH, USDC)"
          className="w-full p-3 rounded-lg bg-[#1a1725] text-white border border-[#2e2948]"
          value={token}
          onChange={(e) => setToken(e.target.value)}
        />
        <input
          type="number"
          placeholder="Total Amount"
          className="w-full p-3 rounded-lg bg-[#1a1725] text-white border border-[#2e2928]"
          value={total}
          onChange={(e) => setTotal(e.target.value)}
        />
        <input
          type="number"
          placeholder="Number of Recipients"
          className="w-full p-3 rounded-lg bg-[#1a1725] text-white border border-[#2e2928]"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
        />
        <button
          onClick={handleAirdrop}
          className="w-full py-3 rounded-xl font-bold bg-purple-600 hover:bg-purple-700 transition"
        >
          Create Airdrop
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

export default AirdropScreen;
