import { NextResponse } from "next/server"
import { getAnalyticsDashboardData } from "@/app/actions/analytics-actions"

export async function GET() {
  try {
    const data = await getAnalyticsDashboardData()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Analytics API error:", error)

    // fallback instead of crashing
    return NextResponse.json({
      summary: {
        totalInventoryItems: 0,
        totalInventoryValue: 0,
        expiredInventoryValue: 0,
        lowStockItems: 0,
        expiringSoonItems: 0,
        totalRecipes: 0,
        pendingShoppingItems: 0,
        completedShoppingItems: 0,
        activeLeftovers: 0,
        overdueLeftovers: 0,
        freshnessPercent: 0,
      },
      weeklyInventoryAdds: [],
      categoryValueDistribution: [],
      watchlist: [],
    })
  }
}