// src/services/api.ts

import { parseEther } from "viem";

export interface Tx {
  summary: string;
  hash: string;
  timestamp: number;
}

/**
 * Envía ETH o ERC-20 con walletClient.
 * @param walletClient - client de firma de wagmi
 * @param from - dirección emisora
 * @param to - dirección receptora
 * @param amount - cantidad en wei (bigint)
 * @param tokenAddress - si se define, transfer ERC-20; si no, ETH.
 */
export async function sendTokens(
    walletClient: any,
    from: `0x${string}`,
    to: `0x${string}`,
    amount: bigint,
    tokenAddress?: `0x${string}`
  ): Promise<Tx> {
    if (!walletClient) throw new Error("No wallet client disponible");
  
    let txHash: string;
    if (tokenAddress) {
      // ERC-20 transfer usando ABI JSON
      txHash = await walletClient.writeContract({
        address: tokenAddress,
        abi: [
          {
            type: "function",
            name: "transfer",
            stateMutability: "nonpayable",
            inputs: [
              { internalType: "address", name: "to", type: "address" },
              { internalType: "uint256", name: "amount", type: "uint256" },
            ],
            outputs: [{ internalType: "bool", name: "", type: "bool" }],
          },
        ],
        functionName: "transfer",
        args: [to, amount],
      });
    } else {
      // ETH transfer
      txHash = await walletClient.sendTransaction({
        to,
        value: amount,
      });
    }
  
    return {
      summary: tokenAddress
        ? `Enviados tokens a ${to}`
        : `Enviados ETH a ${to}`,
      hash: txHash,
      timestamp: Date.now(),
    };
  }
  

/**
 * Reclama faucet de ETH (o ERC-20 si tu contrato lo soporta).
 * contrato en NEXT_PUBLIC_FAUCET_CONTRACT con método claim(uint256).
 */
export async function requestTokens(
  walletClient: any,
  amount: bigint
): Promise<Tx> {
  if (!walletClient) throw new Error("No wallet client disponible");
  const faucet = process.env.NEXT_PUBLIC_FAUCET_CONTRACT!;

  const txHash = await walletClient.writeContract({
    address: faucet,
    abi: ["function claim(uint256 amount)"],
    functionName: "claim",
    args: [amount],
  });

  return {
    summary: `Reclamados faucet`,
    hash: txHash,
    timestamp: Date.now(),
  };
}

/**
 * Crea un airdrop en tu contrato: NEXT_PUBLIC_AIRDROP_CONTRACT
 */
export async function createAirdrop(
  walletClient: any,
  tokenAddress: `0x${string}` | null,
  total: bigint,
  recipients: number
): Promise<Tx> {
  if (!walletClient) throw new Error("No wallet client disponible");
  const airdrop = process.env.NEXT_PUBLIC_AIRDROP_CONTRACT!;

  // Si tokenAddress null, se asume ETH w/ address cero
  const token = tokenAddress ?? "0x0000000000000000000000000000000000000000";

  const txHash = await walletClient.writeContract({
    address: airdrop,
    abi: [
      "function createAirdrop(address token, uint256 total, uint256 recipients)",
    ],
    functionName: "createAirdrop",
    args: [token, total, BigInt(recipients)],
  });

  return {
    summary: `Airdrop creado`,
    hash: txHash,
    timestamp: Date.now(),
  };
}

/**
 * Obtiene historial de envíos (solo usando Etherscan API).
 */
export async function fetchHistory(
  address: string
): Promise<Tx[]> {
  const apiKey = process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY!;
  const url =
    `https://api.etherscan.io/api?module=account&action=txlist&address=${address}` +
    `&startblock=0&endblock=99999999&sort=desc&apikey=${apiKey}`;

  const res = await fetch(url);
  const data = await res.json();
  if (data.status !== "1") {
    throw new Error(data.message || "Error fetching history");
  }

  return (data.result as any[])
    .filter((tx) => tx.from.toLowerCase() === address.toLowerCase())
    .map((tx) => ({
      summary: `To ${tx.to}: ${Number(tx.value) / 1e18} ETH`,
      hash: tx.hash,
      timestamp: Number(tx.timeStamp) * 1000,
    }));
}
