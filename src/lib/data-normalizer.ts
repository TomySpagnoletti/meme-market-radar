// ---- Output Types
export interface NormalizedRow {
  chain: string;           // Name of the blockchain (e.g., 'ethereum', 'solana')
  protocol: string;        // E.g., "Uniswap", "Jupiter"
  version?: string;       // E.g., "v2"
  count: number;           // transaction count
  tradeAmount: number;     // total trade amount
}

// ---- Minimal (flexible) Input Types
type DexMeta = {
  ProtocolFamily?: string;
  ProtocolVersion?: string;
  ProtocolName?: string;
};

type DexTradeEntry = {
  Trade?: { Dex?: DexMeta };
  count?: string | number;
  tradeAmount?: string | number;
};

// This is the `result.data` object from a single API call
type ChainContainer = Record<string, Record<string, unknown>>;

// ---- Helpers
const toNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim() !== "" && !Number.isNaN(Number(value))) return Number(value);
  return fallback;
};

const normalizeProtocol = (dex?: DexMeta): { name: string; version?: string } => {
  if (!dex) return { name: "Unknown" };
  const family = dex.ProtocolFamily?.trim();
  const version = dex.ProtocolVersion?.trim()?.replace(/^v/i, ""); // standardize "v3" / "3" -> "3"
  const name = dex.ProtocolName?.trim();

  // EVM case (version is present)
  if (family && version) return { name: family, version: `v${version}` };
  // Solana case (no version, but sometimes a ProtocolName)
  if (family && name && name !== family) return { name: family, version: name };
  return { name: family || name || "Unknown" };
};

const extractTradesArray = (container: Record<string, unknown>): DexTradeEntry[] => {
  // 1) Look for the most descriptive key
  for (const [key, value] of Object.entries(container)) {
    if (Array.isArray(value) && /DEXTrade/i.test(key)) return value as DexTradeEntry[];
  }
  // 2) Otherwise, take the first array that looks like trades
  const guess = Object.values(container).find(
    (value) => Array.isArray(value) && (value as Partial<DexTradeEntry>[])[0]?.Trade?.Dex
  );
  return (guess as DexTradeEntry[]) || [];
};

// ---- Main Normalization (adapted)
export function normalizeChainResponse(apiResponseData: ChainContainer, chainName: string): NormalizedRow[] {
  const output: NormalizedRow[] = [];

  // The container is inside the first key (e.g., "EVM" or "Solana")
  const container = Object.values(apiResponseData)[0];
  if (typeof container !== "object" || !container) return [];

  const trades = extractTradesArray(container as Record<string, unknown>);
  for (const trade of trades) {
    const dex = trade.Trade?.Dex;
    const { name, version } = normalizeProtocol(dex);
    output.push({
      chain: chainName, // Use the provided, correct chain name
      protocol: name,
      version,
      count: toNumber(trade.count),
      tradeAmount: toNumber(trade.tradeAmount),
    });
  }
  return output;
}

// ---- (Optional) Aggregate by (chain, protocol)
export function aggregateByChainProtocol(rows: NormalizedRow[]): NormalizedRow[] {
  const map = new Map<string, NormalizedRow>();
  for (const row of rows) {
    const key = `${row.chain}__${row.protocol}__${row.version || ''}`;
    const current = map.get(key);
    if (!current) {
      map.set(key, { ...row });
    } else {
      current.count += row.count;
      current.tradeAmount += row.tradeAmount;
    }
  }
  return [...map.values()];
}
