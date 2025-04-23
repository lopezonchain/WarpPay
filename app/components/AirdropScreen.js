import { useState } from "react";
import { FiArrowLeft } from "react-icons/fi";

export default function AirdropScreen({ walletClient, address, onBack }) {
  const [token, setToken] = useState("ETH");
  const [total, setTotal] = useState("");
  const [quantity, setQuantity] = useState("");

  const handleAirdrop = () => {
    // TODO: integrate Merkle airdrop or backend logic
    alert(`Airdropping ${total} ${token} to ${quantity} recipients`);
  };

  return (
    <div className="p-4 text-white min-h-screen bg-[#0f0d14]">
      <button onClick={onBack} className="mb-4 flex items-center text-purple-400">
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
    </div>
  );
}