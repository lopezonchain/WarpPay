// src/services/api.ts

import { parseUnits, parseEther } from "viem";

export interface Tx {
  summary: string;
  hash: string;
  timestamp: number;
}

/**
 * Envía ETH o ERC-20 directamente con walletClient.
 * Si tokenAddress está definido, hace transfer() de ERC-20;
 * si no, sendTransaction de ETH.
 */
export async function sendTokens(
  walletClient: any,
  from: `0x${string}`,
  to: `0x${string}`,
  amount: string,
  tokenAddress?: `0x${string}`
): Promise<Tx> {
  if (!walletClient) throw new Error("No wallet client disponible");

  // ERC-20 transfer
  if (tokenAddress) {
    // Leer decimales
    const decimals = (await walletClient.readContract({
      address: tokenAddress,
      abi: ["function decimals() view returns (uint8)"],
      functionName: "decimals",
    })) as number;

    // Parsar unidad humana → unidades de contrato
    const parsed = parseUnits(amount, decimals);

    // Llamar a transfer(to, parsed)
    const txHash = await walletClient.writeContract({
      address: tokenAddress,
      abi: ["function transfer(address to, uint256 amount) returns (bool)"],
      functionName: "transfer",
      args: [to, parsed],
    });

    await walletClient.waitForTransactionReceipt({ hash: txHash });

    return {
      summary: `Transferidos ${amount} tokens (ERC-20) a ${to}`,
      hash: txHash,
      timestamp: Date.now(),
    };
  }

  // ETH transfer
  const value = parseEther(amount);
  const txHash = await walletClient.sendTransaction({ to, value });
  await walletClient.waitForTransactionReceipt({ hash: txHash });

  return {
    summary: `Enviados ${amount} ETH a ${to}`,
    hash: txHash,
    timestamp: Date.now(),
  };
}

/**
 * Reclama faucet de ETH (o de tokens, si tu faucet soporta ERC-20):
 * contrato en NEXT_PUBLIC_FAUCET_CONTRACT con método claim(uint256).
 */
export async function requestTokens(
  walletClient: any,
  amount: string
): Promise<Tx> {
  if (!walletClient) throw new Error("No wallet client disponible");
  const faucet = process.env.NEXT_PUBLIC_FAUCET_CONTRACT!;
  const parsed = parseEther(amount);

  const txHash = await walletClient.writeContract({
    address: faucet,
    abi: ["function claim(uint256 amount)"],
    functionName: "claim",
    args: [parsed],
  });
  await walletClient.waitForTransactionReceipt({ hash: txHash });

  return {
    summary: `Reclamados ${amount} de faucet`,
    hash: txHash,
    timestamp: Date.now(),
  };
}

/**
 * Crea un airdrop en tu contrato: NEXT_PUBLIC_AIRDROP_CONTRACT
 * ABI: createAirdrop(address token, uint256 total, uint256 recipients)
 */
export async function createAirdrop(
  walletClient: any,
  tokenAddress: `0x${string}` | null,
  total: string,
  recipients: number
): Promise<Tx> {
  if (!walletClient) throw new Error("No wallet client disponible");
  const airdrop = process.env.NEXT_PUBLIC_AIRDROP_CONTRACT!;

  // Si tokenAddress es null, usamos la dirección cero para ETH
  const token = tokenAddress ?? "0x0000000000000000000000000000000000000000";

  // Calcular unidades
  const parsedTotal = tokenAddress
    ? parseUnits(
        total,
        (await walletClient.readContract({
          address: tokenAddress,
          abi: ["function decimals() view returns (uint8)"],
          functionName: "decimals",
        })) as number
      )
    : parseEther(total);

  const txHash = await walletClient.writeContract({
    address: airdrop,
    abi: [
      "function createAirdrop(address token, uint256 total, uint256 recipients)",
    ],
    functionName: "createAirdrop",
    args: [token, parsedTotal, BigInt(recipients)],
  });
  await walletClient.waitForTransactionReceipt({ hash: txHash });

  return {
    summary: `Airdrop creado: ${total} ${
      tokenAddress ? "tokens" : "ETH"
    } a ${recipients} destinatarios`,
    hash: txHash,
    timestamp: Date.now(),
  };
}

/**
 * Obtiene historial de transacciones salientes usando Etherscan API.
 * Necesitas definir NEXT_PUBLIC_ETHERSCAN_API_KEY en .env.
 */
export async function fetchHistory(
  address: string
): Promise<Tx[]> {
  const apiKey = process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY!;
  const url = `https://api.etherscan.io/api?module=account&action=txlist&address=${address}` +
    `&startblock=0&endblock=99999999&sort=desc&apikey=${apiKey}`;

  const res = await fetch(url);
  const data = await res.json();
  if (data.status !== "1") {
    throw new Error(data.message || "Error fetching history");
  }

  // Filtrar solo las transacciones que salgan de la dirección
  return (data.result as any[])
    .filter((tx) => tx.from.toLowerCase() === address.toLowerCase())
    .map((tx) => ({
      summary: `To ${tx.to}: ${Number(tx.value) / 1e18} ETH`,
      hash: tx.hash,
      timestamp: Number(tx.timeStamp) * 1000,
    }));
}
