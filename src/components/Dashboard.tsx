import { useState, useEffect } from "react";
import { CryptoCard } from "./CryptoCard";
import { DebugPanel } from "./DebugPanel";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, LogOut, TrendingUp } from "lucide-react";

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
  const [debugVisible, setDebugVisible] = useState(false);
  const [apiResponses, setApiResponses] = useState<any[]>([]);
  const { toast } = useToast();

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // STEP 1: Get all blockchain volumes to find the top one (1 API call)
      const blockchainsQuery = `{
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
        arbitrum: ethereum(network: arbitrum) {
          dexTrades(options: {limit: 1, desc: "tradeAmount"}, date: {since: "2024-01-01"}) {
            tradeAmount(in: USD)
            count
          }
        }
        optimism: ethereum(network: optimism) {
          dexTrades(options: {limit: 1, desc: "tradeAmount"}, date: {since: "2024-01-01"}) {
            tradeAmount(in: USD)
            count
          }
        }
        base: ethereum(network: base) {
          dexTrades(options: {limit: 1, desc: "tradeAmount"}, date: {since: "2024-01-01"}) {
            tradeAmount(in: USD)
            count
          }
        }
        avalanche: ethereum(network: avalanche) {
          dexTrades(options: {limit: 1, desc: "tradeAmount"}, date: {since: "2024-01-01"}) {
            tradeAmount(in: USD)
            count
          }
        }
        fantom: ethereum(network: fantom) {
          dexTrades(options: {limit: 1, desc: "tradeAmount"}, date: {since: "2024-01-01"}) {
            tradeAmount(in: USD)
            count
          }
        }
        cronos: ethereum(network: cronos) {
          dexTrades(options: {limit: 1, desc: "tradeAmount"}, date: {since: "2024-01-01"}) {
            tradeAmount(in: USD)
            count
          }
        }
        solana: solana {
          dexTrades(options: {limit: 1, desc: "tradeAmount"}, date: {since: "2024-01-01"}) {
            tradeAmount(in: USD)
            count
          }
        }
      }`;

      // First API call - get all blockchain data
      const firstResponse = await fetch('https://graphql.bitquery.io/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ query: blockchainsQuery })
      });

      const blockchainsData = await firstResponse.json();
      console.log("Step 1 - All blockchains data:", blockchainsData);
      setApiResponses(prev => [...prev, { step: 1, query: "blockchains", data: blockchainsData }]);

      // Process data to find top blockchain
      const volumes: Record<string, number> = {};
      const transactions: Record<string, number> = {};
      
      const networkList = ['ethereum', 'bsc', 'polygon', 'arbitrum', 'optimism', 'base', 'avalanche', 'fantom', 'cronos', 'solana'];
      
      networkList.forEach((network) => {
        const networkData = blockchainsData.data?.[network];
        const dexTrades = networkData?.dexTrades?.[0];
        
        if (dexTrades) {
          volumes[network] = dexTrades.tradeAmount || 0;
          transactions[network] = dexTrades.count || 0;
        } else {
          volumes[network] = 0;
          transactions[network] = 0;
        }
      });

      // Find the winning blockchain
      const topBlockchain = Object.entries(volumes).reduce((a, b) => 
        volumes[a[0]] > volumes[b[0]] ? a : b
      )[0];

      console.log("Top blockchain found:", topBlockchain);

      // STEP 2: Get leading protocol from the winning blockchain only (1 API call)
      const getProtocolQuery = (blockchain: string) => {
        if (blockchain === 'solana') {
          return `{
            solana {
              dexTrades(options: {limit: 5, desc: "tradeAmount"}, date: {since: "2024-01-01"}) {
                protocol
                tradeAmount(in: USD)
                count
              }
            }
          }`;
        } else {
          // Map blockchain names to correct network identifiers
          const networkMap: Record<string, string> = {
            ethereum: 'ethereum',
            bsc: 'bsc', 
            polygon: 'matic',
            arbitrum: 'arbitrum',
            optimism: 'optimism',
            base: 'base',
            avalanche: 'avalanche',
            fantom: 'fantom',
            cronos: 'cronos'
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
        }
      };

      // Second API call - get protocols from winning blockchain
      const secondResponse = await fetch('https://graphql.bitquery.io/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ query: getProtocolQuery(topBlockchain) })
      });

      const protocolData = await secondResponse.json();
      console.log("Step 2 - Protocol data for", topBlockchain, ":", protocolData);
      setApiResponses(prev => [...prev, { step: 2, query: "protocols", blockchain: topBlockchain, data: protocolData }]);

      // Extract leading protocol from the winning blockchain
      const topProtocol = topBlockchain === 'solana' 
        ? protocolData.data?.solana?.dexTrades?.[0]?.protocol || "Unknown"
        : protocolData.data?.ethereum?.dexTrades?.[0]?.protocol || "Unknown";

      // Calculate aggregated metrics
      const totalVolume = Object.values(volumes).reduce((sum, vol) => sum + vol, 0);
      const totalTransactions = Object.values(transactions).reduce((sum, count) => sum + count, 0);

      console.log("Final metrics:", { topBlockchain, topProtocol, totalVolume, totalTransactions });

      const processedData: DashboardData = {
        topBlockchain: topBlockchain.charAt(0).toUpperCase() + topBlockchain.slice(1),
        topProtocol: topProtocol,
        volume24h: totalVolume > 0 ? `$${(totalVolume / 1e9).toFixed(1)}B` : "No data",
        transactions: totalTransactions > 0 ? totalTransactions.toLocaleString() : "No data"
      };
      
      setData(processedData);
      toast({
        title: "Live Data Updated",
        description: "Real-time blockchain data retrieved from Bitquery.",
      });
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        variant: "destructive",
        title: "API Error",
        description: "Failed to fetch data. Please verify your Bitquery API key.",
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-crypto-primary border-t-transparent mx-auto"></div>
          <p className="text-muted-foreground">Fetching data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Meme Token Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Real-time blockchain and protocol analytics
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={fetchData}
              variant="outline"
              size="sm"
              disabled={isLoading}
              className="border-crypto-primary/20 hover:bg-crypto-primary/10"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button
              onClick={onLogout}
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Main Stats */}
        {data && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <CryptoCard
              title="Top Blockchain"
              value={data.topBlockchain}
              subtitle="Meme Tokens"
              trend="up"
              icon="trending"
              className="md:col-span-2 lg:col-span-1"
            />
            <CryptoCard
              title="Leading Protocol"
              value={data.topProtocol}
              subtitle="DEX Leader"
              trend="up"
              icon="zap"
            />
            <CryptoCard
              title="24h Volume"
              value={data.volume24h}
              subtitle="Aggregated"
              trend="up"
              icon="trending"
            />
            <CryptoCard
              title="Transactions"
              value={data.transactions}
              subtitle="All Networks"
              trend="neutral"
              icon="activity"
            />
          </div>
        )}

        {/* Main Feature Card */}
        <div className="bg-gradient-hero border border-border/50 rounded-lg p-8 text-center">
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto">
              <TrendingUp className="h-8 w-8 text-primary-foreground" />
            </div>
            <h2 className="text-2xl font-bold">
              {data?.topBlockchain} dominates the meme token market
            </h2>
            <p className="text-muted-foreground">
              With {data?.topProtocol} as the main trading protocol, 
              {data?.topBlockchain} currently processes the highest volume of meme tokens 
              with {data?.volume24h} in volume over the last 24 hours.
            </p>
          </div>
        </div>

        {/* Supported Blockchains Section */}
        <div className="bg-gradient-card border border-border/50 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4 text-center">Supported Blockchains</h2>
          <p className="text-muted-foreground text-center mb-6">
            Data aggregated from all major blockchains for comprehensive meme token analytics
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              { name: "Ethereum", version: "V1" },
              { name: "BSC", version: "V1" }, 
              { name: "Polygon", version: "V1" },
              { name: "Arbitrum", version: "V1" },
              { name: "Optimism", version: "V1" },
              { name: "Base", version: "V1" },
              { name: "Avalanche", version: "V1" },
              { name: "Fantom", version: "V1" },
              { name: "Cronos", version: "V1" },
              { name: "Solana", version: "V1" }
            ].map((blockchain) => (
              <div
                key={blockchain.name}
                className="bg-background/50 border border-border/30 rounded-lg p-3 text-center hover:bg-crypto-primary/10 transition-colors"
              >
                <span className="text-sm font-medium block">{blockchain.name}</span>
                <span className="text-xs text-muted-foreground">API {blockchain.version}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>Data provided by Bitquery • Updated in real-time</p>
        </div>
      </div>

      {/* Debug Panel */}
      <DebugPanel 
        isVisible={debugVisible}
        onToggle={() => setDebugVisible(!debugVisible)}
        apiResponses={apiResponses}
      />
    </div>
  );
};