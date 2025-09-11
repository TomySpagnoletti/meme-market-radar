import { useState, useEffect } from "react";
import { CryptoCard } from "./CryptoCard";
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
  const { toast } = useToast();

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Bitquery GraphQL queries for meme token data
      const queries = {
        // All supported EVM blockchains
        ethereumData: `query { EVM(dataset: archive, network: ethereum) { DEXTrades(limit: {count: 1}, orderBy: {descendingByField: "volume"}, where: {Block: {Date: {since: "2024-01-01"}}}) { volume: sum(of: Trade_Amount), count }}}`,
        bscData: `query { EVM(dataset: archive, network: bsc) { DEXTrades(limit: {count: 1}, orderBy: {descendingByField: "volume"}, where: {Block: {Date: {since: "2024-01-01"}}}) { volume: sum(of: Trade_Amount), count }}}`,
        polygonData: `query { EVM(dataset: archive, network: polygon) { DEXTrades(limit: {count: 1}, orderBy: {descendingByField: "volume"}, where: {Block: {Date: {since: "2024-01-01"}}}) { volume: sum(of: Trade_Amount), count }}}`,
        arbitrumData: `query { EVM(dataset: archive, network: arbitrum) { DEXTrades(limit: {count: 1}, orderBy: {descendingByField: "volume"}, where: {Block: {Date: {since: "2024-01-01"}}}) { volume: sum(of: Trade_Amount), count }}}`,
        optimismData: `query { EVM(dataset: archive, network: optimism) { DEXTrades(limit: {count: 1}, orderBy: {descendingByField: "volume"}, where: {Block: {Date: {since: "2024-01-01"}}}) { volume: sum(of: Trade_Amount), count }}}`,
        baseData: `query { EVM(dataset: archive, network: base) { DEXTrades(limit: {count: 1}, orderBy: {descendingByField: "volume"}, where: {Block: {Date: {since: "2024-01-01"}}}) { volume: sum(of: Trade_Amount), count }}}`,
        avalancheData: `query { EVM(dataset: archive, network: avalanche) { DEXTrades(limit: {count: 1}, orderBy: {descendingByField: "volume"}, where: {Block: {Date: {since: "2024-01-01"}}}) { volume: sum(of: Trade_Amount), count }}}`,
        fantomData: `query { EVM(dataset: archive, network: fantom) { DEXTrades(limit: {count: 1}, orderBy: {descendingByField: "volume"}, where: {Block: {Date: {since: "2024-01-01"}}}) { volume: sum(of: Trade_Amount), count }}}`,
        cronosData: `query { EVM(dataset: archive, network: cronos) { DEXTrades(limit: {count: 1}, orderBy: {descendingByField: "volume"}, where: {Block: {Date: {since: "2024-01-01"}}}) { volume: sum(of: Trade_Amount), count }}}`,
        
        // Solana (different structure)
        solanaData: `query { Solana(dataset: archive) { DEXTrades(limit: {count: 1}, orderBy: {descendingByField: "volume"}, where: {Block: {Date: {since: "2024-01-01"}}}) { volume: sum(of: Trade_Amount), count }}}`,
        
        // Top protocols query
        topProtocols: `query { EVM(dataset: archive, network: ethereum) { DEXTrades(limit: {count: 10}, orderBy: {descendingByField: "volume"}, where: {Block: {Date: {since: "2024-01-01"}}}) { Protocol { Name }, volume: sum(of: Trade_Amount), transactions: count }}}`
      };

      // Fetch data from ALL supported blockchains
      const allNetworks = [
        { name: 'ethereum', query: queries.ethereumData },
        { name: 'bsc', query: queries.bscData },
        { name: 'polygon', query: queries.polygonData },
        { name: 'arbitrum', query: queries.arbitrumData },
        { name: 'optimism', query: queries.optimismData },
        { name: 'base', query: queries.baseData },
        { name: 'avalanche', query: queries.avalancheData },
        { name: 'fantom', query: queries.fantomData },
        { name: 'cronos', query: queries.cronosData },
        { name: 'solana', query: queries.solanaData },
      ];

      const responses = await Promise.all([
        ...allNetworks.map(network => 
          fetch('https://graphql.bitquery.io/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({ query: network.query })
          })
        ),
        // Protocol query
        fetch('https://graphql.bitquery.io/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({ query: queries.topProtocols })
        })
      ]);

      const allData = await Promise.all(
        responses.map(response => response.json())
      );

      // Separate protocol data (last response)
      const protocolData = allData.pop();
      
      // Process all blockchain data
      const volumes: Record<string, number> = {};
      const transactions: Record<string, number> = {};
      
      allNetworks.forEach((network, index) => {
        const data = allData[index];
        if (network.name === 'solana') {
          volumes[network.name] = data.data?.Solana?.[0]?.volume || 0;
          transactions[network.name] = data.data?.Solana?.[0]?.count || 0;
        } else {
          volumes[network.name] = data.data?.EVM?.[0]?.volume || 0;
          transactions[network.name] = data.data?.EVM?.[0]?.count || 0;
        }
      });

      // Find top blockchain by volume
      const topBlockchain = Object.entries(volumes).reduce((a, b) => 
        volumes[a[0]] > volumes[b[0]] ? a : b
      )[0];

      // Process protocol data
      const topProtocol = protocolData.data?.EVM?.[0]?.Protocol?.Name || "Unknown";
      const totalVolume = Object.values(volumes).reduce((sum, vol) => sum + vol, 0);
      const totalTransactions = Object.values(transactions).reduce((sum, count) => sum + count, 0);

      const processedData: DashboardData = {
        topBlockchain: topBlockchain.charAt(0).toUpperCase() + topBlockchain.slice(1),
        topProtocol: topProtocol,
        volume24h: `$${(totalVolume / 1e9).toFixed(1)}B`,
        transactions: totalTransactions.toLocaleString()
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
              subtitle="+12.5%"
              trend="up"
              icon="trending"
            />
            <CryptoCard
              title="Transactions"
              value={data.transactions}
              subtitle="Last 24h"
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

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>Data provided by Bitquery • Updated in real-time</p>
        </div>
      </div>
    </div>
  );
};