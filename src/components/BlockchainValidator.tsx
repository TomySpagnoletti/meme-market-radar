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

interface BlockchainValidatorProps {
  apiKey: string;
}

export const BlockchainValidator = ({ apiKey }: BlockchainValidatorProps) => {
  const [isValidating, setIsValidating] = useState(false);
  const [results, setResults] = useState<ValidationResult[]>([]);

  const validateBlockchains = async () => {
    setIsValidating(true);
    
    const blockchains = [
      { name: 'ethereum', type: 'v1', network: 'ethereum' },
      { name: 'bsc', type: 'v1', network: 'bsc' },
      { name: 'polygon', type: 'v1', network: 'matic' },
      { name: 'arbitrum', type: 'v2', network: 'arbitrum' },
      { name: 'base', type: 'v2', network: 'base' },
      { name: 'optimism', type: 'v2', network: 'optimism' },
      { name: 'solana', type: 'v2', network: 'solana' }
    ];

    // Initialize results with pending status
    const initialResults: ValidationResult[] = blockchains.map(bc => ({
      blockchain: bc.name,
      status: 'pending'
    }));
    setResults(initialResults);

    // Test each blockchain individually
    for (const blockchain of blockchains) {
      const startTime = Date.now();
      
      console.log(`🧪 Testing blockchain: ${blockchain.name} (${blockchain.type.toUpperCase()}) on network: ${blockchain.network}`);
      
      try {
        let query: string;
        
        if (blockchain.type === 'v1') {
          query = `{
            ${blockchain.name}: ethereum(network: ${blockchain.network}) {
              dexTrades(options: {limit: 1, desc: "tradeAmount"}, date: {since: "2024-01-01"}) {
                tradeAmount(in: USD)
                count
              }
            }
          }`;
        } else if (blockchain.name === 'solana') {
          query = `{
            solana: Solana(dataset: archive) {
              DEXTrades(limit: {count: 1}, orderBy: {descending: Trade_Amount}) {
                Trade {
                  Amount(in: USD)
                }
                count
              }
            }
          }`;
        } else {
          query = `{
            ${blockchain.name}: EVM(network: ${blockchain.network}, dataset: archive) {
              DEXTrades(limit: {count: 1}, orderBy: {descending: Trade_Amount}) {
                Trade {
                  Amount(in: USD)
                }
                count
              }
            }
          }`;
        }

        console.log(`📤 Sending query for ${blockchain.name}:`, query);

        const response = await fetch('https://graphql.bitquery.io/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({ query }),
        });

        const data = await response.json();
        const responseTime = Date.now() - startTime;

        console.log(`📥 Response for ${blockchain.name} (${responseTime}ms):`, data);

        if (data.errors) {
          console.error(`❌ GraphQL errors for ${blockchain.name}:`, data.errors);
          throw new Error(data.errors[0].message);
        }

        // Extract volume and transactions based on blockchain type
        let volume = 0;
        let transactions = 0;

        const networkData = data.data?.[blockchain.name];
        if (blockchain.type === 'v1') {
          const dexTrade = networkData?.dexTrades?.[0];
          volume = dexTrade?.tradeAmount || 0;
          transactions = dexTrade?.count || 0;
        } else {
          const dexTrade = networkData?.DEXTrades?.[0];
          volume = dexTrade?.Trade?.Amount || 0;
          transactions = dexTrade?.count || 0;
        }

        console.log(`✅ ${blockchain.name} SUCCESS - Volume: $${volume.toLocaleString()}, Transactions: ${transactions.toLocaleString()}, Time: ${responseTime}ms`);

        // Update results
        setResults(prev => prev.map(result => 
          result.blockchain === blockchain.name 
            ? { 
                ...result, 
                status: 'success', 
                volume, 
                transactions, 
                responseTime 
              }
            : result
        ));

      } catch (error) {
        const responseTime = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        console.error(`❌ Blockchain ${blockchain.name} FAILED:`, {
          network: blockchain.network,
          type: blockchain.type,
          error: errorMessage,
          responseTime: `${responseTime}ms`,
          fullError: error
        });
        
        setResults(prev => prev.map(result =>
          result.blockchain === blockchain.name 
            ? { 
                ...result, 
                status: 'error', 
                error: error instanceof Error ? error.message : 'Unknown error',
                responseTime 
              }
            : result
        ));
        
        console.log(`⏱️ Waiting 500ms before next blockchain test...`);
      }

      // Small delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`🏁 Blockchain validation complete!`);
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
          Blockchain Validation
        </CardTitle>
        <CardDescription>
          Programmatic test of each blockchain to verify connectivity and data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={validateBlockchains} 
            disabled={isValidating}
            className="flex items-center gap-2"
          >
            {isValidating ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {isValidating ? 'Testing in progress...' : 'Test all blockchains'}
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
            <h4 className="font-medium mb-2">Test Summary</h4>
            <div className="text-sm text-muted-foreground">
              <p>• {successCount}/7 blockchains working correctly</p>
              <p>• {errorCount}/7 blockchains have errors</p>
              {successCount === 7 && (
                <p className="text-green-600 font-medium mt-1">
                  ✅ All blockchains are operational!
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};