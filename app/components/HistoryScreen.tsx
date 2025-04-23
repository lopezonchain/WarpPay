// src/components/HistoryScreen.tsx
import React, { useEffect, useState } from "react";
import { FiArrowLeft } from "react-icons/fi";
import { fetchHistory, Tx } from "../services/api";

interface HistoryScreenProps {
  address?: string;
  onBack: () => void;
}

const HistoryScreen: React.FC<HistoryScreenProps> = ({ address, onBack }) => {
  const [history, setHistory] = useState<Tx[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!address) return;
    fetchHistory(address)
      .then(setHistory)
      .catch((err) => setError(err.message));
  }, [address]);

  return (
    <div className="p-4 text-white bg-[#0f0d14]">
      <button
        onClick={onBack}
        className="mb-4 flex items-center text-purple-400"
      >
        <FiArrowLeft className="w-5 h-5 mr-1" /> Back
      </button>

      <h2 className="text-2xl font-bold mb-4">Transaction History</h2>

      {error && <p className="text-red-500">{error}</p>}

      {history.length === 0 ? (
        <p className="text-gray-400">No transactions yet.</p>
      ) : (
        <ul className="space-y-2">
          {history.map((tx, i) => (
            <li key={i} className="p-2 bg-[#1a1725] rounded-lg">
              <p className="font-medium">{tx.summary}</p>
              <p className="text-xs text-gray-400">
                {new Date(tx.timestamp).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default HistoryScreen;
