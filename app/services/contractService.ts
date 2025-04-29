// src/services/contractService.ts

import contractAbi from "./contractAbi.json";

export interface Tx {
  summary: string;
  hash: string;
  timestamp: number;
}

export interface ScheduledPayment {
  creator: `0x${string}`;
  recipient: `0x${string}`;
  value: bigint;
  token: `0x${string}`;
  executeTime: bigint;
  isExecuted: boolean;
  isFailed: boolean;
  failCount: number;
  cyclicId: bigint;
}

// Address of your WarpPay contract
const WARPPAY_CONTRACT = process.env.NEXT_PUBLIC_WARPPAY_BASE_CONTRACT!;

/**
 * Sends ETH or ERC-20 tokens using walletClient.
 */
export async function sendTokens(
  walletClient: any,
  from: `0x${string}`,
  to: `0x${string}`,
  amount: bigint,
  tokenAddress?: `0x${string}`
): Promise<Tx> {
  if (!walletClient) throw new Error("No wallet client available");

  let txHash: string;
  if (tokenAddress) {
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
    txHash = await walletClient.sendTransaction({
      to,
      value: amount,
    });
  }

  return {
    summary: tokenAddress
      ? `Tokens sent to ${to}`
      : `ETH sent to ${to}`,
    hash: txHash,
    timestamp: Date.now(),
  };
}

/**
 * Creates a mass airdrop via WarpPay.multisendEther or .multisendToken.
 */
export async function createAirdrop(
  walletClient: any,
  tokenAddress: `0x${string}` | null,
  recipients: `0x${string}`[],
  values: bigint[]
): Promise<Tx> {
  if (!walletClient) throw new Error("No wallet client available");

  let txHash: string;
  if (tokenAddress) {
    txHash = await walletClient.writeContract({
      address: WARPPAY_CONTRACT,
      abi: contractAbi,
      functionName: "multisendToken",
      args: [tokenAddress, recipients, values],
    });
  } else {
    const total = values.reduce((acc, v) => acc + v, 0n);
    txHash = await walletClient.writeContract({
      address: WARPPAY_CONTRACT,
      abi: contractAbi,
      functionName: "multisendEther",
      args: [recipients, values],
      value: total,
    });
  }

  return {
    summary: `Airdrop of ${tokenAddress ? "ERC-20 tokens" : "ETH"} to ${recipients.length} recipients`,
    hash: txHash,
    timestamp: Date.now(),
  };
}

/**
 * Schedule a one-time payment.
 */
export async function schedulePayment(
  walletClient: any,
  recipient: `0x${string}`,
  value: bigint,
  tokenAddress: `0x${string}` | null,
  executeTime: number
): Promise<Tx> {
  if (!walletClient) throw new Error("No wallet client available");

  const token = tokenAddress ?? "0x0000000000000000000000000000000000000000";
  const overrides: any = {};
  if (token === "0x0000000000000000000000000000000000000000") {
    overrides.value = value;
  }

  const txHash = await walletClient.writeContract({
    address: WARPPAY_CONTRACT,
    abi: contractAbi,
    functionName: "schedulePayment",
    args: [recipient, value, token, BigInt(executeTime)],
    ...overrides,
  });

  return {
    summary: `Scheduled payment to ${recipient} at ${new Date(executeTime * 1000).toLocaleString()}`,
    hash: txHash,
    timestamp: Date.now(),
  };
}

/**
 * Schedule a cyclic series of payments.
 */
export async function scheduleCyclicPayment(
  walletClient: any,
  recipient: `0x${string}`,
  value: bigint,
  tokenAddress: `0x${string}` | null,
  interval: number,
  firstExecuteTime: number,
  repetitions: number
): Promise<Tx> {
  if (!walletClient) throw new Error("No wallet client available");

  const token = tokenAddress ?? "0x0000000000000000000000000000000000000000";
  const overrides: any = {};
  if (token === "0x0000000000000000000000000000000000000000") {
    overrides.value = value * BigInt(repetitions);
  }

  const txHash = await walletClient.writeContract({
    address: WARPPAY_CONTRACT,
    abi: contractAbi,
    functionName: "scheduleCyclicPayment",
    args: [
      recipient,
      value,
      token,
      BigInt(interval),
      BigInt(firstExecuteTime),
      BigInt(repetitions),
    ],
    ...overrides,
  });

  return {
    summary: `Scheduled cycle of ${repetitions} payments to ${recipient} every ${interval}s`,
    hash: txHash,
    timestamp: Date.now(),
  };
}

/**
 * Cancel an active scheduled payment.
 */
export async function cancelActivePayment(
  walletClient: any,
  paymentId: bigint
): Promise<Tx> {
  if (!walletClient) throw new Error("No wallet client available");

  const txHash = await walletClient.writeContract({
    address: WARPPAY_CONTRACT,
    abi: contractAbi,
    functionName: "cancelActivePayment",
    args: [paymentId],
  });

  return {
    summary: `Cancelled schedule #${paymentId}`,
    hash: txHash,
    timestamp: Date.now(),
  };
}

/**
 * Cancel a cyclic payment series.
 */
export async function cancelCyclicPayment(
  walletClient: any,
  cyclicId: bigint
): Promise<Tx> {
  if (!walletClient) throw new Error("No wallet client available");

  const txHash = await walletClient.writeContract({
    address: WARPPAY_CONTRACT,
    abi: contractAbi,
    functionName: "cancelCyclicPayment",
    args: [cyclicId],
  });

  return {
    summary: `Cancelled cycle #${cyclicId}`,
    hash: txHash,
    timestamp: Date.now(),
  };
}

/**
 * Execute up to `limit` due payments.
 */
export async function executeDuePaymentsBatch(
  walletClient: any,
  limit: number
): Promise<Tx> {
  if (!walletClient) throw new Error("No wallet client available");

  const txHash = await walletClient.writeContract({
    address: WARPPAY_CONTRACT,
    abi: contractAbi,
    functionName: "executeDuePaymentsBatch",
    args: [BigInt(limit)],
  });

  return {
    summary: `Executed up to ${limit} due payments`,
    hash: txHash,
    timestamp: Date.now(),
  };
}

/**
 * Execute the single most overdue payment.
 */
export async function executeSinglePayment(
  walletClient: any
): Promise<Tx> {
  if (!walletClient) throw new Error("No wallet client available");

  const txHash = await walletClient.writeContract({
    address: WARPPAY_CONTRACT,
    abi: contractAbi,
    functionName: "executeSinglePayment",
    args: [],
  });

  return {
    summary: `Executed one overdue payment`,
    hash: txHash,
    timestamp: Date.now(),
  };
}

/**
 * Get indexes and overdue times of due payments.
 */
export async function getDuePayments(
  walletClient: any
): Promise<{ indexes: bigint[]; overdueTimes: bigint[] }> {
  if (!walletClient) throw new Error("No wallet client available");

  const [indexes, overdueTimes] = await walletClient.readContract({
    address: WARPPAY_CONTRACT,
    abi: contractAbi,
    functionName: "getDuePayments",
    args: [],
  });
  return { indexes, overdueTimes };
}

/**
 * Get a paginated list of payments by status.
 */
export async function getPaymentsByStatus(
  walletClient: any,
  status: number,
  offset: number,
  limit: number
): Promise<ScheduledPayment[]> {
  if (!walletClient) throw new Error("No wallet client available");

  const list = await walletClient.readContract({
    address: WARPPAY_CONTRACT,
    abi: contractAbi,
    functionName: "getPaymentsByStatus",
    args: [status, BigInt(offset), BigInt(limit)],
  });

  return list as ScheduledPayment[];
}

/**
 * Fetch transaction history (Etherscan).
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
