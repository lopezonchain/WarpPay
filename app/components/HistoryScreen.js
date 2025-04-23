import { useEffect, useState } from "react";
import { FiArrowLeft } from "react-icons/fi";

export default function HistoryScreen({ address, onBack }) {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    // TODO: fetch history from backend or blockchain indexer
    setHistory([]);
  }, []);

  return (
    <div className="p-4 text-white min-h-screen bg-[#0f0d14]">
      <button onClick={onBack} className="mb-4 flex items-center text-purple-400">
      <FiArrowLeft className="w-5 h-5 mr-1" /> Back
      </button>

      <h2 className="text-2xl font-bold mb-4">Transaction History</h2>
      {history.length === 0 ? (
        <p className="text-gray-400">No transactions yet.</p>
      ) : (
        <ul className="space-y-2">
          {history.map((tx, idx) => (
            <li key={idx} className="p-2 bg-[#1a1725] rounded-lg">
              {/* Render tx info */}
              <p>{tx.summary}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
