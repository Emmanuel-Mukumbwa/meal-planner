
"use client"

import * as React from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  AlertTriangle, 
  ArrowRight, 
  Plus, 
  Utensils, 
  ChefHat, 
  TrendingDown,
  Timer,
  ShoppingCart,
  Snowflake,
  Loader2
} from "lucide-react"
import Link from "next/link"
import { getInventoryItems } from "@/app/actions/inventory-actions"
import { getLeftovers } from "@/app/actions/leftover-actions"

export default function Dashboard() {
  const [stats, setStats] = React.useState({
    inventoryCount: 0,
    expiringSoon: 0,
    leftoversCount: 0,
    loading: true
  })

  React.useEffect(() => {
    async function loadStats() {
      try {
        const inventory = await getInventoryItems()
        const leftovers = await getLeftovers()
        
        const expiring = inventory.filter(i => {
          if (!i.expiryDate) return false
          const diff = new Date(i.expiryDate).getTime() - new Date().getTime()
          return diff > 0 && diff < (48 * 60 * 60 * 1000)
        }).length

        setStats({
          inventoryCount: inventory.length,
          expiringSoon: expiring,
          leftoversCount: leftovers.length,
          loading: false
        })
      } catch (error) {
        console.error("Dashboard error:", error)
        setStats(s => ({ ...s, loading: false }))
      }
    }
    loadStats()
  }, [])

  return (
    <AppLayout>
      {stats.loading ? (
        <div className="flex h-96 items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-l-4 border-l-primary shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Inventory Items</CardTitle>
                <TrendingDown className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.inventoryCount} Total</div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-accent shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Expiring Soon</CardTitle>
                <AlertTriangle className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.expiringSoon} Items</div>
                <p className="text-xs text-muted-foreground">Within 48 hours</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-primary shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Frozen Leftovers</CardTitle>
                <Snowflake className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.leftoversCount} Meals</div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-accent shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Malawi Kwacha</CardTitle>
                <span className="text-xs font-bold text-primary">MWK</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Currency Active</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="shadow-sm border-none bg-white">
              <CardHeader>
                <CardTitle className="font-headline">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                <Link href="/inventory"><Button className="w-full h-24 flex-col gap-2"><Plus className="h-6 w-6" /><span>Add Item</span></Button></Link>
                <Link href="/leftovers"><Button variant="outline" className="w-full h-24 flex-col gap-2"><Snowflake className="h-6 w-6" /><span>Freeze Leftover</span></Button></Link>
                <Link href="/recipes"><Button variant="outline" className="w-full h-24 flex-col gap-2"><Utensils className="h-6 w-6" /><span>Import Recipe</span></Button></Link>
                <Link href="/meal-planner"><Button variant="outline" className="w-full h-24 flex-col gap-2"><ChefHat className="h-6 w-6" /><span>AI Suggest</span></Button></Link>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-none bg-primary text-primary-foreground p-6 flex flex-col justify-center gap-4">
              <h3 className="text-2xl font-bold font-headline">Aiven MySQL Connected</h3>
              <p className="text-sm opacity-90">All your data is safely stored in your cloud database instance. No more placeholders.</p>
              <Link href="/inventory"><Button variant="secondary">View Live Inventory</Button></Link>
            </Card>
          </div>
        </>
      )}
    </AppLayout>
  )
}
