import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AIModelId, ApiKeyContextType } from '../types';

const ApiKeyContext = createContext<ApiKeyContextType | undefined>(undefined);

export const ApiKeyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [apiKey, setApiKeyState] = useState('');
  const [selectedModel, setSelectedModelState] = useState<AIModelId>('gemini-3-flash-preview');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    const storedKey = localStorage.getItem('gemini_api_key');
    const storedModel = localStorage.getItem('gemini_model');
    
    if (storedKey) setApiKeyState(storedKey);
    if (storedModel) setSelectedModelState(storedModel as AIModelId);
    
    // Open modal if no key is found on init
    if (!storedKey) {
        setIsSettingsOpen(true);
    }
  }, []);

  const setApiKey = (key: string) => {
    setApiKeyState(key);
    localStorage.setItem('gemini_api_key', key);
  };

  const setSelectedModel = (model: AIModelId) => {
    setSelectedModelState(model);
    localStorage.setItem('gemini_model', model);
  };

  return (
    <ApiKeyContext.Provider value={{ apiKey, setApiKey, selectedModel, setSelectedModel, isSettingsOpen, setIsSettingsOpen }}>
      {children}
    </ApiKeyContext.Provider>
  );
};

export const useApiKey = () => {
  const context = useContext(ApiKeyContext);
  if (!context) {
    throw new Error('useApiKey must be used within an ApiKeyProvider');
  }
  return context;
};