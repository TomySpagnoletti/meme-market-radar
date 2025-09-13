import { useState } from "react";
import { ApiKeyInput } from "@/components/ApiKeyInput";
import { Dashboard } from "@/components/Dashboard";

const Index = () => {
  const [apiKey, setApiKey] = useState<string | null>(() =>
    sessionStorage.getItem("bitquery-api-key")
  );

  const handleApiKeySubmit = (key: string) => {
    // Store API key in sessionStorage for this session
    sessionStorage.setItem("bitquery-api-key", key);
    setApiKey(key);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("bitquery-api-key");
    setApiKey(null);
  };

  if (!apiKey) {
    return <ApiKeyInput onApiKeySubmit={handleApiKeySubmit} isLoading={false} />;
  }

  return <Dashboard apiKey={apiKey} onLogout={handleLogout} />;
};

export default Index;
