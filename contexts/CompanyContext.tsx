'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api } from '@/services/api';
import {
  NavigationContext,
  CompanyData,
  BranchData,
  getNavigationContext,
  setNavigationContext,
  getAvailableCompanies,
  getCompanyBranches,
  initializeNavigation,
  navigateToCompany
} from '@/lib/navigation-storage';
import { useAuth } from '@/hooks/auth';

interface CompanyContextType {
  currentContext: NavigationContext | null;
  availableCompanies: CompanyData[];
  availableBranches: BranchData[];
  isLoading: boolean;
  switchToCompany: (companyId: number) => Promise<void>;
  switchToBranch: (branchId: number) => Promise<void>;
  switchToMainCompany: () => Promise<void>;
  refreshContext: () => Promise<void>;
  isInBranchContext: boolean;
  currentCompanyName: string;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export const CompanyProvider = ({ children }: { children: ReactNode }) => {
  const [currentContext, setCurrentContextState] = useState<NavigationContext | null>(null);
  const [availableCompanies, setAvailableCompanies] = useState<CompanyData[]>([]);
  const [availableBranches, setAvailableBranches] = useState<BranchData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { updateCompanyId } = useAuth();

  const updateContext = async () => {
    try {
      let companies = getAvailableCompanies();
      if (companies.length === 0) {
        const response = await api.get('/companies');
        const data: CompanyData[] = response.data || [];
        initializeNavigation(data);
        companies = getAvailableCompanies();
      }
      const ctx = getNavigationContext();
      let branches: BranchData[] = [];
      const mainCompany = companies.find((c) => c.company_type === 'main');
      if (mainCompany) branches = getCompanyBranches(mainCompany.id);
      setCurrentContextState(ctx);
      setAvailableCompanies(companies);
      setAvailableBranches(branches);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    updateContext();
    const handler = () => updateContext();
    window.addEventListener('navigationContextChanged', handler);
    return () => window.removeEventListener('navigationContextChanged', handler);
  }, []);

  const switchToCompany = async (companyId: number) => {
    setIsLoading(true);
    await navigateToCompany(companyId, 'main');
    updateCompanyId(companyId);
    window.location.reload();
  };

  const switchToBranch = async (branchId: number) => {
    setIsLoading(true);
    await navigateToCompany(branchId, 'branch');
    updateCompanyId(branchId);
    window.location.reload();
  };

  const switchToMainCompany = async () => {
    const main = availableCompanies.find((c) => c.company_type === 'main');
    if (main) await switchToCompany(main.id);
  };

  const refreshContext = async () => {
    setIsLoading(true);
    await updateContext();
  };

  const isInBranchContext = currentContext?.currentCompanyType === 'branch';
  const currentCompanyName = currentContext?.currentCompanyName || '';

  const value: CompanyContextType = {
    currentContext,
    availableCompanies,
    availableBranches,
    isLoading,
    switchToCompany,
    switchToBranch,
    switchToMainCompany,
    refreshContext,
    isInBranchContext: !!isInBranchContext,
    currentCompanyName,
  };

  return <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>;
};

export const useCompanyContext = (): CompanyContextType => {
  const ctx = useContext(CompanyContext);
  if (!ctx) throw new Error('useCompanyContext deve ser usado dentro de um CompanyProvider');
  return ctx;
};

export default CompanyContext;
