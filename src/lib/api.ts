import { BITQUERY_QUERIES, executeBitqueryQuery, executeBitqueryEapQuery, SUPPORTED_BLOCKCHAINS } from './bitquery-queries';
import { normalizeChainResponse, aggregateByChainProtocol, NormalizedRow } from './data-normalizer';

// --- UNIFIED DATA STRUCTURES ---

interface RawDataResult {
  chainName: string;
  data?: Record<string, Record<string, unknown>>;
}

export interface ProtocolData {
  name: string;
  version?: string;
  volume: number;
  transactions: number;
}

export interface BlockchainData {
  network: string;
  totalVolume: number;
  totalTransactions: number;
  leadingProtocols: ProtocolData[]; // Sorted list of all protocols
}

export interface AllAnalyticsData {
  overall: {
    topBlockchain: string;
    leadingProtocol: string;
    totalVolume: number;
    totalTransactions: number;
  };
  blockchains: Record<string, BlockchainData>;
  partial: boolean;
  failedChains: string[];
}

// --- HELPER FUNCTIONS ---

const fetchRawData = async (apiKey: string): Promise<RawDataResult[]> => {
  const promises = SUPPORTED_BLOCKCHAINS.map(async (network) => {
    const isSolana = network === 'solana';
    const query = isSolana ? BITQUERY_QUERIES.getSolanaStatsQuery() : BITQUERY_QUERIES.getDexMarketsQuery();
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const networkMap: Record<string, string> = {
      ethereum: 'eth', bsc: 'bsc', arbitrum: 'arbitrum', base: 'base',
    };

    const variables: Record<string, string> = isSolana ? { since } : { network: networkMap[network], since };
    const executor = isSolana ? executeBitqueryEapQuery : executeBitqueryQuery;

    try {
      const result = await executor(query, apiKey, variables);
      return { ...(result as object), chainName: network } as RawDataResult;
    } catch (err) {
      console.error(`Failed to fetch ${network}:`, err);
      return null;
    }
  });

  const results = await Promise.all(promises);
  return results.filter((r): r is RawDataResult => r !== null);
};

const processRawData = (results: RawDataResult[]): Record<string, BlockchainData> => {
  const normalizedRows: NormalizedRow[] = results.flatMap(result => 
    result.data ? normalizeChainResponse(result.data, result.chainName) : []
  );

  const aggregatedRows = aggregateByChainProtocol(normalizedRows);

  const blockchainData: Record<string, BlockchainData> = {};
  for (const chain of SUPPORTED_BLOCKCHAINS) {
    const protocolsForChain = aggregatedRows.filter(row => row.chain === chain);

    const sortedProtocols: ProtocolData[] = protocolsForChain
      .map(p => ({
        name: p.protocol,
        version: p.version,
        volume: Math.round(p.tradeAmount),
        transactions: p.count,
      }))
      .sort((a, b) => b.volume - a.volume);

    const totalVolume = sortedProtocols.reduce((sum, p) => sum + p.volume, 0);
    const totalTransactions = sortedProtocols.reduce((sum, p) => sum + p.transactions, 0);

    blockchainData[chain] = {
      network: chain,
      totalVolume,
      totalTransactions,
      leadingProtocols: sortedProtocols,
    };
  }
  return blockchainData;
};

const calculateOverallAnalytics = (blockchainData: Record<string, BlockchainData>) => {
  const totalVolumeOverall = Object.values(blockchainData).reduce((sum, b) => sum + b.totalVolume, 0);
  const totalTransactionsOverall = Object.values(blockchainData).reduce((sum, b) => sum + b.totalTransactions, 0);

  const topBlockchain = Object.values(blockchainData).reduce((a, b) => (a.totalVolume > b.totalVolume ? a : b), blockchainData.ethereum);
  
  const topProtocol = topBlockchain?.leadingProtocols[0];
  const leadingProtocolForTopBlockchain = topProtocol ? `${topProtocol.name}${topProtocol.version ? ` (${topProtocol.version})` : ''}` : 'Unknown';

  return {
    topBlockchain: topBlockchain.network.charAt(0).toUpperCase() + topBlockchain.network.slice(1),
    leadingProtocol: leadingProtocolForTopBlockchain,
    totalVolume: totalVolumeOverall,
    totalTransactions: totalTransactionsOverall,
  };
};

// --- UNIFIED DATA FETCHING FUNCTION ---

export const fetchAllAnalyticsData = async (apiKey: string): Promise<AllAnalyticsData> => {
  const rawData = await fetchRawData(apiKey);
  const blockchainData = processRawData(rawData);
  const overallAnalytics = calculateOverallAnalytics(blockchainData);
  const failedChains = SUPPORTED_BLOCKCHAINS.filter(
    (chain) => !rawData.some((r) => r.chainName === chain),
  );

  return {
    overall: overallAnalytics,
    blockchains: blockchainData,
    partial: failedChains.length > 0,
    failedChains,
  };
};
