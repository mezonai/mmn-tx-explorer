'use client';
import { createContext, ReactNode, useContext, useState } from 'react';
interface CampaignDetailContextType {
  hidden: boolean;
  setHidden: (hidden: boolean) => void;
}
interface CampaignDetailProviderProps {
  children: ReactNode;
}
const CampaignDetailContext = createContext<CampaignDetailContextType | undefined>(undefined);
export function CampaignDetailProvider({ children }: CampaignDetailProviderProps) {
  const [hidden, setHidden] = useState<boolean>(false);
  const value: CampaignDetailContextType = {
    hidden,
    setHidden,
  };
  return <CampaignDetailContext.Provider value={value}>{children}</CampaignDetailContext.Provider>;
}
export function useCampaignDetail(): CampaignDetailContextType {
  const context = useContext(CampaignDetailContext);

  if (context === undefined) {
    throw new Error('useCampaignDetail must be used within an CampaignDetailProvider');
  }

  return context;
}
export function useHidden() {
  const { hidden, setHidden } = useCampaignDetail();
  return { hidden, setHidden };
}
