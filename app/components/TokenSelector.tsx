// src/components/TokenSelector.tsx
import React, { useEffect } from "react";
import {
  base,
  mainnet,
  arbitrum,
  optimism,
  polygon,
  avalanche,
  fantom,
  gnosis,
  celo,
} from "wagmi/chains";

export type TokenOption = "ETH" | "USDC" | "CUSTOM";

interface TokenSelectorProps {
  selected: TokenOption;
  onSelect: (t: TokenOption) => void;
  customAddress: string;
  onCustomAddressChange: (addr: string) => void;
  chainId: number;
}

// map of USDC per chain
const USDC_ADDRESSES: Record<number, string> = {
  [mainnet.id]:   "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  [polygon.id]:   "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
  [arbitrum.id]:  "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8",
  [optimism.id]:  "0x7F5c764cBc14f9669B88837ca1490f6F85a0dE8",
  [avalanche.id]: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
  [fantom.id]:    "0x04068DA6C83AFCFA0e13ba15A6696662335D5B75",
  [gnosis.id]:    "0xdf1742fE5b0bFc12331D8EAec6b478DfDbD31464",
  [celo.id]:      "0x765DE816845861e75A25fCA122bb6898B8B1282a",
  [base.id]:      "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
};

export default function TokenSelector({
  selected,
  onSelect,
  customAddress,
  onCustomAddressChange,
  chainId,
}: TokenSelectorProps) {
  const usdcAddress = USDC_ADDRESSES[chainId] || USDC_ADDRESSES[base.id]!;

  // ↪️ whenever we switch to USDC *or* the chainId changes, update the address
  useEffect(() => {
    if (selected === "USDC") {
      onCustomAddressChange(usdcAddress);
    }
  }, [selected, chainId, usdcAddress, onCustomAddressChange]);

  return (
    <>
      <div className="flex space-x-2">
        {(["ETH", "USDC", "CUSTOM"] as TokenOption[]).map((opt) => (
          <button
            key={opt}
            onClick={() => {
              onSelect(opt);
              if (opt === "ETH") onCustomAddressChange("");
              // no need here to handle USDC; the effect above will do it
            }}
            className={`flex-1 py-3 rounded-lg text-base font-medium
              ${selected === opt ? "bg-purple-600" : "bg-[#1a1725]"}
              hover:bg-purple-500 transition`}
          >
            {opt === "CUSTOM" ? "Custom Token" : opt}
          </button>
        ))}
      </div>

      {selected === "CUSTOM" && (
        <input
          type="text"
          placeholder="Token Contract Address"
          className="w-full p-4 rounded-lg bg-[#1a1725] text-white text-base"
          value={customAddress}
          onChange={(e) => onCustomAddressChange(e.target.value)}
        />
      )}
    </>
  );
}
