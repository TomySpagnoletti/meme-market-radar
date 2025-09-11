import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface DebugPanelProps {
  isVisible: boolean;
  onToggle: () => void;
  apiResponses: any[];
}

export const DebugPanel = ({ isVisible, onToggle, apiResponses }: DebugPanelProps) => {
  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4">
        <Button onClick={onToggle} variant="outline" size="sm">
          Show Debug
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 max-h-96 overflow-auto z-50">
      <Card className="bg-background border-border">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-sm">API Debug Panel</CardTitle>
            <Button onClick={onToggle} variant="ghost" size="sm">×</Button>
          </div>
          <CardDescription className="text-xs">
            API responses and processing logs
          </CardDescription>
        </CardHeader>
        <CardContent className="text-xs">
          {apiResponses.map((response, index) => (
            <div key={index} className="mb-4 border-b pb-2">
              <h4 className="font-medium text-green-400">Response {index + 1}:</h4>
              <pre className="bg-slate-900 p-2 rounded text-xs overflow-auto max-h-32">
                {JSON.stringify(response, null, 2)}
              </pre>
            </div>
          ))}
          {apiResponses.length === 0 && (
            <p className="text-muted-foreground">No API responses yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};