import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Key, ExternalLink } from "lucide-react";

interface ApiKeyInputProps {
  onApiKeySubmit: (apiKey: string) => void;
  isLoading?: boolean;
}

export const ApiKeyInput = ({ onApiKeySubmit, isLoading }: ApiKeyInputProps) => {
  const [apiKey, setApiKey] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim()) {
      onApiKeySubmit(apiKey.trim());
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gradient-card border-border/50 shadow-card">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center mb-4">
            <Key className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-xl font-bold">Configuration API</CardTitle>
          <CardDescription>
            Entrez votre clé API Bitquery pour accéder aux données de trading
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription className="text-sm">
              Obtenez votre clé API gratuite sur{" "}
              <a 
                href="https://bitquery.io/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-crypto-primary hover:text-crypto-secondary inline-flex items-center gap-1 transition-colors"
              >
                Bitquery.io
                <ExternalLink className="h-3 w-3" />
              </a>
            </AlertDescription>
          </Alert>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiKey">Clé API Bitquery</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="Entrez votre clé API..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                required
                className="bg-background/50 border-border focus:border-crypto-primary"
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-gradient-primary hover:bg-gradient-primary/90 text-primary-foreground"
              disabled={!apiKey.trim() || isLoading}
            >
              {isLoading ? "Connexion..." : "Accéder au Dashboard"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};