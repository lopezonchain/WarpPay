// src/services/ensResolver.ts

import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";
import { normalize } from "viem/ens";

// Create a dedicated ENS client on Ethereum Mainnet
export const ensClient = createPublicClient({
  chain: mainnet,
  transport: http(process.env.NEXT_PUBLIC_ETH_RPC_URL || "https://eth.llamarpc.com"),
});

/**
 * Resolve an ENS name to an Ethereum address using the ENS client.
 * @param name - ENS name (e.g. "alice.eth")
 * @throws if the name cannot be resolved
 */
export async function resolveEnsName(name: string): Promise<`0x${string}`> {
  const normalized = normalize(name);
  const address = await ensClient.getEnsAddress({ name: normalized });
  if (!address) {
    throw new Error(`Could not resolve ENS name: ${name}`);
  }
  return address as `0x${string}`;
}
