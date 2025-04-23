import { useState } from "react";
import { FiArrowLeft } from "react-icons/fi";

export default function RequestScreen({ walletClient, address, onBack }) {
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const handleRequest = () => {
    if (!to || !amount) return;
    // TODO: integrate with backend or WarpService to send a payment request
    alert(`Requested ${amount} ETH from ${to} with note: ${note}`);
  };

  return (
    <div className="p-4 text-white min-h-screen bg-[#0f0d14]">
      <button onClick={onBack} className="mb-4 flex items-center text-purple-400">
      <FiArrowLeft className="w-5 h-5 mr-1" /> Back
      </button>

      <h2 className="text-2xl font-bold mb-4">Request Tokens</h2>

      <div className="space-y-4">
        <input
          type="text"
          placeholder="From (address or handle)"
          className="w-full p-3 rounded-lg bg-[#1a1725] text-white border border-[#2e2948]"
          value={to}
          onChange={(e) => setTo(e.target.value)}
        />
        <input
          type="number"
          placeholder="Amount (ETH)"
          className="w-full p-3 rounded-lg bg-[#1a1725] text-white border border-[#2e2948]"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <textarea
          placeholder="Note (optional)"
          rows={3}
          className="w-full p-3 rounded-lg bg-[#1a1725] text-white border border-[#2e2948]"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <button
          onClick={handleRequest}
          className="w-full py-3 rounded-xl font-bold bg-purple-600 hover:bg-purple-700 transition"
        >
          Send Request
        </button>
      </div>
    </div>
  );
}