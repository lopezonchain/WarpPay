"use client";

import React, { useCallback, useEffect, useState } from "react";
import { FiArrowLeft } from "react-icons/fi";
import AlertModal from "./AlertModal";
import TokenSelector, { TokenOption } from "./TokenSelector";
import { useWalletClient, usePublicClient } from "wagmi";
import { createAirdrop, resolveRecipient } from "../services/contractService";
import { parseEther, parseUnits } from "viem";
import { PrimaryAddressResult, WarpcastService, WarpcastUser } from "../services/warpcastService";
import sdk, { type Context } from "@farcaster/frame-sdk";
import SuccessModal from "./SuccessModal";
import { useAddFrame } from '@coinbase/onchainkit/minikit'

const warpcast = new WarpcastService();

type Mode = "recommended" | "manual" | "csv";
type RecType = "following" | "followers" | "least_interacted";

interface AirdropScreenProps {
  address?: `0x${string}`;
  onBack: () => void;
}

const AirdropScreen: React.FC<AirdropScreenProps> = ({ address, onBack }) => {
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const [chainId, setChainId] = useState<number>(0);

  useEffect(() => {
    publicClient?.getChainId().then((id) => setChainId(id));
  }, [publicClient]);

  // General state
  const [mode, setMode] = useState<Mode>("recommended");
  const [useSameAmount, setUseSameAmount] = useState(true);
  const [tokenOption, setTokenOption] = useState<TokenOption>("ETH");
  const [contractAddress, setContractAddress] = useState("");
  const tokenAddress = tokenOption === "ETH" ? null : (contractAddress as `0x${string}`);

  // Recommended mode: data and global selection
  const [recType, setRecType] = useState<RecType>("following");
  const [dataByType, setDataByType] = useState<Record<RecType, WarpcastUser[]>>({
    following: [],
    followers: [],
    least_interacted: []
  });
  const [selectedFids, setSelectedFids] = useState<number[]>([]);
  const [autoCount, setAutoCount] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [minFollowers, setMinFollowers] = useState<number>(0);

  // Other modes
  const [amountPerRecipient, setAmountPerRecipient] = useState("");
  const [manualRows, setManualRows] = useState<{ addr: string; amt: string }[]>([{ addr: "", amt: "" }]);
  const [csvText, setCsvText] = useState("");
  const [modalMessage, setModalMessage] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // Hook para añadir miniapp
  const addFrame = useAddFrame();
  const handleAddFrame = useCallback(async () => {
    await addFrame();
  }, [addFrame]);

  // Handler para compartir en Warpcast vía URL
  const handleShare = useCallback(() => {
    const text = `I've just sent an airdrop with WarpPay!! The all-in-one payments miniapp by @lopezonchain.eth 🚀 Send anything, anywhere to anyone just with a farcaster name, create request links, scheduled transfers, or even EARN! https://warpcast.com/miniapps/V0727cQCBnfX/warppay- `;
    const url = `https://warpcast.com/~/compose?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  }, []);

  // Preload all data once
  useEffect(() => {
    (async () => {
      const context = (await sdk.context) as Context.FrameContext;
      const userFid = context?.user.fid;

      if (userFid) {
        try {
          const [followingRes, followersRes] = await Promise.all([
            warpcast.getFollowing(Number(userFid)),
            warpcast.getFollowers(Number(userFid))
          ]);
          setDataByType({
            following: followingRes.users,
            followers: followersRes,
            least_interacted: followingRes.leastInteracted.users
          });
        } catch (err) {
          console.error(err);
          //setModalMessage("Error loading data");
        }
      }
    })();
  }, []);

  // Derived and filtered list
  const recList = dataByType[recType] || [];
  const filteredList = recList
    .filter(u => {
      const term = searchTerm.trim().toLowerCase();
      const name = (u.displayName ?? "").toLowerCase();
      const user = (u.username ?? "").toLowerCase();
      return name.includes(term) || user.includes(term);
    })
    .filter(u => u.followerCount >= minFollowers);

  // Selection handlers (global)
  const toggleSelect = (fid: number) => {
    setSelectedFids(prev =>
      prev.includes(fid) ? prev.filter(id => id !== fid) : [...prev, fid]
    );
  };
  const handleAutoSelect = () => {
    const slice = filteredList.slice(0, autoCount).map(u => u.fid);
    setSelectedFids(slice);
  };

  const handleRandomSelect = () => {
    const pool = [...filteredList];
    // barajamos
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    setSelectedFids(pool.slice(0, autoCount).map(u => u.fid));
  };

  // Amount parser
  async function parseAmount(amt: string) {
    if (tokenOption === "ETH") return parseEther(amt);
    const decimals = (await publicClient?.readContract({
      address: tokenAddress!,
      abi: [{ type: "function", name: "decimals", stateMutability: "view", inputs: [], outputs: [{ internalType: "uint8", name: "", type: "uint8" }] }],
      functionName: "decimals",
    })) as number;
    return parseUnits(amt, decimals);
  }

  // Airdrop handler
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

        // 1) Obtenemos las direcciones primarias de todos los FID seleccionados
        let primaryResults: PrimaryAddressResult[];
        try {
          primaryResults = await warpcast.getPrimaryAddresses(selectedFids);
        } catch (e) {
          console.error(e);
          setModalMessage("Error fetching primary addresses");
          return;
        }

        // 2) Construimos recipients y values sólo con los que tuvieron éxito
        for (const { fid, success, address } of primaryResults) {
          if (success && address?.address) {
            recipients.push(address.address as `0x${string}`);
            values.push(await parseAmount(amountPerRecipient));
          } else {
            console.warn(`No primary address for fid ${fid}`);
          }
        }

        if (recipients.length === 0) {
          setModalMessage("No valid wallet addresses found");
          return;
        }
      } else if (mode === "manual") {
        if (useSameAmount && !amountPerRecipient) {
          setModalMessage("Enter the common amount");
          return;
        }
        for (const { addr, amt } of manualRows) {
          if (!addr) continue;
          const resolved = addr.startsWith("0x") ? (addr as `0x${string}`) : await resolveRecipient(addr);
          const amountStr = useSameAmount ? amountPerRecipient : amt;
          if (!amountStr) continue;
          recipients.push(resolved);
          values.push(await parseAmount(amountStr));
        }
      } else {
        if (useSameAmount && !amountPerRecipient) {
          setModalMessage("Enter the common amount");
          return;
        }
        for (const line of csvText.split(/\r?\n/)) {
          if (!line.trim()) continue;
          const [addrPart, amtPart] = line.split(",");
          const addr = addrPart.trim();
          const amt = useSameAmount ? amountPerRecipient : (amtPart?.trim() ?? "");
          if (!addr || !amt) continue;
          const resolved = addr.startsWith("0x") ? (addr as `0x${string}`) : await resolveRecipient(addr);
          recipients.push(resolved);
          values.push(await parseAmount(amt));
        }
      }

      if (!recipients.length) {
        setModalMessage("No valid recipients found");
        return;
      }
      setModalMessage("Multisending…");
      const tx = await createAirdrop(walletClient, publicClient, tokenAddress, recipients, values);
      setModalMessage(null);
      setShowSuccess(true);
    } catch (err) {
      setModalMessage(`Error: ${(err as Error).message}`);
    }
  };

  // Non-Base notice
  if (chainId && chainId !== 8453 && chainId !== 10143) {
    return (
      <div className="p-4 text-white bg-[#0f0d14] flex flex-col">
        <button onClick={onBack} className="mb-4 flex items-center justify-center text-purple-400 text-lg px-4 py-2 bg-[#1a1725] rounded-lg max-w-[200px]">
          <FiArrowLeft className="w-6 h-6 mr-2" /> Back
        </button>
        <h2 className="text-2xl font-bold mb-6 mx-auto">Airdrop</h2>
        <div className="p-4 text-white bg-[#0f0d14] min-h-screen flex items-start justify-center">
          Only working on Base and Monad Testnet... yet! Send your suggestions
        </div>
      </div>
    );
  }

  // Main render
  return (
    <div className="p-4 text-white bg-[#0f0d14] flex flex-col">
      <button onClick={onBack} className="mb-4 flex items-center justify-center text-purple-400 text-lg px-4 py-2 bg-[#1a1725] rounded-lg max-w-[200px]">
        <FiArrowLeft className="w-6 h-6 mr-2" /> Back
      </button>
      <h2 className="text-2xl font-bold mb-6 mx-auto">Airdrop</h2>

      <div className="space-y-4 w-full">
        <TokenSelector
          selected={tokenOption}
          onSelect={setTokenOption}
          customAddress={contractAddress}
          onCustomAddressChange={setContractAddress}
          chainId={walletClient?.chain.id ?? 1}
        />
      </div>

      <div className="flex space-x-2 mt-4 mb-6 justify-center items-center">
        {(["recommended", "csv", "manual"] as Mode[]).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-4 py-2 rounded-full text-sm font-medium ${mode === m ? "bg-purple-600 text-white" : "bg-[#1a1725] text-gray-300 hover:bg-[#2a2438]"}`}
          >
            {m === "recommended" ? "Recommended" : m === "manual" ? "Manual" : "CSV"}
          </button>
        ))}
      </div>

      <div className="space-y-4 flex flex-col items-end w-full">
        {mode === "recommended" && (
          <>
            <input
              type="number"
              placeholder="Amount for each recipient"
              className="w-full p-3 rounded-lg bg-[#1a1725] text-white mb-2"
              value={amountPerRecipient}
              onChange={e => setAmountPerRecipient(e.target.value)}
            />

            {mode == 'recommended' && (
              <button
                onClick={handleAirdrop}
                className="
                 fixed z-50            /* siempre encima */
                 bottom-2                  /* 0.5rem desde arriba */
                 left-1/2               /* posiciona el left en 50% */
                 transform -translate-x-1/2 /* centra horizontalmente */
                 w-11/12 sm:w-1/2       /* ancho responsivo */
                 py-4 rounded-2xl mt-4  /* padding y bordes */
                 font-bold bg-purple-600 hover:bg-purple-700
                 text-lg
               "
              >
                Send Airdrop
              </button>
            )}
            <div className="flex space-x-2 mb-2">
              {(["following", "followers", "least_interacted"] as RecType[]).map(type => (
                <button
                  key={type}
                  onClick={() => setRecType(type)}
                  className={`px-3 py-1 rounded-lg text-sm ${recType === type ? "bg-purple-600 text-white" : "bg-[#1a1725] text-gray-300"}`}
                >
                  {type === "following"
                    ? "Following"
                    : type === "followers"
                      ? "Followers"
                      : "Least Interacted"}
                </button>
              ))}
            </div>
            <div className="flex flex-col items-center w-full">
              {/* Filtro de seguidores */}
              <div className="flex flex-col w-full">
                <label htmlFor="minFollowers" className="mb-1 text-sm text-gray-400">
                  Min Followers
                </label>
                <input
                  id="minFollowers"
                  type="number"
                  min={0}
                  placeholder="0"
                  value={minFollowers}
                  onChange={e => setMinFollowers(Number(e.target.value))}
                  className="w-full p-2 rounded-lg bg-[#1a1725] text-white"
                />
              </div>

              {/* Auto-select */}
              <div className="flex flex-col w-full mt-2">
                <label htmlFor="autoCount" className="mb-1 text-sm text-gray-400">
                  Auto-select
                </label>

                <div className="flex flex-col sm:flex-row gap-2 w-full">
                  <input
                    id="autoCount"
                    type="number"
                    min={1}
                    value={autoCount}
                    onChange={e => setAutoCount(Number(e.target.value))}
                    className="p-2 rounded-lg bg-[#1a1725] text-white w-full sm:w-auto sm:rounded-l-lg sm:rounded-r-none"
                  />
                  <button
                    onClick={handleAutoSelect}
                    className="px-4 py-2 bg-purple-600 text-sm font-medium w-full sm:w-auto sm:rounded-none"
                  >
                    Select first {autoCount}
                  </button>
                  <button
                    onClick={handleRandomSelect}
                    className="px-4 py-2 bg-purple-600 text-sm font-medium w-full sm:w-auto sm:rounded-r-lg sm:rounded-l-none"
                  >
                    Select {autoCount} randomly
                  </button>
                </div>
              </div>

              {/* Buscador */}
              <div className="flex flex-col w-full mt-2">
                <label htmlFor="searchTerm" className="mb-1 text-sm text-gray-400">
                  Search
                </label>
                <input
                  id="searchTerm"
                  type="text"
                  placeholder="Fc name or username"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full p-2 rounded-lg bg-[#1a1725] text-white"
                />
              </div>
            </div>

            {filteredList.length === 0 ? (
              <p className="w-full text-center text-gray-500">
                Open in Farcaster to get data
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {filteredList.map(user => {
                  const isSelected = selectedFids.includes(user.fid);
                  return (
                    <label
                      key={user.fid}
                      className={`relative overflow-hidden flex flex-col justify-end p-4 h-32 rounded-3xl cursor-pointer bg-cover bg-center shadow-lg transition-transform transform border-2 ${isSelected
                        ? 'border-purple-500 scale-105'
                        : 'border-transparent'
                        } hover:scale-[1.02]`}
                      style={{ backgroundImage: `url(${user.pfp?.url})` }}
                    >
                      <input
                        type="checkbox"
                        className="absolute inset-0 w-full h-full opacity-0 peer cursor-pointer rounded-3xl"
                        checked={isSelected}
                        onChange={() => toggleSelect(user.fid)}
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-50 rounded-3xl pointer-events-none" />
                      <div className="relative z-10 text-white drop-shadow-[0_0_2px_black]">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h3 className="text-lg font-semibold truncate">
                              {user.displayName}
                            </h3>
                            <p className="text-sm opacity-80">
                              @{user.username}
                            </p>
                          </div>
                          {user.verified && (
                            <svg
                              className="w-5 h-5 text-blue-400"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M10 0l3 6 6 .5-4.5 4 1 6-5.5-3-5.5 3 1-6L1 6.5 7 6z" />
                            </svg>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs opacity-90">
                          <span>{user.followerCount} followers</span>
                          <span>{user.followingCount} following</span>
                        </div>
                      </div>
                      <div className="absolute top-3 right-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity">
                        <svg
                          className="w-6 h-6"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </>
        )}

        {mode === "manual" && (
          <>
            <label className="flex items-center space-x-2 mb-2">
              <input type="checkbox" checked={useSameAmount} onChange={() => setUseSameAmount(!useSameAmount)} />
              <span className="text-sm">Same amount for all</span>
            </label>
            {useSameAmount && (
              <input
                type="number"
                placeholder="Amount for each recipient"
                className="w-full p-3 rounded-lg bg-[#1a1725] text-white mb-2"
                value={amountPerRecipient}
                onChange={e => setAmountPerRecipient(e.target.value)}
              />)}
            {manualRows.map((row, i) => (
              <div key={i} className="flex space-x-2 mb-2 w-full">
                <input
                  type="text"
                  placeholder="Address / ENS / Farcaster user"
                  className="flex-1 p-2 rounded-lg bg-[#1a1725] text-white"
                  value={row.addr}
                  onChange={e => setManualRows(r => r.map((x, j) => j === i ? { ...x, addr: e.target.value } : x))}
                />
                {!useSameAmount && (
                  <input
                    type="number"
                    placeholder="Amount"
                    className="w-32 p-2 rounded-lg bg-[#1a1725] text-white"
                    value={row.amt}
                    onChange={e => setManualRows(r => r.map((x, j) => j === i ? { ...x, amt: e.target.value } : x))}
                  />
                )}
              </div>
            ))}
            <button onClick={() => setManualRows(r => [...r, { addr: "", amt: "" }])} className="mt-2 px-4 py-2 bg-purple-600 rounded-lg text-sm align-right">
              + Add Recipient
            </button>
          </>
        )}

        {mode === "csv" && (
          <>
            <label className="flex items-center space-x-2 mb-2">
              <input type="checkbox" checked={useSameAmount} onChange={() => setUseSameAmount(!useSameAmount)} />
              <span className="text-sm">Same amount for all</span>
            </label>
            {useSameAmount && (
              <input
                type="number"
                placeholder="Amount for each recipient"
                className="w-full p-3 rounded-lg bg-[#1a1725] text-white mb-2"
                value={amountPerRecipient}
                onChange={e => setAmountPerRecipient(e.target.value)}
              />)}
            <textarea
              placeholder={useSameAmount ? "One recipient Farcaster user, ENS or wallet per line" : "recipient,amount per line"}
              className="w-full h-40 p-3 rounded-lg bg-[#1a1725] text-white"
              value={csvText}
              onChange={e => setCsvText(e.target.value)}
            />
          </>
        )}
      </div>

      {mode !== 'recommended' && (
        <button
          onClick={handleAirdrop}
          className="w-full py-4 rounded-2xl mt-4 font-bold bg-purple-600 hover:bg-purple-700 text-lg"
        >
          Send Airdrop
        </button>
      )}

      {modalMessage && <AlertModal message={modalMessage} onClose={() => setModalMessage(null)} />}
      {/* Modal de éxito en la parte baja */}
      {showSuccess && (
        <SuccessModal
          onClose={() => setShowSuccess(false)}
          onShare={handleShare}
          onAdd={handleAddFrame}
        />
      )}
    </div>
  );
};

export default AirdropScreen;
