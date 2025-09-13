import { useState, useMemo, useEffect } from "react";
import { CryptoCard } from "./CryptoCard";
import { BlockchainBreakdown } from "./BlockchainBreakdown";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, TrendingUp, RefreshCw, Info } from "lucide-react";
import { toast as sonnerToast } from "@/components/ui/sonner";
// import removed: AllAnalyticsData not used here
import { getDataPeriodInfo } from "@/lib/bitquery-queries";
import { DataGridModal } from "./DataGridModal";
import { getBlockchainIconUrl } from "@/lib/utils";
import { useAnalyticsData } from "@/hooks/useAnalyticsData";

interface DashboardProps {
  apiKey: string;
  onLogout: () => void;
}

export const Dashboard = ({ apiKey, onLogout }: DashboardProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: analyticsData, isLoading, isFetching, error, refetch } = useAnalyticsData(apiKey);

  const handleRefresh = async () => {
    // Trigger a refetch and notify the user on completion
    const t = sonnerToast.loading("Refreshing data...");
    try {
      const result = await refetch({ throwOnError: false });
      if (result.error) {
        sonnerToast.error("Refresh failed", { id: t, description: result.error.message });
      } else {
        sonnerToast.success("Data refreshed", { id: t });
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unknown error";
      sonnerToast.error("Refresh failed", { id: t, description: message });
    }
  };

  const overallAnalytics = useMemo(() => {
    if (!analyticsData) return null;
    return analyticsData.overall;
  }, [analyticsData]);

  const period = useMemo(() => getDataPeriodInfo(), []);

  // Notify user if data is only partially loaded
  useEffect(() => {
    if (!analyticsData) return;
    if (analyticsData.failedChains && analyticsData.failedChains.length > 0) {
      const failed = analyticsData.failedChains
        .map((n) => n.charAt(0).toUpperCase() + n.slice(1))
        .join(", ");
      sonnerToast("Partial data loaded", {
        description: `Failed to load: ${failed}`,
      });
    }
  }, [analyticsData?.failedChains]);

  return (
    <div className="min-h-screen text-foreground flex flex-col">
      {/* Header */}
      <div className="bg-gradient-hero border-b border-border/50 p-6 flex-grow">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Meme Market Radar
              </h1>
              <p className="text-muted-foreground mt-1">
                Real-time blockchain and protocol analytics
              </p>
            </div>
            <div className="flex gap-2">
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
              <TabsTrigger value="data-fetching">Data Breakdown</TabsTrigger>
            </TabsList>
            
            <TabsContent value="analytics" className="space-y-6 mt-6">
              {isLoading ? (
                <div className="flex justify-center items-center mt-12">
                  <RefreshCw className="h-6 w-6 animate-spin mr-3" />
                  <span>Loading...</span>
                </div>
              ) : overallAnalytics && analyticsData && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <CryptoCard
                      title="Top Blockchain"
                      value={
                        <div className="flex items-center gap-2">
                          <img src={getBlockchainIconUrl(overallAnalytics.topBlockchain)} alt={`${overallAnalytics.topBlockchain} icon`} className="h-6 w-6 rounded-full" />
                          {overallAnalytics.topBlockchain}
                        </div>
                      }
                      subtitle="Highest Volume"
                      trend="up"
                    />
                    <CryptoCard
                      title="Leading Protocol"
                      value={overallAnalytics.leadingProtocol}
                      subtitle={`On ${overallAnalytics.topBlockchain}`}
                      trend="up"
                      icon="zap"
                    />
                    <CryptoCard
                      title="Total Volume"
                      value={`$${overallAnalytics.totalVolume.toLocaleString()}`}
                      subtitle="All Blockchains"
                      trend="up"
                      icon="trending"
                    />
                    <CryptoCard
                      title="Total Transactions"
                      value={overallAnalytics.totalTransactions.toLocaleString()}
                      subtitle="All Blockchains"
                      trend="neutral"
                      icon="activity"
                    />
                  </div>

                  <div className="bg-gradient-hero border border-border/50 rounded-lg p-8 text-center">
                    <div className="max-w-2xl mx-auto space-y-4">
                      <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto">
                        <TrendingUp className="h-8 w-8 text-primary-foreground" />
                      </div>
                      <h2 className="text-2xl font-bold">
                        {overallAnalytics.topBlockchain} dominates the trading landscape
                      </h2>
                      <p className="text-muted-foreground">
                        {overallAnalytics.leadingProtocol} is the dominant protocol on {overallAnalytics.topBlockchain}.
                        <br />
                        Over the last 30 days, the total trading volume on this network reached ${analyticsData.blockchains[overallAnalytics.topBlockchain.toLowerCase()].totalVolume.toLocaleString()}.
                      </p>
                    </div>
                  </div>
                </>
              )}
            </TabsContent>
            
            <TabsContent value="data-fetching" className="space-y-4 mt-6">
              {isLoading ? (
                <div className="flex justify-center items-center mt-12">
                  <RefreshCw className="h-6 w-6 animate-spin mr-3" />
                  <span>Loading...</span>
                </div>
              ) : analyticsData ? (
                <BlockchainBreakdown allData={analyticsData} onRefresh={handleRefresh} isFetching={isFetching} error={error?.message || null} />
              ) : (
                <div className="text-center mt-12">
                  <p className="text-red-500 font-semibold">Failed to fetch data.</p>
                  <p className="text-muted-foreground text-sm">{error?.message}</p>
                  <Button onClick={() => refetch()} className="mt-4">Try Again</Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* Bottom section */}
      <div className="bg-gradient-hero border-t border-border/50 p-6 mt-auto">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center text-sm text-muted-foreground space-y-1">
            <div className="flex items-center justify-center gap-2">
              <p>Data provided by <a href="https://bitquery.io" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">Bitquery</a></p>
              <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setIsModalOpen(true)}>
                <Info className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs">
              Period: {period.period} ({period.startDate} - {period.endDate})
            </p>
          </div>
        </div>
      </div>
      <DataGridModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} allData={analyticsData || null} />
    </div>
  );
};
