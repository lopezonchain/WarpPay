// src/components/RequestScreen.tsx
"use client";

import React, { useState } from "react";
import { FiArrowLeft } from "react-icons/fi";
import AlertModal from "./AlertModal";

interface Props {
  address?: string;
  onBack: () => void;
}

const RequestScreen: React.FC<Props> = ({ address, onBack }) => {
  const [amount, setAmount] = useState("");
  const [tokenType, setTokenType] = useState<"ETH" | "ERC20">("ETH");
  const [contractAddress, setContractAddress] = useState("");
  const [link, setLink] = useState("");
  const [modalMessage, setModalMessage] = useState<string | null>(null);

  const generateLink = () => {
    if (!address || !amount) {
      setModalMessage("Faltan datos requeridos");
      return;
    }
    const params = new URLSearchParams();
    params.set("wallet", address);
    params.set("amount", amount);
    if (tokenType === "ERC20") {
      if (!contractAddress) {
        setModalMessage("Falta dirección de contrato");
        return;
      }
      params.set("token", "ERC20");
      params.set("contract", contractAddress);
    } else {
      params.set("token", "ETH");
    }
    setLink(`${window.location.origin}?${params.toString()}`);
  };

  const copyLink = async () => {
    if (link) {
      await navigator.clipboard.writeText(link);
      setModalMessage("Link copiado al portapapeles");
    }
  };

  return (
    <div className="p-4 text-white min-h-screen bg-[#0f0d14]">
      <button onClick={onBack} className="mb-4 flex items-center text-purple-400">
        <FiArrowLeft className="w-5 h-5 mr-1" /> Back
      </button>
      <h2 className="text-2xl font-bold mb-4">Request Tokens</h2>
      <div className="space-y-4">
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
          onClick={generateLink}
          className="w-full py-3 rounded-xl font-bold bg-purple-600 hover:bg-purple-700"
        >
          Generate Link
        </button>
      </div>

      {link && (
        <div className="mt-4 space-y-2">
          <input
            readOnly
            className="w-full p-3 rounded-lg bg-[#252435] text-white"
            value={link}
          />
          <button
            onClick={copyLink}
            className="w-full py-2 rounded-md bg-blue-500 hover:bg-blue-600"
          >
            Copy Link
          </button>
        </div>
      )}

      {modalMessage && (
        <AlertModal message={modalMessage} onClose={() => setModalMessage(null)} />
      )}
    </div>
  );
};

export default RequestScreen;
