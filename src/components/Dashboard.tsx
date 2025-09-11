import { useState, useEffect } from "react";
import { CryptoCard } from "./CryptoCard";
import { BlockchainAndDataValidator } from "./BlockchainAndDataValidator";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, LogOut, TrendingUp } from "lucide-react";
import { BITQUERY_QUERIES, executeBitqueryQuery, BLOCKCHAIN_CONFIG, getDataPeriodInfo } from "@/lib/bitquery-queries";

interface DashboardData {
  topBlockchain: string;
  topProtocol: string;
  volume24h: string;
  transactions: string;
}

interface DashboardProps {
  apiKey: string;
  onLogout: () => void;
}

export const Dashboard = ({ apiKey, onLogout }: DashboardProps) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // STEP 1: V1 API call for confirmed networks (Ethereum, BSC, Polygon)
      const v1Query = BITQUERY_QUERIES.getV1NetworksQuery();

      // STEP 2: V2 API call for confirmed networks (Arbitrum, Base, Optimism, Solana)
      const v2Query = BITQUERY_QUERIES.getV2NetworksQuery();

      // Execute both API calls in parallel
      const [v1Data, v2Data] = await Promise.all([
        executeBitqueryQuery(v1Query, apiKey),
        executeBitqueryQuery(v2Query, apiKey)
      ]);

      // Process V1 data (Ethereum, BSC, Polygon)
      const volumes: Record<string, number> = {};
      const transactions: Record<string, number> = {};

      // V1 data processing
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

      // V2 data processing
      BLOCKCHAIN_CONFIG.v2Networks.forEach(network => {
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

      console.log("All volumes:", volumes);
      console.log("All transactions:", transactions);

      // Find top blockchain by volume
      const topBlockchain = Object.entries(volumes).reduce((a, b) => 
        volumes[a[0]] > volumes[b[0]] ? a : b
      )[0];

      console.log("Top blockchain:", topBlockchain);

      // STEP 3: Get leading protocol from winning blockchain (dynamic V1/V2)
      const protocolQuery = BITQUERY_QUERIES.getProtocolQuery(topBlockchain);
      const protocolData = await executeBitqueryQuery(protocolQuery, apiKey);

      // Extract leading protocol
      let topProtocol = "Unknown";
      
      if (BLOCKCHAIN_CONFIG.v1Networks.includes(topBlockchain)) {
        topProtocol = protocolData.data?.ethereum?.dexTrades?.[0]?.protocol || "Unknown";
      } else if (topBlockchain === 'solana') {
        topProtocol = protocolData.data?.Solana?.DEXTrades?.[0]?.Dex?.ProtocolName || "Unknown";
      } else {
        topProtocol = protocolData.data?.EVM?.DEXTrades?.[0]?.Dex?.ProtocolName || "Unknown";
      }

      // Calculate totals
      const totalVolume = Object.values(volumes).reduce((sum, vol) => sum + vol, 0);
      const totalTransactions = Object.values(transactions).reduce((sum, tx) => sum + tx, 0);

      const formattedData: DashboardData = {
        topBlockchain: topBlockchain.charAt(0).toUpperCase() + topBlockchain.slice(1),
        topProtocol: topProtocol,
        volume24h: `$${totalVolume.toLocaleString()}`,
        transactions: totalTransactions.toLocaleString()
      };

      setData(formattedData);

      toast({
        title: "Data updated successfully",
        description: `${formattedData.topBlockchain} is leading with ${formattedData.volume24h} volume`,
      });

    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error fetching data",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-main text-foreground flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-lg text-muted-foreground">Loading meme token analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-main text-foreground flex flex-col">
      {/* Header */}
      <div className="bg-gradient-hero border-b border-border/50 p-6 flex-grow">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Meme Token Analytics
              </h1>
              <p className="text-muted-foreground mt-1">
                Real-time blockchain and protocol analytics
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={fetchData} 
                disabled={isLoading}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button 
                onClick={onLogout} 
                variant="ghost" 
                size="sm"
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>

          {/* Tabs System */}
          <Tabs defaultValue="analytics" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="validation">API Validation</TabsTrigger>
            </TabsList>
            
            <TabsContent value="analytics" className="space-y-6 mt-6">
              {/* Loading State */}
              {isLoading && (
                <div className="text-center py-12">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                  <p className="text-muted-foreground">Fetching latest blockchain data...</p>
                </div>
              )}

              {/* Main Stats */}
              {data && !isLoading && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <CryptoCard
                    title="Top Blockchain"
                    value={data.topBlockchain}
                    subtitle="Highest Volume"
                    trend="up"
                    icon="trending"
                  />
                  <CryptoCard
                    title="Leading Protocol"
                    value={data.topProtocol}
                    subtitle={`On ${data.topBlockchain}`}
                    trend="up"
                    icon="zap"
                  />
                  <CryptoCard
                    title="6-Month Volume"
                    value={data.volume24h}
                    subtitle="Last 6 months"
                    trend="up"
                    icon="trending"
                  />
                  <CryptoCard
                    title="Transactions"
                    value={data.transactions}
                    subtitle="Last 6 months"
                    trend="neutral"
                    icon="activity"
                  />
                </div>
              )}

              {/* Main Feature Card */}
              {data && (
                <div className="bg-gradient-hero border border-border/50 rounded-lg p-8 text-center">
                  <div className="max-w-2xl mx-auto space-y-4">
                    <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto">
                      <TrendingUp className="h-8 w-8 text-primary-foreground" />
                    </div>
                    <h2 className="text-2xl font-bold">
                      {data.topBlockchain} dominates the meme token market
                    </h2>
                    <p className="text-muted-foreground">
                      With {data.topProtocol} as the main trading protocol, 
                      {data.topBlockchain} currently processes the highest volume of meme tokens 
                      with {data.volume24h} in volume over the last 6 months.
                    </p>
                  </div>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="validation" className="space-y-4 mt-6">
              <BlockchainAndDataValidator apiKey={apiKey} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* Bottom section - Always visible and sticky at bottom */}
      <div className="bg-gradient-hero border-t border-border/50 p-6 mt-auto">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Supported Blockchains Section */}
          <div className="bg-gradient-card border border-border/50 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3 text-center">Supported Networks</h3>
            <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
              {BLOCKCHAIN_CONFIG.supportedBlockchains.map((blockchain) => (
                <div
                  key={blockchain.name}
                  className="bg-background/50 border border-border/30 rounded-md p-2 text-center hover:bg-crypto-primary/10 transition-colors"
                >
                  <span className="text-xs font-medium block">{blockchain.name}</span>
                  <span className="text-xs text-muted-foreground">{blockchain.version}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-sm text-muted-foreground space-y-1">
            <p>Data provided by Bitquery • Updated on refresh</p>
            <p className="text-xs">
              Period: {getDataPeriodInfo().period} ({getDataPeriodInfo().startDate} - {getDataPeriodInfo().endDate})
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};