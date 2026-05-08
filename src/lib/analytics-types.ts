export type InventoryAnalyticsItem = {
  id: string
  name: string
  quantity: number
  unit: string
  category: string | null
  expiryDate: string | null
  lowStockThreshold: number | null
  price: number | null
  createdAt: string
}

export type AnalyticsWatchlistItem = {
  id: string
  name: string
  category: string
  quantity: number
  unit: string
  expiryDate: string | null
  daysLeft: number | null
  lowStockThreshold: number
  value: number
  status: "expired" | "expiring" | "low-stock" | "healthy"
}

export type AnalyticsSummary = {
  totalInventoryItems: number
  totalInventoryValue: number
  expiredInventoryValue: number
  lowStockItems: number
  expiringSoonItems: number
  totalRecipes: number
  pendingShoppingItems: number
  completedShoppingItems: number
  activeLeftovers: number
  overdueLeftovers: number
  freshnessPercent: number
}

export type AnalyticsDashboardData = {
  summary: AnalyticsSummary
  weeklyInventoryAdds: {
    name: string
    quantity: number
    value: number
  }[]
  categoryValueDistribution: {
    name: string
    value: number
  }[]
  watchlist: AnalyticsWatchlistItem[]
}