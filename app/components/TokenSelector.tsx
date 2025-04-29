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
  [mainnet.id]:  "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  [base.id]:     "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
};

export default function TokenSelector({
  selected,
  onSelect,
  customAddress,
  onCustomAddressChange,
  chainId,
}: TokenSelectorProps) {
  // Determine if USDC is supported on this chain
  const hasUsdc = chainId in USDC_ADDRESSES;
  // Get the USDC address or fallback to mainnet/base if needed
  const usdcAddress = USDC_ADDRESSES[chainId] ?? USDC_ADDRESSES[base.id]!;

  // Whenever user selects USDC or chain changes, auto‐fill its address
  useEffect(() => {
    if (selected === "USDC" && hasUsdc) {
      onCustomAddressChange(usdcAddress);
    }
  }, [selected, chainId, usdcAddress, hasUsdc, onCustomAddressChange]);

  // Build the list of buttons dynamically
  const options: TokenOption[] = hasUsdc
    ? ["ETH", "USDC", "CUSTOM"]
    : ["ETH", "CUSTOM"];

  return (
    <>
      <div className="flex space-x-2">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => {
              onSelect(opt);
              if (opt === "ETH") {
                onCustomAddressChange("");
              }
              // USDC will be handled by the useEffect above
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
