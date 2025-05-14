// src/services/contractService.ts
import { Chain } from "viem";
import contractAbi from "./contractAbi.json";
import { resolveEnsName } from "./ensResolver";

export const erc20Abi = [
  {
    "inputs": [
      { "internalType": "address", "name": "spender", "type": "address" },
      { "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "approve",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "recipient", "type": "address" },
      { "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "transfer",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "sender", "type": "address" },
      { "internalType": "address", "name": "recipient", "type": "address" },
      { "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "transferFrom",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "decimals",
    "outputs": [{ "internalType": "uint8", "name": "", "type": "uint8" }],
    "stateMutability": "view",
    "type": "function"
  }
];

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

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"

// Address of your WarpPay contract
const WARPPAY_CONTRACT_BASE = process.env.NEXT_PUBLIC_WARPPAY_BASE_CONTRACT!;
const WARPPAY_CONTRACT_MONAD = process.env.NEXT_PUBLIC_WARPPAY_MONAD_CONTRACT!;

export function getWarpPayContract(chainId: number): `0x${string}` {
  switch (chainId) {
    case 8453:
      return WARPPAY_CONTRACT_BASE as `0x${string}`;
    case 10143:
      return WARPPAY_CONTRACT_MONAD as `0x${string}`;
    default:
      throw new Error(`WarpPay no soportado en chainId ${chainId}`);
  }
}

/**
 * Sends ETH or ERC-20 tokens using walletClient.
 */
export async function sendTokens(
  walletClient: any,
  to: string,               // can be hex or ENS
  amount: bigint,
  tokenAddress?: `0x${string}`
): Promise<Tx> {
  if (!walletClient) throw new Error("No wallet client available");

  // 2️⃣ Resolve ENS names
  let recipient: `0x${string}`;
  if (!to.startsWith("0x")) {
    recipient = await resolveEnsName(to);
  } else {
    recipient = to as `0x${string}`;
  }

  // 3️⃣ Dispatch the transaction on the user’s chosen chain
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
      args: [recipient, amount],
    });
  } else {
    txHash = await walletClient.sendTransaction({
      to: recipient,
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
  publicClient: any,
  tokenAddress: `0x${string}` | null,
  recipients: `0x${string}`[],
  values: bigint[]
): Promise<Tx> {
  if (!walletClient) throw new Error("No wallet client available");

  let txHash: string;

  const chainId: number = walletClient.chain.id;
  const warpPayContract = getWarpPayContract(chainId);

  if (tokenAddress) {
    // 1) Calcular neto total y fee
    const totalNet = values.reduce((acc, v) => Number(acc) + Number(v), 0);
    const totalFee = (BigInt(totalNet) * BigInt(2)) / BigInt(100);

    // 2) Aprobar al contrato la suma neta + fee
    const approveTxHash = await walletClient.writeContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: "approve",
      args: [warpPayContract, BigInt(totalNet) + totalFee],
    });

    // 3) Esperar a que la aprobación sea confirmada
    await publicClient.waitForTransactionReceipt({
      hash: approveTxHash,
    });

    // 4) Llamar a multisendToken con los valores netos
    txHash = await walletClient.writeContract({
      address: warpPayContract,
      abi: contractAbi,
      functionName: "multisendToken",
      args: [tokenAddress, recipients, values],
    });
  } else {
    const totalNet = values.reduce((acc, v) => Number(acc) + Number(v), 0);
    const totalFee = (BigInt(totalNet) * BigInt(2)) / BigInt(100);

    txHash = await walletClient.writeContract({
      address: warpPayContract,
      abi: contractAbi,
      functionName: "multisendEther",
      args: [recipients, values],
      value: BigInt(totalNet) + totalFee,
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
  publicClient: any,
  recipientRaw: string,
  value: bigint,
  tokenAddressRaw: string | null,
  executeTime: number
): Promise<Tx> {
  if (!walletClient || !publicClient) throw new Error("No wallet or public client")

  // 1️⃣ Prepara direcciones y contrato
  const recipient = recipientRaw.startsWith("0x")
    ? (recipientRaw as `0x${string}`)
    : await resolveEnsName(recipientRaw)
  const token = tokenAddressRaw ?? ZERO_ADDRESS
  const warpPay = getWarpPayContract(walletClient.chain.id)

  // 2️⃣ Verifica flags y mínimos on-chain
  const creationPaused = await publicClient.readContract({
    address: warpPay,
    abi: [{ inputs: [], name: "creationPaused", outputs: [{ type: "bool" }], stateMutability: "view", type: "function" }],
    functionName: "creationPaused"
  })
  if (creationPaused) throw new Error("Scheduling paused on-chain")

  const minEthPayment = await publicClient.readContract({
    address: warpPay,
    abi: [{ inputs: [], name: "minEthPayment", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" }],
    functionName: "minEthPayment"
  }) as bigint
  if (value < minEthPayment) throw new Error(`Value below minimum of ${minEthPayment.toString()} wei`)

  // 3️⃣ Lee porcentajes on-chain
  const creationFeePct = await publicClient.readContract({
    address: warpPay,
    abi: [{ inputs: [], name: "creationFeePercent", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" }],
    functionName: "creationFeePercent"
  }) as bigint
  const executorRewardPct = await publicClient.readContract({
    address: warpPay,
    abi: [{ inputs: [], name: "executorRewardPercent", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" }],
    functionName: "executorRewardPercent"
  }) as bigint

  // 4️⃣ Calcula fees y total a enviar
  const creationFee = (value * creationFeePct) / BigInt(100)
  const reward      = (value * executorRewardPct) / BigInt(100)
  const totalValue  = token === ZERO_ADDRESS
    ? value + creationFee + reward
    : BigInt(0)

  console.log("schedulePayment ▶", {
    value: value.toString(),
    creationFee: creationFee.toString(),
    reward: reward.toString(),
    msgValue: totalValue.toString()
  })

  // 5️⃣ Approve si es ERC20
  if (token !== ZERO_ADDRESS) {
    const approveAmount = value + creationFee + reward
    await walletClient.writeContract({
      address: token,
      abi: erc20Abi,
      functionName: "approve",
      args: [warpPay, approveAmount]
    })
  }

  // 6️⃣ Lanza la transacción
  const txHash = await walletClient.writeContract({
    address: warpPay,
    abi: contractAbi,
    functionName: "schedulePayment",
    args: [recipient, value, token, BigInt(executeTime)],
    value: totalValue
  })

  return {
    summary: `Scheduled payment to ${recipient} at ${new Date(executeTime * 1000).toLocaleString()}`,
    hash: txHash,
    timestamp: Date.now()
  }
}

/**
 * Schedule a cyclic series of payments.
 */
export async function scheduleCyclicPayment(
  walletClient: any,
  publicClient: any,
  recipientRaw: string,
  value: bigint,
  tokenAddressRaw: string | null,
  interval: number,
  firstExecuteTime: number,
  repetitions: number
): Promise<Tx> {
  if (!walletClient || !publicClient) throw new Error("No wallet or public client")

  // 1️⃣ Prepara direcciones y contrato
  const recipient = recipientRaw.startsWith("0x")
    ? (recipientRaw as `0x${string}`)
    : await resolveEnsName(recipientRaw)
  const token = tokenAddressRaw ?? ZERO_ADDRESS
  const warpPay = getWarpPayContract(walletClient.chain.id)

  // 2️⃣ Verifica flags y mínimos on-chain
  const creationPaused = await publicClient.readContract({
    address: warpPay,
    abi: [{ inputs: [], name: "creationPaused", outputs: [{ type: "bool" }], stateMutability: "view", type: "function" }],
    functionName: "creationPaused"
  })
  if (creationPaused) throw new Error("Scheduling paused on-chain")

  const minEthPayment = await publicClient.readContract({
    address: warpPay,
    abi: [{ inputs: [], name: "minEthPayment", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" }],
    functionName: "minEthPayment"
  }) as bigint
  if (value < minEthPayment) throw new Error(`Value below minimum of ${minEthPayment.toString()} wei`)
  if (repetitions <= 0) throw new Error("Repetitions must be > 0")

  // 3️⃣ Porcentajes on-chain
  const creationFeePct = await publicClient.readContract({
    address: warpPay,
    abi: [{ inputs: [], name: "creationFeePercent", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" }],
    functionName: "creationFeePercent"
  }) as bigint
  const executorRewardPct = await publicClient.readContract({
    address: warpPay,
    abi: [{ inputs: [], name: "executorRewardPercent", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" }],
    functionName: "executorRewardPercent"
  }) as bigint

  // 4️⃣ Totales y msg.value
  const totalNet    = value * BigInt(repetitions)
  const creationFee = (totalNet * creationFeePct) / BigInt(100)
  const totalReward = (totalNet * executorRewardPct) / BigInt(100)
  const totalValue  = token === ZERO_ADDRESS
    ? totalNet + creationFee + totalReward
    : BigInt(0)

  console.log("scheduleCyclicPayment ▶", {
    totalNet: totalNet.toString(),
    creationFee: creationFee.toString(),
    totalReward: totalReward.toString(),
    msgValue: totalValue.toString()
  })

  // 5️⃣ Approve si es ERC20
  if (token !== ZERO_ADDRESS) {
    const approveAmount = totalNet + creationFee + totalReward
    await walletClient.writeContract({
      address: token,
      abi: erc20Abi,
      functionName: "approve",
      args: [warpPay, approveAmount]
    })
  }

  // 6️⃣ Lanza la transacción
  const txHash = await walletClient.writeContract({
    address: warpPay,
    abi: contractAbi,
    functionName: "scheduleCyclicPayment",
    args: [
      recipient,
      value,
      token,
      BigInt(interval),
      BigInt(firstExecuteTime),
      BigInt(repetitions)
    ],
    value: totalValue
  })

  return {
    summary: `Scheduled cycle of ${repetitions} payments to ${recipient}`,
    hash: txHash,
    timestamp: Date.now()
  }
}


/**
 * Cancel an active scheduled payment.
 */
export async function cancelActivePayment(
  walletClient: any,
  paymentId: bigint
): Promise<Tx> {
  if (!walletClient) throw new Error("No wallet client available");

  const chainId: number = walletClient.chain.id;
  const warpPayContract = getWarpPayContract(chainId);

  const txHash = await walletClient.writeContract({
    address: warpPayContract,
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

  const chainId: number = walletClient.chain.id;
  const warpPayContract = getWarpPayContract(chainId);

  const txHash = await walletClient.writeContract({
    address: warpPayContract,
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

  const chainId: number = walletClient.chain.id;
  const warpPayContract = getWarpPayContract(chainId);

  const txHash = await walletClient.writeContract({
    address: warpPayContract,
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

  const chainId: number = walletClient.chain.id;
  const warpPayContract = getWarpPayContract(chainId);

  const txHash = await walletClient.writeContract({
    address: warpPayContract,
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

  const chainId: number = walletClient.chain.id;
  const warpPayContract = getWarpPayContract(chainId);

  const [indexes, overdueTimes] = await walletClient.readContract({
    address: warpPayContract,
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
  publicClient: any,
  status: number,
  offset: number,
  limit: number
): Promise<ScheduledPayment[]> {
  if (!walletClient) throw new Error("No wallet client available");

  const chainId: number = walletClient.chain.id;
  const warpPayContract = getWarpPayContract(chainId);

  const list = await publicClient.readContract({
    address: warpPayContract,
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
  address: string,
  chain: Chain
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
