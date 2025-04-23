import { useState } from "react";
import { FiArrowLeft } from "react-icons/fi";
import { parseEther } from "viem";

export default function SendScreen({ walletClient, address, onBack }) {
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [sending, setSending] = useState(false);
  const [txHash, setTxHash] = useState("");

  const handleSend = async () => {
    if (!walletClient || !address || !to || !amount) return;
    try {
      setSending(true);
      const hash = await walletClient.sendTransaction({
        account: address,
        to,
        value: parseEther(amount)
      });
      setTxHash(hash);
    } catch (err) {
      alert("Error sending: " + err.message);
    } finally {
      setSending(false);
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
          placeholder="To (address or handle)"
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
        <button
          onClick={handleSend}
          className="w-full py-3 rounded-xl font-bold bg-purple-600 hover:bg-purple-700 transition"
          disabled={sending}
        >
          {sending ? "Sending..." : "Send"}
        </button>
        {txHash && (
          <p className="text-green-500 text-sm mt-2 break-all">
            Sent! Tx: <a className="underline" href={`https://basescan.org/tx/${txHash}`} target="_blank" rel="noopener noreferrer">View on explorer</a>
          </p>
        )}
      </div>
    </div>
  );
}