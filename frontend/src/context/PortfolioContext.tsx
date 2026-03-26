import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

interface Portfolio {
  id: string
  name: string
  company_id: string | null
  company_name: string | null
}

interface Company {
  id: string
  name: string
}

interface PortfolioContextType {
  portfolios: Portfolio[]
  companies: Company[]
  activeCompanyId: string | null
  activeCompany: Company | null
  setActiveCompanyId: (id: string) => void
  companyPortfolios: Portfolio[]
  activePortfolioId: string | null
  activePortfolio: Portfolio | null
  setActivePortfolioId: (id: string) => void
}

const PortfolioContext = createContext<PortfolioContextType>({
  portfolios: [],
  companies: [],
  activeCompanyId: null,
  activeCompany: null,
  setActiveCompanyId: () => {},
  companyPortfolios: [],
  activePortfolioId: null,
  activePortfolio: null,
  setActivePortfolioId: () => {},
})

export const usePortfolio = () => useContext(PortfolioContext)

export function PortfolioProvider({ children }: { children: ReactNode }) {
  const [activeCompanyId, setActiveCompanyIdState] = useState<string | null>(
    localStorage.getItem('activeCompanyId')
  )
  const [activePortfolioId, setActivePortfolioIdState] = useState<string | null>(
    localStorage.getItem('activePortfolioId')
  )

  const { data: allPortfolios = [] } = useQuery<Portfolio[]>({
    queryKey: ['portfolios'],
    queryFn: () => api.get<Portfolio[]>('/api/portfolios'),
  })

  // Get user permissions from auth context (stored in sessionStorage after login)
  const getUserPerms = () => {
    try {
      const stored = sessionStorage.getItem('user_perms')
      if (stored) return JSON.parse(stored) as { companyIds: string[]; portfolioIds: string[] }
    } catch {}
    return { companyIds: [] as string[], portfolioIds: [] as string[] }
  }

  const perms = getUserPerms()

  // Filter portfolios by user permissions
  // Empty array = no restrictions (see all)
  const portfolios = useMemo(() => {
    let filtered = allPortfolios
    if (perms.portfolioIds.length > 0) {
      filtered = filtered.filter(p => perms.portfolioIds.includes(p.id))
    }
    return filtered
  }, [allPortfolios, perms.portfolioIds])

  // Derive unique companies from filtered portfolios, then apply company permissions
  const companies = useMemo(() => {
    const map = new Map<string, string>()
    for (const p of portfolios) {
      if (p.company_id && p.company_name) {
        map.set(p.company_id, p.company_name)
      }
    }
    let list = Array.from(map, ([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name))
    // Filter by company permissions if configured
    if (perms.companyIds.length > 0) {
      list = list.filter(c => perms.companyIds.includes(c.id))
    }
    return list
  }, [portfolios, perms.companyIds])

  // Auto-select first company if none selected
  useEffect(() => {
    if (companies.length > 0 && !activeCompanyId) {
      const first = companies[0].id
      setActiveCompanyIdState(first)
      localStorage.setItem('activeCompanyId', first)
    }
  }, [companies])

  // Filter portfolios by selected company
  const companyPortfolios = useMemo(() => {
    if (!activeCompanyId) return portfolios
    return portfolios.filter(p => p.company_id === activeCompanyId)
  }, [portfolios, activeCompanyId])

  // Auto-select first portfolio when company changes
  useEffect(() => {
    if (companyPortfolios.length > 0) {
      const currentValid = companyPortfolios.some(p => p.id === activePortfolioId)
      if (!currentValid) {
        const first = companyPortfolios[0].id
        setActivePortfolioIdState(first)
        localStorage.setItem('activePortfolioId', first)
      }
    }
  }, [companyPortfolios])

  const setActiveCompanyId = (id: string) => {
    setActiveCompanyIdState(id)
    localStorage.setItem('activeCompanyId', id)
  }

  const setActivePortfolioId = (id: string) => {
    setActivePortfolioIdState(id)
    localStorage.setItem('activePortfolioId', id)
  }

  const activeCompany = companies.find(c => c.id === activeCompanyId) || null
  const activePortfolio = portfolios.find(p => p.id === activePortfolioId) || null

  return (
    <PortfolioContext.Provider value={{
      portfolios, companies,
      activeCompanyId, activeCompany, setActiveCompanyId,
      companyPortfolios,
      activePortfolioId, activePortfolio, setActivePortfolioId,
    }}>
      {children}
    </PortfolioContext.Provider>
  )
}
