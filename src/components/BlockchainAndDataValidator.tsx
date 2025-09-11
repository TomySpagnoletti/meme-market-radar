import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';

interface ValidationResult {
  blockchain: string;
  status: 'pending' | 'success' | 'error';
  volume?: number;
  transactions?: number;
  error?: string;
  responseTime?: number;
}

interface BlockchainAndDataValidatorProps {
  apiKey: string;
}

export const BlockchainAndDataValidator = ({ apiKey }: BlockchainAndDataValidatorProps) => {
  const [isValidating, setIsValidating] = useState(false);
  const [results, setResults] = useState<ValidationResult[]>([]);

  const validateBlockchainsAndData = async () => {
    setIsValidating(true);
    
    console.log(`🧪 Starting blockchain and data validation using REAL Dashboard queries`);
    
    // Test the exact same queries as the Dashboard
    try {
      // STEP 1: Test V1 API call (same as Dashboard)
      console.log(`📋 STEP 1: Testing V1 networks (Ethereum, BSC, Polygon)`);
      
      const v1Query = `{
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
      }`;

      console.log(`📤 V1 Query:`, v1Query);

      const v1Response = await fetch('https://graphql.bitquery.io/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ query: v1Query }),
      });

      const v1Data = await v1Response.json();
      console.log(`📥 V1 Response:`, v1Data);

      if (v1Data.errors) {
        throw new Error(`V1 API Error: ${v1Data.errors[0].message}`);
      }

      // STEP 2: Test V2 API call (same as Dashboard)
      console.log(`📋 STEP 2: Testing V2 networks (Arbitrum, Base, Optimism, Solana)`);
      
      const v2Query = `{
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
      }`;

      console.log(`📤 V2 Query:`, v2Query);

      const v2Response = await fetch('https://graphql.bitquery.io/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ query: v2Query }),
      });

      const v2Data = await v2Response.json();
      console.log(`📥 V2 Response:`, v2Data);

      if (v2Data.errors) {
        throw new Error(`V2 API Error: ${v2Data.errors[0].message}`);
      }

      // STEP 3: Calculate top blockchain (same logic as Dashboard)
      console.log(`📋 STEP 3: Processing data to determine top blockchain`);
      
      const volumes: Record<string, number> = {};
      const transactions: Record<string, number> = {};

      // Process V1 data
      ['ethereum', 'bsc', 'polygon'].forEach(network => {
        const networkData = v1Data.data?.[network];
        const dexTrade = networkData?.dexTrades?.[0];
        if (dexTrade) {
          volumes[network] = dexTrade.tradeAmount || 0;
          transactions[network] = dexTrade.count || 0;
        } else {
          volumes[network] = 0;
          transactions[network] = 0;
        }
      });

      // Process V2 data
      ['arbitrum', 'base', 'optimism', 'solana'].forEach(network => {
        const networkData = v2Data.data?.[network];
        const dexTrade = networkData?.DEXTrades?.[0];
        if (dexTrade) {
          volumes[network] = dexTrade.Trade?.Amount || 0;
          transactions[network] = dexTrade.count || 0;
        } else {
          volumes[network] = 0;
          transactions[network] = 0;
        }
      });

      console.log(`📊 All volumes:`, volumes);
      console.log(`📊 All transactions:`, transactions);

      // Find top blockchain
      const topBlockchain = Object.entries(volumes).reduce((a, b) => 
        volumes[a[0]] > volumes[b[0]] ? a : b
      )[0];

      console.log(`🏆 Top blockchain: ${topBlockchain}`);

      // STEP 4: Test protocol query for winning blockchain (same as Dashboard)
      console.log(`📋 STEP 4: Testing protocol query for winning blockchain: ${topBlockchain}`);

      // Use the same protocol query logic as Dashboard
      const getProtocolQuery = (blockchain: string) => {
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
      };

      const protocolQuery = getProtocolQuery(topBlockchain);
      console.log(`📤 Protocol Query for ${topBlockchain}:`, protocolQuery);

      const protocolResponse = await fetch('https://graphql.bitquery.io/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ query: protocolQuery })
      });

      const protocolData = await protocolResponse.json();
      console.log(`📥 Protocol Response:`, protocolData);

      if (protocolData.errors) {
        throw new Error(`Protocol API Error: ${protocolData.errors[0].message}`);
      }

      // Extract protocol name (same logic as Dashboard)
      let topProtocol = "Unknown";
      const v1Networks = ['ethereum', 'bsc', 'polygon'];
      
      if (v1Networks.includes(topBlockchain)) {
        topProtocol = protocolData.data?.ethereum?.dexTrades?.[0]?.protocol || "Unknown";
      } else if (topBlockchain === 'solana') {
        topProtocol = protocolData.data?.Solana?.DEXTrades?.[0]?.Dex?.ProtocolName || "Unknown";
      } else {
        topProtocol = protocolData.data?.EVM?.DEXTrades?.[0]?.Dex?.ProtocolName || "Unknown";
      }

      // Calculate totals (same logic as Dashboard)
      const totalVolume = Object.values(volumes).reduce((sum, vol) => sum + vol, 0);
      const totalTransactions = Object.values(transactions).reduce((sum, tx) => sum + tx, 0);

      console.log(`✅ VALIDATION SUCCESSFUL!`);
      console.log(`🎯 Final Dashboard Data:`);
      console.log(`  - Top Blockchain: ${topBlockchain}`);
      console.log(`  - Leading Protocol: ${topProtocol}`);
      console.log(`  - 24h Volume: $${totalVolume.toLocaleString()}`);
      console.log(`  - Transactions: ${totalTransactions.toLocaleString()}`);

      // Update results to show success
      const finalResults: ValidationResult[] = [
        { blockchain: 'V1 Networks', status: 'success', volume: Object.values(volumes).slice(0, 3).reduce((s,v) => s+v, 0), transactions: Object.values(transactions).slice(0, 3).reduce((s,t) => s+t, 0) },
        { blockchain: 'V2 Networks', status: 'success', volume: Object.values(volumes).slice(3).reduce((s,v) => s+v, 0), transactions: Object.values(transactions).slice(3).reduce((s,t) => s+t, 0) },
        { blockchain: `Top: ${topBlockchain}`, status: 'success', volume: volumes[topBlockchain], transactions: transactions[topBlockchain] },
        { blockchain: `Protocol: ${topProtocol}`, status: 'success', volume: 0, transactions: 0 }
      ];

      setResults(finalResults);

    } catch (error) {
      console.error(`❌ VALIDATION FAILED:`, error);
      
      const errorResult: ValidationResult[] = [
        { blockchain: 'Validation Failed', status: 'error', error: error instanceof Error ? error.message : 'Unknown error' }
      ];
      
      setResults(errorResult);
    }

    setIsValidating(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
                  return <Badge variant="default" className="bg-green-100 text-green-800">OK</Badge>;
      case 'error':
        return <Badge variant="destructive">ERROR</Badge>;
      default:
        return <Badge variant="secondary">TESTING...</Badge>;
    }
  };

  const successCount = results.filter(r => r.status === 'success').length;
  const errorCount = results.filter(r => r.status === 'error').length;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className={`h-5 w-5 ${isValidating ? 'animate-spin' : ''}`} />
          Blockchain & Data Validation
        </CardTitle>
        <CardDescription>
          Test the exact same queries used by Dashboard to validate all 4 data blocks
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={validateBlockchainsAndData} 
            disabled={isValidating}
            className="flex items-center gap-2"
          >
            {isValidating ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {isValidating ? 'Testing Dashboard queries...' : 'Test Dashboard Data'}
          </Button>
          
          {results.length > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="default" className="bg-green-100 text-green-800">
                {successCount} ✓
              </Badge>
              <Badge variant="destructive">
                {errorCount} ✗
              </Badge>
            </div>
          )}
        </div>

        {results.length > 0 && (
          <div className="grid gap-3">
            {results.map((result) => (
              <div 
                key={result.blockchain}
                className="flex items-center justify-between p-3 border rounded-lg bg-background/50"
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(result.status)}
                  <div>
                    <span className="font-medium capitalize">{result.blockchain}</span>
                    {result.responseTime && (
                      <span className="text-xs text-muted-foreground ml-2">
                        {result.responseTime}ms
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {result.status === 'success' && (
                    <div className="text-xs text-muted-foreground text-right">
                      <div>Vol: ${result.volume?.toLocaleString()}</div>
                      <div>Tx: {result.transactions?.toLocaleString()}</div>
                    </div>
                  )}
                  {result.status === 'error' && (
                    <div className="text-xs text-red-500 max-w-48 text-right">
                      {result.error}
                    </div>
                  )}
                  {getStatusBadge(result.status)}
                </div>
              </div>
            ))}
          </div>
        )}

        {results.length > 0 && !isValidating && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Dashboard Data Test Summary</h4>
            <div className="text-sm text-muted-foreground">
              <p>• {successCount} components working correctly</p>
              <p>• {errorCount} components have errors</p>
              {successCount > 0 && errorCount === 0 && (
                <p className="text-green-600 font-medium mt-1">
                  ✅ All Dashboard data blocks will display correctly!
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};