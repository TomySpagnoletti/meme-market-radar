import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getBlockchainIconUrl = (blockchainName: string): string => {
  const name = blockchainName.toLowerCase();
  
  const symbolMap: Record<string, string> = {
    ethereum: 'ethereum',
    solana: 'solana',
    bsc: 'bnb', // BNB Smart Chain
    arbitrum: 'arbitrum',
    base: 'base',
  };

  const symbol = symbolMap[name] || name; // Fallback to the name if not in map
  type ViteEnv = { BASE_URL?: string };
  type ViteImportMeta = ImportMeta & { env?: ViteEnv };
  const base = (typeof import.meta !== 'undefined' && (import.meta as unknown as ViteImportMeta)?.env?.BASE_URL) || '/';
  return `${base}icons/${symbol}.png`;
};
