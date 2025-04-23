// src/services/api.ts
import type { WalletClient } from "wagmi";

export interface Tx {
  summary: string;
  hash: string;
  timestamp: number;
}

// Envía tokens usando tu endpoint /api/send
export async function sendTokens(
    walletClient: WalletClient,
    from: string,
    to: string,
    amount: string,
    tokenAddress?: string
  ): Promise<Tx> {
    const res = await fetch("/api/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, amount, tokenAddress }),
    });
    if (!res.ok) throw new Error(`Error enviando tokens: ${res.statusText}`);
    return res.json();
  }
  
// Solicita tokens (faucet) vía /api/request
export async function requestTokens(
  walletClient: WalletClient,
  to: string,
  amount: string
): Promise<Tx> {
  const res = await fetch("/api/request", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ to, amount }),
  });
  if (!res.ok) throw new Error(`Error solicitando tokens: ${res.statusText}`);
  return res.json();
}

// Crea un airdrop vía /api/airdrop
export async function createAirdrop(
  walletClient: WalletClient,
  from: string,
  token: string,
  total: string,
  recipients: number
): Promise<Tx> {
  const res = await fetch("/api/airdrop", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ from, token, total, recipients }),
  });
  if (!res.ok) throw new Error(`Error en airdrop: ${res.statusText}`);
  return res.json();
}

// Recupera historial vía /api/history?address=
export async function fetchHistory(address: string): Promise<Tx[]> {
  const res = await fetch(`/api/history?address=${encodeURIComponent(address)}`);
  if (!res.ok) throw new Error(`Error cargando historial: ${res.statusText}`);
  return res.json();
}
