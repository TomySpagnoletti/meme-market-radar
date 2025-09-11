// Centralized Bitquery GraphQL queries to avoid code duplication

// Get date from 30 days ago in YYYY-MM-DD format
const getThirtyDaysAgoDate = (): string => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
  return thirtyDaysAgo.toISOString().split('T')[0];
};

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
  // V1 API Query for Ethereum, BSC, Polygon
  getV1NetworksQuery: () => {
    const sinceDate = getThirtyDaysAgoDate();
    return `{
      ethereum: ethereum(network: ethereum) {
        dexTrades(options: {limit: 1, desc: "tradeAmount"}, date: {since: "${sinceDate}"}) {
          tradeAmount(in: USD)
          count
        }
      }
      bsc: ethereum(network: bsc) {
        dexTrades(options: {limit: 1, desc: "tradeAmount"}, date: {since: "${sinceDate}"}) {
          tradeAmount(in: USD)
          count
        }
      }
      polygon: ethereum(network: matic) {
        dexTrades(options: {limit: 1, desc: "tradeAmount"}, date: {since: "${sinceDate}"}) {
          tradeAmount(in: USD)
          count
        }
      }
    }`;
  },

  // V2 API Query for Arbitrum, Base, Optimism, Solana - RESTORED AND FIXED
  getV2NetworksQuery: () => {
    const sinceDate = getThirtyDaysAgoDate();
    return `{
      arbitrum: EVM(dataset: archive, network: arbitrum) {
        DEXTrades(limit: {count: 1}, orderBy: {descending: Block_Time}, where: {Block: {Date: {since: "${sinceDate}"}}}) {
          Trade {
            Buy {
              AmountInUSD
            }
          }
          count
        }
      }
      base: EVM(dataset: archive, network: base) {
        DEXTrades(limit: {count: 1}, orderBy: {descending: Block_Time}, where: {Block: {Date: {since: "${sinceDate}"}}}) {
          Trade {
            Buy {
              AmountInUSD
            }
          }
          count
        }
      }
      optimism: EVM(dataset: archive, network: optimism) {
        DEXTrades(limit: {count: 1}, orderBy: {descending: Block_Time}, where: {Block: {Date: {since: "${sinceDate}"}}}) {
          Trade {
            Buy {
              AmountInUSD
            }
          }
          count
        }
      }
      solana: Solana(dataset: archive) {
        DEXTrades(limit: {count: 1}, orderBy: {descending: Block_Time}, where: {Block: {Date: {since: "${sinceDate}"}}}) {
          Trade {
            Buy {
              AmountInUSD
            }
          }
          count
        }
      }
    }`;
  },

  // Dynamic Protocol Query
  getProtocolQuery: (blockchain: string) => {
    const sinceDate = getThirtyDaysAgoDate();
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
          dexTrades(options: {limit: 5, desc: "tradeAmount"}, date: {since: "${sinceDate}"}) {
            protocol
            tradeAmount(in: USD)
            count
          }
        }
      }`;
    } else if (v2Networks.includes(blockchain)) {
      const sinceDate = getThirtyDaysAgoDate();
      if (blockchain === 'solana') {
        return `{
          Solana(dataset: archive) {
            DEXTrades(limit: {count: 5}, orderBy: {descending: Block_Time}, where: {Block: {Date: {since: "${sinceDate}"}}}) {
              Trade {
                Dex {
                  ProtocolName
                }
                Buy {
                  AmountInUSD
                }
              }
              count
            }
          }
        }`;
      } else {
        return `{
          EVM(dataset: archive, network: ${blockchain}) {
            DEXTrades(limit: {count: 5}, orderBy: {descending: Block_Time}, where: {Block: {Date: {since: "${sinceDate}"}}}) {
              Trade {
                Dex {
                  ProtocolName
                }
                Buy {
                  AmountInUSD
                }
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

// Blockchain configurations - ALL 7 BLOCKCHAINS RESTORED
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