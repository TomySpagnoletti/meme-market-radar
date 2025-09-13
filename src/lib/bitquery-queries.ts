// Centralized Bitquery GraphQL queries

// Get formatted date range for display
export const getDataPeriodInfo = () => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };
  
  return {
    startDate: formatDate(thirtyDaysAgo),
    endDate: formatDate(new Date()),
    period: "Last 30 days"
  };
};

export const BITQUERY_QUERIES = {
  getDexMarketsQuery: () => {
    return `query DexMarkets($network: evm_network, $since: DateTime) {
      EVM(network: $network, dataset: realtime) {
        DEXTrades(where: {Block: {Time: {since: $since}}}) {
          Trade {
            Dex {
              ProtocolFamily
              ProtocolVersion
            }
          }
          count
          tradeAmount: sum(of: Trade_Buy_AmountInUSD)
        }
      }
    }`;
  },

  // Query for Solana only
  getSolanaStatsQuery: () => {
    return `query DexMarkets($since: DateTime) {
      Solana(dataset: realtime) {
        DEXTrades(where: {Block: {Time: {since: $since}}}) {
          Trade {
            Dex {
              ProtocolFamily
              ProtocolName
            }
          }
          count
          tradeAmount: sum(of: Trade_Buy_AmountInUSD)
        }
      }
    }`;
  },
};

import { BITQUERY_V2_ENDPOINT, BITQUERY_EAP_ENDPOINT } from './constants';

async function fetchWithTimeout(url: string, options: RequestInit, timeout = 15000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  const response = await fetch(url, {
    ...options,
    signal: controller.signal  
  });

  clearTimeout(id);
  return response;
}

// API call helper function
export const executeBitqueryQuery = async (query: string, apiKey: string, variables?: Record<string, string>) => {
  const body: { query: string, variables?: Record<string, string> } = { query };
  if (variables) {
    body.variables = variables;
  }

  const response = await fetchWithTimeout(BITQUERY_V2_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`API request failed with status ${response.status}: ${errorBody}`);
  }

  const data = await response.json();
  
  if (data.errors) {
    throw new Error(data.errors[0].message);
  }

  return data;
};

export const executeBitqueryEapQuery = async (query: string, apiKey: string, variables?: Record<string, string>) => {
  const body: { query: string, variables?: Record<string, string> } = { query };
  if (variables) {
    body.variables = variables;
  }

  const response = await fetchWithTimeout(BITQUERY_EAP_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`API request failed with status ${response.status}: ${errorBody}`);
  }

  const data = await response.json();
  
  if (data.errors) {
    throw new Error(data.errors[0].message);
  }

  return data;
};

export const SUPPORTED_BLOCKCHAINS = ['ethereum', 'bsc', 'arbitrum', 'base', 'solana'];
