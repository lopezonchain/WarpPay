// src/components/AirdropScreen.tsx
"use client";

import React, { useEffect, useState } from "react";
import { FiArrowLeft } from "react-icons/fi";
import AlertModal from "./AlertModal";
import TokenSelector, { TokenOption } from "./TokenSelector";
import { useWalletClient, usePublicClient } from "wagmi";
import { resolveEnsName } from "../services/ensResolver";
import { createAirdrop } from "../services/contractService";
import { parseEther, parseUnits } from "viem";

interface AirdropScreenProps {
  address?: `0x${string}`;
  onBack: () => void;
}

// Lista de recomendados de ejemplo
const recommendedList = [
  { label: "Alice", address: "alice.eth" },
  { label: "Bob", address: "bob.eth" },
  { label: "Carol", address: "carol.eth" },
];

type Mode = "recommended" | "manual" | "csv";

const AirdropScreen: React.FC<AirdropScreenProps> = ({ address, onBack }) => {
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const [chainId, setChainId] = useState<number>(0);

  useEffect(() => {
    publicClient?.getChainId().then(id => setChainId(id));
  }, [publicClient]);

  // --- State ---
  const [mode, setMode] = useState<Mode>("csv");
  const [useSameAmount, setUseSameAmount] = useState(true);

  const [tokenOption, setTokenOption] = useState<TokenOption>("ETH");
  const [contractAddress, setContractAddress] = useState("");

  // recomendado:
  const [amountPerRecipient, setAmountPerRecipient] = useState("");

  // manual:
  const [manualRows, setManualRows] = useState<{ addr: string; amt: string }[]>([
    { addr: "", amt: "" },
  ]);

  // csv:
  const [csvText, setCsvText] = useState("");

  const [selectedRecs, setSelectedRecs] = useState<string[]>([]);
  const [modalMessage, setModalMessage] = useState<string | null>(null);

  // calcular tokenAddress o null para ETH
  const tokenAddress = tokenOption === "ETH" ? null : (contractAddress as `0x${string}`);

  // Helper para parsear cada cantidad según token
  async function parseAmount(amt: string) {
    if (tokenOption === "ETH") {
      return parseEther(amt);
    } else {
      const decimals = (await publicClient?.readContract({
        address: tokenAddress!,
        abi: [
          {
            type: "function",
            name: "decimals",
            stateMutability: "view",
            inputs: [],
            outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
          },
        ],
        functionName: "decimals",
      })) as number;
      return parseUnits(amt, decimals);
    }
  }

  // Manejador principal de airdrop
  const handleAirdrop = async () => {
    if (!walletClient || !address) {
      setModalMessage("Please connect your wallet");
      return;
    }
    try {
      setModalMessage("Preparing airdrop…");
      const recipients: `0x${string}`[] = [];
      const values: bigint[] = [];

      if (mode === "recommended") {
        if (!amountPerRecipient) {
          setModalMessage("Enter an amount per recipient");
          return;
        }
        for (const rec of selectedRecs) {
          const resolved = rec.startsWith("0x")
            ? rec as `0x${string}`
            : await resolveEnsName(rec);
          recipients.push(resolved);
          values.push(await parseAmount(amountPerRecipient));
        }

      } else if (mode === "manual") {
        if (useSameAmount && !amountPerRecipient) {
          setModalMessage("Enter the common amount");
          return;
        }
        for (const { addr, amt } of manualRows) {
          if (!addr) continue;
          const resolved = addr.startsWith("0x")
            ? addr as `0x${string}`
            : await resolveEnsName(addr);
          const amountString = useSameAmount ? amountPerRecipient : amt;
          if (!amountString) continue;
          recipients.push(resolved);
          values.push(await parseAmount(amountString));
        }

      } else {
        // CSV mode
        if (useSameAmount && !amountPerRecipient) {
          setModalMessage("Enter the common amount");
          return;
        }
        for (const line of csvText.split(/\r?\n/)) {
          if (!line.trim()) continue;
          const parts = line.split(",");
          const addr = parts[0].trim();
          const amt = useSameAmount
            ? amountPerRecipient
            : (parts[1]?.trim() ?? "");
          if (!addr || !amt) continue;
          const resolved = addr.startsWith("0x")
            ? addr as `0x${string}`
            : await resolveEnsName(addr);
          recipients.push(resolved);
          values.push(await parseAmount(amt));
        }
      }

      if (recipients.length === 0) {
        setModalMessage("No valid recipients found");
        return;
      }

      setModalMessage("Multisending…");
      const tx = await createAirdrop(
        walletClient,
        publicClient,
        tokenAddress ?? null,
        recipients,
        values
      );
      setModalMessage(`Airdrop TX submitted: ${tx.hash}`);
    } catch (err) {
      setModalMessage(`Error: ${(err as Error).message}`);
    }
  };

  if (chainId && chainId !== 8453) {
    return (
      <div className="p-4 text-white bg-[#0f0d14] flex flex-col items-end ">
        {/* Back */}
        <button
          onClick={onBack}
          className="mb-4 flex items-center justify-end text-purple-400 text-lg px-4 py-2 bg-[#1a1725] rounded-lg max-w-[200px]"
        >
          <FiArrowLeft className="w-6 h-6 mr-2" /> Back
        </button>
    
        {/* Título centrado */}
        <h2 className="text-2xl font-bold mb-6 mx-auto">Airdrop</h2>
        <div className="p-4 text-white bg-[#0f0d14] min-h-screen flex items-start justify-center">
          Only working on Base... yet! Send your suggestions
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 text-white bg-[#0f0d14] min-h-screen flex flex-col items-end ">
      {/* Back */}
      <button
        onClick={onBack}
        className="mb-4 flex items-center justify-end text-purple-400 text-lg px-4 py-2 bg-[#1a1725] rounded-lg max-w-[200px]"
      >
        <FiArrowLeft className="w-6 h-6 mr-2" /> Back
      </button>
  
      {/* Título centrado */}
      <h2 className="text-2xl font-bold mb-6 mx-auto">Airdrop</h2>
  
      {/* Token selector */}
      <div className="space-y-4 flex-2 w-full">
        <TokenSelector
          selected={tokenOption}
          onSelect={setTokenOption}
          customAddress={contractAddress}
          onCustomAddressChange={setContractAddress}
          chainId={walletClient?.chain.id ?? 1}
        />
      </div>

      {/* Mode tabs */}
      <div className="flex space-x-2 mt-4 mb-6 ">
        {([/*"recommended", */"csv", "manual"] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-4 py-2 rounded-full text-sm font-medium ${mode === m
              ? "bg-purple-600 text-white"
              : "bg-[#1a1725] text-gray-300 hover:bg-[#2a2438]"
              }`}
          >
            {m === "recommended"
              ? "Recommended"
              : m === "manual"
                ? "Manual"
                : "Paste CSV"}
          </button>
        ))}
      </div>

      {/* Panels */}
      <div className="space-y-4 flex flex-col items-end w-full">
        {/* Recommended */}
        {mode === "recommended" && (
          <>
            <input
              type="number"
              placeholder="Amount per recipient"
              className="w-full p-3 rounded-lg bg-[#1a1725] text-white"
              value={amountPerRecipient}
              onChange={(e) => setAmountPerRecipient(e.target.value)}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {recommendedList.map(({ label, address: addr }) => (
                <label
                  key={addr}
                  className="flex items-center space-x-2 bg-[#1a1725] p-2 rounded-lg cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedRecs.includes(addr)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedRecs((s) => [...s, addr]);
                      } else {
                        setSelectedRecs((s) => s.filter((x) => x !== addr));
                      }
                    }}
                  />
                  <span className="text-white">{label}</span>
                  <span className="text-gray-400 text-xs">{addr}</span>
                </label>
              ))}
            </div>
          </>
        )}

        {/* Manual */}
        {mode === "manual" && (
          <>
            <label className="flex items-center space-x-2 mb-2">
              <input
                type="checkbox"
                checked={useSameAmount}
                onChange={() => setUseSameAmount(!useSameAmount)}
              />
              <span className="text-sm">Same amount for all</span>
            </label>
            {useSameAmount && (
              <input
                type="number"
                placeholder="Amount for each recipient"
                className="w-full p-3 rounded-lg bg-[#1a1725] text-white mb-2"
                value={amountPerRecipient}
                onChange={(e) => setAmountPerRecipient(e.target.value)}
              />
            )}
            {manualRows.map((row, i) => (
              <div key={i} className="flex space-x-2 mb-2 w-full">
                <input
                  type="text"
                  placeholder="Address / ENS"
                  className="flex-1 p-2 rounded-lg bg-[#1a1725] text-white"
                  value={row.addr}
                  onChange={(e) =>
                    setManualRows((r) =>
                      r.map((x, j) =>
                        j === i ? { ...x, addr: e.target.value } : x
                      )
                    )
                  }
                />
                {!useSameAmount && (
                  <input
                    type="number"
                    placeholder="Amount"
                    className="w-32 p-2 rounded-lg bg-[#1a1725] text-white"
                    value={row.amt}
                    onChange={(e) =>
                      setManualRows((r) =>
                        r.map((x, j) =>
                          j === i ? { ...x, amt: e.target.value } : x
                        )
                      )
                    }
                  />
                )}
              </div>
            ))}
            <button
              onClick={() =>
                setManualRows((r) => [...r, { addr: "", amt: "" }])
              }
              className="mt-2 px-4 py-2 bg-purple-600 rounded-lg text-sm align-right"
            >
              + Add Recipient
            </button>
          </>
        )}

        {/* CSV */}
        {mode === "csv" && (
          <>
            <label className="flex items-center space-x-2 mb-2">
              <input
                type="checkbox"
                checked={useSameAmount}
                onChange={() => setUseSameAmount(!useSameAmount)}
              />
              <span className="text-sm">Same amount for all</span>
            </label>
            {useSameAmount && (
              <input
                type="number"
                placeholder="Amount for each recipient"
                className="w-full p-3 rounded-lg bg-[#1a1725] text-white mb-2"
                value={amountPerRecipient}
                onChange={(e) => setAmountPerRecipient(e.target.value)}
              />
            )}
            <textarea
              placeholder={
                useSameAmount
                  ? "One recipient address or ens per line"
                  : "recipient,amount per line"
              }
              className="w-full h-40 p-3 rounded-lg bg-[#1a1725] text-white"
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
            />
          </>
        )}
      </div>

      <button
        onClick={handleAirdrop}
        className="w-full py-4 rounded-2xl mt-4 font-bold bg-purple-600 hover:bg-purple-700 text-lg"
      >
        Send Airdrop
      </button>

      {modalMessage && (
        <AlertModal message={modalMessage} onClose={() => setModalMessage(null)} />
      )}
    </div>
  );
};

export default AirdropScreen;
