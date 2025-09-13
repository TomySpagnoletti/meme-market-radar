import { useQuery } from "@tanstack/react-query";
import { fetchAllAnalyticsData, AllAnalyticsData } from "@/lib/api";

export const useAnalyticsData = (apiKey: string) => {
  return useQuery<AllAnalyticsData, Error>({
    queryKey: ["analyticsData", apiKey],
    queryFn: () => fetchAllAnalyticsData(apiKey),
    enabled: !!apiKey, // Only run the query if the API key is present
  });
};
