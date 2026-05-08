"use client"

import * as React from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import {
  Trash2,
  DollarSign,
  ShoppingCart,
  CheckCircle2,
  Loader2,
  Package,
  AlertTriangle,
  ChefHat,
  Clock3,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { AnalyticsDashboardData } from "@/app/lib/analytics-types"
import { useToast } from "@/hooks/use-toast"

const COLORS = ["#48784A", "#A7DE66", "#FF8042", "#0088FE", "#A855F7", "#F59E0B"]

function formatMoney(amount: number) {
  return `MK ${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function statusBadgeClass(status: "expired" | "expiring" | "low-stock" | "healthy") {
  switch (status) {
    case "expired":
      return "border-destructive text-destructive"
    case "expiring":
      return "border-orange-500 text-orange-500"
    case "low-stock":
      return "border-amber-500 text-amber-500"
    default:
      return "border-primary text-primary"
  }
}

export default function AnalyticsPage() {
  const { toast } = useToast()
  const [data, setData] = React.useState<AnalyticsDashboardData | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    void loadData()
  }, [])

  const loadData = async () => {
    try {
      const response = await fetch("/api/analytics", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      })

      if (!response.ok) {
        throw new Error(`Failed to load analytics: ${response.status}`)
      }

      const result = (await response.json()) as AnalyticsDashboardData
      setData(result)
    } catch (error) {
      console.error("Analytics load error:", error)
      toast({
        title: "Analytics unavailable",
        description: "Could not load live metrics right now.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const summary = data?.summary

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold font-headline tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            Live insights from your inventory, leftovers, shopping list, and recipes.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card className="border-none shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Inventory Value</CardTitle>
                  <DollarSign className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatMoney(summary?.totalInventoryValue || 0)}</div>
                  <div className="text-xs text-muted-foreground">
                    Based on quantity × price in inventory
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Expired Inventory Value</CardTitle>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatMoney(summary?.expiredInventoryValue || 0)}</div>
                  <div className="text-xs text-muted-foreground">
                    Value already past expiry date
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Low Stock Items</CardTitle>
                  <Package className="h-4 w-4 text-amber-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary?.lowStockItems || 0}</div>
                  <div className="text-xs text-muted-foreground">
                    Items at or below their threshold
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Expiring Soon</CardTitle>
                  <Clock3 className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary?.expiringSoonItems || 0}</div>
                  <div className="text-xs text-muted-foreground">
                    Inventory expiring in 7 days or less
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Pending Shopping Items</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary?.pendingShoppingItems || 0}</div>
                  <div className="text-xs text-muted-foreground">
                    Items still on your shopping list
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Recipes & Leftovers</CardTitle>
                  <ChefHat className="h-4 w-4 text-accent" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {summary?.totalRecipes || 0} recipes
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {summary?.activeLeftovers || 0} frozen, {summary?.overdueLeftovers || 0} overdue leftovers
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="font-headline">Inventory Additions (Last 7 Days)</CardTitle>
                  <CardDescription>How much inventory entered the system each day</CardDescription>
                </CardHeader>
                <CardContent className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data?.weeklyInventoryAdds || []}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip
                        formatter={(value: number, name: string) => [
                          name === "quantity" ? value : formatMoney(value),
                          name === "quantity" ? "Quantity" : "Value",
                        ]}
                      />
                      <Bar dataKey="quantity" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="font-headline">Inventory Value by Category</CardTitle>
                  <CardDescription>Where your inventory money is currently sitting</CardDescription>
                </CardHeader>
                <CardContent className="h-[320px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data?.categoryValueDistribution || []}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={85}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {(data?.categoryValueDistribution || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatMoney(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="font-headline">Inventory Watchlist</CardTitle>
                <CardDescription>Items that need attention now or soon</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(data?.watchlist || []).map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col gap-3 rounded-xl border bg-muted/20 p-4 md:flex-row md:items-center md:justify-between"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{item.name}</span>
                          <Badge variant="outline" className={statusBadgeClass(item.status)}>
                            {item.status.replace("-", " ")}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {item.category} • {item.quantity} {item.unit}
                          {item.expiryDate
                            ? ` • Expires ${new Date(item.expiryDate).toLocaleDateString()}`
                            : " • No expiry date"}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-sm">
                        <span className="rounded-full bg-background px-3 py-1 border">
                          Value: {formatMoney(item.value)}
                        </span>
                        <span className="rounded-full bg-background px-3 py-1 border">
                          {item.daysLeft === null
                            ? "No expiry"
                            : item.daysLeft < 0
                            ? `${Math.abs(item.daysLeft)} days overdue`
                            : `${item.daysLeft} days left`}
                        </span>
                      </div>
                    </div>
                  ))}

                  {(!data?.watchlist || data.watchlist.length === 0) && (
                    <div className="rounded-2xl border-2 border-dashed p-10 text-center">
                      <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-primary" />
                      <h3 className="text-lg font-semibold">No urgent inventory items</h3>
                      <p className="text-muted-foreground">
                        Your current inventory does not have any low-stock or expiring items right now.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-3">
              <Card className="border-none shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Freshness Rate</CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary?.freshnessPercent || 0}%</div>
                  <div className="text-xs text-muted-foreground">Items still within expiry window</div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Recipes Saved</CardTitle>
                  <ChefHat className="h-4 w-4 text-accent" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary?.totalRecipes || 0}</div>
                  <div className="text-xs text-muted-foreground">Stored in your recipe book</div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Leftovers Overdue</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary?.overdueLeftovers || 0}</div>
                  <div className="text-xs text-muted-foreground">Frozen leftovers past their storage window</div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  )
}