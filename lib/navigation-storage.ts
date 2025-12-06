export interface CompanyData {
  id: number;
  name: string;
  email: string;
  phone_number: string;
  address: string;
  document: string;
  subdomain: string;
  company_type: 'main' | 'branch';
  parent_company_id?: number;
  created_at: string;
  updated_at: string;
  branches?: BranchData[];
}

export interface BranchData {
  id: number;
  name: string;
  document?: string;
  phone_number?: string;
  address?: string;
  email?: string;
  subdomain?: string;
  created_at: string;
  updated_at?: string;
}

export interface NavigationContext {
  currentCompanyId: number;
  currentCompanyName: string;
  currentCompanyType: 'main' | 'branch';
  parentCompanyId?: number;
  parentCompanyName?: string;
  availableCompanies: CompanyData[];
  lastUpdated: number;
}

const NAVIGATION_DATA_KEY = '@linkCallendar:navigation_data';
const NAVIGATION_CONTEXT_KEY = '@linkCallendar:navigation_context';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export const saveNavigationData = (companies: CompanyData[]): void => {
  if (typeof window === 'undefined') return;
  const navigationData = { companies, timestamp: Date.now() };
  localStorage.setItem(NAVIGATION_DATA_KEY, JSON.stringify(navigationData));
};

export const getNavigationData = (): CompanyData[] | null => {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(NAVIGATION_DATA_KEY);
  if (!stored) return null;
  const data = JSON.parse(stored);
  if (Date.now() - data.timestamp > CACHE_DURATION) {
    localStorage.removeItem(NAVIGATION_DATA_KEY);
    return null;
  }
  return data.companies;
};

export const setNavigationContext = (context: Omit<NavigationContext, 'lastUpdated'>): void => {
  if (typeof window === 'undefined') return;
  const newContext: NavigationContext = { ...context, lastUpdated: Date.now() };
  localStorage.setItem(NAVIGATION_CONTEXT_KEY, JSON.stringify(newContext));
  window.dispatchEvent(new CustomEvent('navigationContextChanged', { detail: newContext }));
};

export const getNavigationContext = (): NavigationContext | null => {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(NAVIGATION_CONTEXT_KEY);
  if (!stored) return null;
  return JSON.parse(stored);
};

export const getAvailableCompanies = (): CompanyData[] => {
  return getNavigationData() || [];
};

export const getCompanyBranches = (companyId: number): BranchData[] => {
  const data = getNavigationData();
  if (!data) return [];
  const company = data.find((c) => c.id === companyId);
  return company?.branches || [];
};

export const clearNavigationData = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(NAVIGATION_DATA_KEY);
  localStorage.removeItem(NAVIGATION_CONTEXT_KEY);
};

export const initializeNavigation = (apiData: CompanyData[]): void => {
  saveNavigationData(apiData);
  const current = getNavigationContext();
  if (!current && apiData.length > 0) {
    const first = apiData[0];
    setNavigationContext({
      currentCompanyId: first.id,
      currentCompanyName: first.name,
      currentCompanyType: first.company_type,
      parentCompanyId: first.parent_company_id,
      availableCompanies: apiData,
    });
  }
};

export const navigateToCompany = async (
  companyId: number,
  companyType: 'main' | 'branch' = 'main'
): Promise<boolean> => {
  try {
    let data = getNavigationData();
    if (!data) return false;
    let target: CompanyData | BranchData | undefined;
    let parent: CompanyData | undefined;
    if (companyType === 'main') {
      target = data.find((c) => c.id === companyId);
    } else {
      for (const c of data) {
        const b = (c.branches || []).find((x) => x.id === companyId);
        if (b) {
          target = b;
          parent = c;
          break;
        }
      }
    }
    if (!target) return false;
    setNavigationContext({
      currentCompanyId: companyId,
      currentCompanyName: (target as any).name,
      currentCompanyType: companyType,
      parentCompanyId: parent?.id,
      parentCompanyName: parent?.name,
      availableCompanies: data,
    });
    return true;
  } catch {
    return false;
  }
};
