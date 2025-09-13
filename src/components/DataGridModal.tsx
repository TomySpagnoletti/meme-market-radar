import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { AllAnalyticsData } from "@/lib/api";
import { ArrowDown } from "lucide-react";

interface DataGridModalProps {
  isOpen: boolean;
  onClose: () => void;
  allData: AllAnalyticsData | null;
}

export const DataGridModal = ({ isOpen, onClose, allData }: DataGridModalProps) => {
  if (!allData) return null;

  // We can re-process the data here to get the aggregated list for the table
  const aggregatedData = Object.values(allData.blockchains).flatMap(chainData => 
    chainData.leadingProtocols.map(protocol => ({
      chain: chainData.network,
      protocol: protocol.name,
      version: protocol.version,
      volume: protocol.volume,
      transactions: protocol.transactions,
    }))
  ).sort((a, b) => b.volume - a.volume);

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <AlertDialogContent className="max-w-4xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Aggregated Blockchain Data</AlertDialogTitle>
          <AlertDialogDescription>
            This table shows the aggregated and sorted data used to generate the analytics.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="max-h-[60vh] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Blockchain</TableHead>
                <TableHead>Protocol (version)</TableHead>
                <TableHead className="text-right bg-muted/50">
                  <div className="flex items-center justify-end gap-1">
                    Volume (USD)
                    <ArrowDown className="h-3 w-3" />
                  </div>
                </TableHead>
                <TableHead className="text-right">Transactions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {aggregatedData.map((row) => (
                <TableRow key={`${row.chain}-${row.protocol}-${row.version}`}>
                  <TableCell className="capitalize">{row.chain}</TableCell>
                  <TableCell>
                    {row.protocol}
                    {row.version && <span className="text-muted-foreground ml-1">({row.version})</span>}
                  </TableCell>
                  <TableCell className="text-right">${row.volume.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{row.transactions.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <AlertDialogFooter>
          <AlertDialogAction onClick={onClose}>Close</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
