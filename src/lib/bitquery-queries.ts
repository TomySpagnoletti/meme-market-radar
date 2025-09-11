// Centralized Bitquery GraphQL queries to avoid code duplication

// Get date from 6 months ago in YYYY-MM-DD format
const getSixMonthsAgoDate = (): string => {
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
  return sixMonthsAgo.toISOString().split('T')[0];
};

// Get formatted date range for display
export const getDataPeriodInfo = () => {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };
  
  return {
    startDate: formatDate(sixMonthsAgo),
    endDate: formatDate(new Date()),
    period: "Last 6 months"
  };
};

export const BITQUERY_QUERIES = {
  // V1 API Query for Ethereum, BSC, Polygon
  getV1NetworksQuery: () => {
    const sinceDate = getSixMonthsAgoDate();
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

  // V2 API Query for Arbitrum, Base, Optimism (using correct EVM structure) and Solana
  getV2NetworksQuery: () => `{
    arbitrum: EVM(network: arbitrum) {
      DEXTrades(limit: {count: 1}, orderBy: {descending: Trade_Sell_AmountInUSD}) {
        Trade {
          Sell {
            AmountInUSD
          }
        }
        count
      }
    }
    base: EVM(network: base) {
      DEXTrades(limit: {count: 1}, orderBy: {descending: Trade_Sell_AmountInUSD}) {
        Trade {
          Sell {
            AmountInUSD
          }
        }
        count
      }
    }
    optimism: EVM(network: optimism) {
      DEXTrades(limit: {count: 1}, orderBy: {descending: Trade_Sell_AmountInUSD}) {
        Trade {
          Sell {
            AmountInUSD
          }
        }
        count
      }
    }
    solana: Solana {
      DEXTrades(limit: {count: 1}, orderBy: {descending: Trade_Sell_PriceInUSD}) {
        Trade {
          Sell {
            PriceInUSD
          }
        }
        count
      }
    }
  }`,

  // Dynamic Protocol Query
  getProtocolQuery: (blockchain: string) => {
    const sinceDate = getSixMonthsAgoDate();
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
      if (blockchain === 'solana') {
        return `{
          Solana {
            DEXTrades(limit: {count: 5}, orderBy: {descending: Trade_Sell_PriceInUSD}) {
              Trade {
                Dex {
                  ProtocolName
                }
                Sell {
                  PriceInUSD
                }
              }
              count
            }
          }
        }`;
      } else {
        return `{
          EVM(network: ${blockchain}) {
            DEXTrades(limit: {count: 5}, orderBy: {descending: Trade_Sell_AmountInUSD}) {
              Trade {
                Dex {
                  ProtocolName
                }
                Sell {
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