import { useState, useEffect } from "react";
import { ApiKeyInput } from "@/components/ApiKeyInput";
import { Dashboard } from "@/components/Dashboard";

const Index = () => {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleApiKeySubmit = (key: string) => {
    setIsLoading(true);
    // Store API key in localStorage for this session
    localStorage.setItem("bitquery-api-key", key);
    setTimeout(() => {
      setApiKey(key);
      setIsLoading(false);
    }, 1000);
  };

  const handleLogout = () => {
    localStorage.removeItem("bitquery-api-key");
    setApiKey(null);
  };

  // Check for existing API key on component mount
  useEffect(() => {
    const storedKey = localStorage.getItem("bitquery-api-key");
    if (storedKey) {
      setApiKey(storedKey);
    }
  }, []);

  if (!apiKey) {
    return <ApiKeyInput onApiKeySubmit={handleApiKeySubmit} isLoading={isLoading} />;
  }

  return <Dashboard apiKey={apiKey} onLogout={handleLogout} />;
};

export default Index;
