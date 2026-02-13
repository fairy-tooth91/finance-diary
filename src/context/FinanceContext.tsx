import type { ReactNode } from 'react';
import { createContext, useContext } from 'react';
import { useFinanceData } from '../hooks/useFinanceData';
import { useAuth } from './AuthContext';

type FinanceContextType = ReturnType<typeof useFinanceData>;

const FinanceContext = createContext<FinanceContextType | null>(null);

export function FinanceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const financeData = useFinanceData(user?.id);

  return (
    <FinanceContext.Provider value={financeData}>
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
}
