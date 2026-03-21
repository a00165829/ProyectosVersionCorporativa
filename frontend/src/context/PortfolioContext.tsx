import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

interface Portfolio {
  id: string
  name: string
  company_name: string | null
}

interface PortfolioContextType {
  portfolios: Portfolio[]
  activePortfolioId: string | null
  activePortfolio: Portfolio | null
  setActivePortfolioId: (id: string) => void
}

const PortfolioContext = createContext<PortfolioContextType>({
  portfolios: [],
  activePortfolioId: null,
  activePortfolio: null,
  setActivePortfolioId: () => {},
})

export const usePortfolio = () => useContext(PortfolioContext)

export function PortfolioProvider({ children }: { children: ReactNode }) {
  const [activePortfolioId, setActivePortfolioId] = useState<string | null>(
    localStorage.getItem('activePortfolioId')
  )

  const { data: portfolios = [] } = useQuery<Portfolio[]>({
    queryKey: ['portfolios'],
    queryFn: () => api.get<Portfolio[]>('/api/portfolios'),
  })

  useEffect(() => {
    if (portfolios.length > 0 && !activePortfolioId) {
      setActivePortfolioId(portfolios[0].id)
    }
  }, [portfolios])

  const handleSetActive = (id: string) => {
    setActivePortfolioId(id)
    localStorage.setItem('activePortfolioId', id)
  }

  const activePortfolio = portfolios.find(p => p.id === activePortfolioId) || null

  return (
    <PortfolioContext.Provider value={{
      portfolios, activePortfolioId, activePortfolio,
      setActivePortfolioId: handleSetActive,
    }}>
      {children}
    </PortfolioContext.Provider>
  )
}
