// Centralized Bitquery GraphQL queries to avoid code duplication

export const BITQUERY_QUERIES = {
  // V1 API Query for Ethereum, BSC, Polygon
  getV1NetworksQuery: () => `{
    ethereum: ethereum(network: ethereum) {
      dexTrades(options: {limit: 1, desc: "tradeAmount"}, date: {since: "2024-01-01"}) {
        tradeAmount(in: USD)
        count
      }
    }
    bsc: ethereum(network: bsc) {
      dexTrades(options: {limit: 1, desc: "tradeAmount"}, date: {since: "2024-01-01"}) {
        tradeAmount(in: USD)
        count
      }
    }
    polygon: ethereum(network: matic) {
      dexTrades(options: {limit: 1, desc: "tradeAmount"}, date: {since: "2024-01-01"}) {
        tradeAmount(in: USD)
        count
      }
    }
  }`,

  // V2 API Query for Arbitrum, Base, Optimism, Solana
  getV2NetworksQuery: () => `{
    arbitrum: EVM(network: arbitrum) {
      DEXTrades(limit: {count: 1}, orderBy: {descending: Trade_Amount}) {
        Trade {
          Amount(in: USD)
        }
        count
      }
    }
    base: EVM(network: base) {
      DEXTrades(limit: {count: 1}, orderBy: {descending: Trade_Amount}) {
        Trade {
          Amount(in: USD)
        }
        count
      }
    }
    optimism: EVM(network: optimism) {
      DEXTrades(limit: {count: 1}, orderBy: {descending: Trade_Amount}) {
        Trade {
          Amount(in: USD)
        }
        count
      }
    }
    solana: Solana {
      DEXTrades(limit: {count: 1}, orderBy: {descending: Trade_Amount}) {
        Trade {
          Amount(in: USD)
        }
        count
      }
    }
  }`,

  // Dynamic Protocol Query
  getProtocolQuery: (blockchain: string) => {
    const v1Networks = ['ethereum', 'bsc', 'polygon'];
    const v2Networks = ['arbitrum', 'base', 'optimism', 'solana'];

    if (v1Networks.includes(blockchain)) {
      const networkMap: Record<string, string> = {
        ethereum: 'ethereum',
        bsc: 'bsc', 
        polygon: 'matic'
      };
      return `{
        ethereum(network: ${networkMap[blockchain]}) {
          dexTrades(options: {limit: 5, desc: "tradeAmount"}, date: {since: "2024-01-01"}) {
            protocol
            tradeAmount(in: USD)
            count
          }
        }
      }`;
    } else if (v2Networks.includes(blockchain)) {
      if (blockchain === 'solana') {
        return `{
          Solana {
            DEXTrades(limit: {count: 5}, orderBy: {descending: Trade_Amount}) {
              Dex {
                ProtocolName
              }
              Trade {
                Amount(in: USD)
              }
              count
            }
          }
        }`;
      } else {
        return `{
          EVM(network: ${blockchain}) {
            DEXTrades(limit: {count: 5}, orderBy: {descending: Trade_Amount}) {
              Dex {
                ProtocolName
              }
              Trade {
                Amount(in: USD)
              }
              count
            }
          }
        }`;
      }
    }
    return '';
  }
};

// API call helper function
export const executeBitqueryQuery = async (query: string, apiKey: string) => {
  const response = await fetch('https://graphql.bitquery.io/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ query }),
  });

  const data = await response.json();
  
  if (data.errors) {
    throw new Error(data.errors[0].message);
  }

  return data;
};

// Blockchain configurations
export const BLOCKCHAIN_CONFIG = {
  v1Networks: ['ethereum', 'bsc', 'polygon'],
  v2Networks: ['arbitrum', 'base', 'optimism', 'solana'],
  supportedBlockchains: [
    { name: "Ethereum", version: "API V1" },
    { name: "BSC", version: "API V1" }, 
    { name: "Polygon", version: "API V1" },
    { name: "Arbitrum", version: "API V2" },
    { name: "Base", version: "API V2" },
    { name: "Optimism", version: "API V2" },
    { name: "Solana", version: "API V2" }
  ]
};