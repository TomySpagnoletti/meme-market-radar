import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AllAnalyticsData } from "@/lib/api";
import { RefreshCw } from "lucide-react";
import { SUPPORTED_BLOCKCHAINS } from "@/lib/bitquery-queries";
import { getBlockchainIconUrl } from "@/lib/utils";

interface BlockchainBreakdownProps {
  allData: AllAnalyticsData;
  onRefresh: () => void;
  isFetching?: boolean;
  error: string | null;
}

export const BlockchainBreakdown = ({ allData, onRefresh, isFetching, error }: BlockchainBreakdownProps) => {
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Data Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="text-center mt-4">
          <p className="text-red-500 font-semibold">An error occurred while fetching data.</p>
          <p className="text-muted-foreground text-sm">{error}</p>
          <Button onClick={onRefresh} className="mt-4">Try Again</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
        <div className="space-y-1.5">
          <CardTitle>Data Breakdown</CardTitle>
          <p className="text-sm text-muted-foreground">
            The five blockchains selected for analysis represent over 70% of the total value locked (TVL) in the DeFi ecosystem.
            <br />
            This focused approach allows for a comprehensive overview of the meme token market.
          </p>
        </div>
        <Button onClick={onRefresh} disabled={!!isFetching}>
          {isFetching ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Refreshing...
            </>
          ) : (
            "Refresh All"
          )}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {SUPPORTED_BLOCKCHAINS.map((chain) => {
          const data = allData.blockchains[chain];
          if (!data) return null;

          return (
            <div key={chain} className="!mt-8">
              <h3 className="text-2xl font-bold mb-4 capitalize flex items-center gap-2">
                <img src={getBlockchainIconUrl(chain)} alt={`${chain} icon`} className="h-6 w-6 rounded-full" />
                {chain}
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <span className="font-medium">Total Volume</span>
                    <span className="text-xs text-muted-foreground ml-1">(all protocols)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">${data.totalVolume.toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <span className="font-medium">Total Transactions</span>
                    <span className="text-xs text-muted-foreground ml-1">(all protocols)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{data.totalTransactions.toLocaleString()}</span>
                  </div>
                </div>
                <div>
                  <h4 className="text-md font-semibold my-2">Top 3 Protocols by Volume</h4>
                  <div className="space-y-2">
                    {data.leadingProtocols.slice(0, 3).map((protocol, index) => (
                      <div key={`${protocol.name}-${protocol.version}`} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <span className="text-sm">
                            {['🥇', '🥈', '🥉'][index]} {protocol.name}
                            {protocol.version && <span className="text-muted-foreground ml-1">({protocol.version})</span>}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">${protocol.volume.toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
