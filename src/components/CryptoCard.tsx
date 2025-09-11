import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Activity, Zap } from "lucide-react";

interface CryptoCardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: "up" | "down" | "neutral";
  icon?: "trending" | "activity" | "zap";
  className?: string;
}

export const CryptoCard = ({ title, value, subtitle, trend = "neutral", icon = "trending", className }: CryptoCardProps) => {
  const IconComponent = {
    trending: TrendingUp,
    activity: Activity,
    zap: Zap,
  }[icon];

  const trendColors = {
    up: "crypto-secondary",
    down: "destructive",
    neutral: "crypto-neutral",
  };

  return (
    <Card className={`bg-gradient-card border-border/50 shadow-card hover:shadow-glow transition-all duration-300 hover:scale-105 ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <IconComponent className="h-4 w-4 text-crypto-primary" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground mb-1">{value}</div>
        {subtitle && (
          <Badge variant="secondary" className={`text-${trendColors[trend]} bg-${trendColors[trend]}/10 border-${trendColors[trend]}/20`}>
            {subtitle}
          </Badge>
        )}
      </CardContent>
    </Card>
  );
};