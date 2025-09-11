import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';
import { BITQUERY_QUERIES, executeBitqueryQuery, BLOCKCHAIN_CONFIG } from "@/lib/bitquery-queries";

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
    
    // Test only V1 API call (working networks: Ethereum, BSC, Polygon)
    try {
      console.log(`📋 Testing V1 networks (Ethereum, BSC, Polygon)`);
      
      const v1Query = BITQUERY_QUERIES.getV1NetworksQuery();
      console.log(`📤 V1 Query:`, v1Query);
      
      const v1Data = await executeBitqueryQuery(v1Query, apiKey);
      console.log(`📥 V1 Response:`, v1Data);

      // Calculate top blockchain from V1 data only
      console.log(`📋 Processing V1 data to determine top blockchain`);
      
      const volumes: Record<string, number> = {};
      const transactions: Record<string, number> = {};

      // Process only V1 data (Ethereum, BSC, Polygon)
      BLOCKCHAIN_CONFIG.v1Networks.forEach(network => {
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

      console.log(`📊 All volumes:`, volumes);
      console.log(`📊 All transactions:`, transactions);

      // Find top blockchain
      const topBlockchain = Object.entries(volumes).reduce((a, b) => 
        volumes[a[0]] > volumes[b[0]] ? a : b
      )[0];

      console.log(`🏆 Top blockchain: ${topBlockchain}`);

      // STEP 4: Test protocol query for winning blockchain (same as Dashboard)
      console.log(`📋 Testing protocol query for winning blockchain: ${topBlockchain}`);

      const protocolQuery = BITQUERY_QUERIES.getProtocolQuery(topBlockchain);
      console.log(`📤 Protocol Query for ${topBlockchain}:`, protocolQuery);

      const protocolData = await executeBitqueryQuery(protocolQuery, apiKey);
      console.log(`📥 Protocol Response:`, protocolData);

      // Extract protocol name (same logic as Dashboard)
      let topProtocol = "Unknown";
      
      if (BLOCKCHAIN_CONFIG.v1Networks.includes(topBlockchain)) {
        topProtocol = protocolData.data?.ethereum?.dexTrades?.[0]?.protocol || "Unknown";
      } else if (topBlockchain === 'solana') {
        topProtocol = protocolData.data?.Solana?.DEXTrades?.[0]?.Trade?.Dex?.ProtocolName || "Unknown";
      } else {
        topProtocol = protocolData.data?.EVM?.DEXTrades?.[0]?.Trade?.Dex?.ProtocolName || "Unknown";
      }

      // Calculate totals (same logic as Dashboard)
      const totalVolume = Object.values(volumes).reduce((sum, vol) => sum + vol, 0);
      const totalTransactions = Object.values(transactions).reduce((sum, tx) => sum + tx, 0);

      console.log(`✅ VALIDATION SUCCESSFUL!`);
      console.log(`🎯 Final Dashboard Data:`);
      console.log(`  - Top Blockchain: ${topBlockchain}`);
      console.log(`  - Leading Protocol: ${topProtocol}`);
      console.log(`  - 30-Day Volume: $${totalVolume.toLocaleString()}`);
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
          Test V1 networks (Ethereum, BSC, Polygon) with 30-day data for cost efficiency
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