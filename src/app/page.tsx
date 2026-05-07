"use client"

import * as React from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { 
  AlertTriangle, 
  ArrowRight, 
  Plus, 
  Utensils, 
  ChefHat, 
  TrendingDown,
  Timer,
  Search,
  ShoppingCart
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function Dashboard() {
  return (
    <AppLayout>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-primary shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Inventory Value</CardTitle>
            <TrendingDown className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$124.50</div>
            <p className="text-xs text-muted-foreground">-4% from last week</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-accent shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Expiring Soon</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5 Items</div>
            <p className="text-xs text-muted-foreground">Within next 48 hours</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-destructive shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Low Stock</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8 Items</div>
            <p className="text-xs text-muted-foreground">Action required</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-primary shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Meals Planned</CardTitle>
            <ChefHat className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12 / 21</div>
            <Progress value={60} className="mt-2 h-2" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        <Card className="lg:col-span-4 shadow-sm border-none bg-white">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-headline">Today's Meal Plan</CardTitle>
              <CardDescription>Stay on track with your nutrition goals</CardDescription>
            </div>
            <Link href="/meal-planner">
              <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/5">
                Full Plan <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { time: "Breakfast", meal: "Berry Protein Oatmeal", status: "Ready", icon: Timer },
              { time: "Lunch", meal: "Grilled Chicken Salad", status: "Missing Items", icon: AlertTriangle },
              { time: "Dinner", meal: "Lentil Soup", status: "Ready", icon: Timer },
            ].map((slot) => (
              <div key={slot.time} className="flex items-center justify-between rounded-xl border p-4 transition-all hover:bg-muted/30">
                <div className="flex items-center gap-4">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${slot.status === 'Ready' ? 'bg-accent/20 text-accent' : 'bg-destructive/10 text-destructive'}`}>
                    <slot.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase">{slot.time}</p>
                    <p className="font-medium">{slot.meal}</p>
                  </div>
                </div>
                <Badge variant={slot.status === 'Ready' ? 'outline' : 'destructive'} className={slot.status === 'Ready' ? 'border-accent text-accent' : ''}>
                  {slot.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 shadow-sm border-none bg-white">
          <CardHeader>
            <CardTitle className="font-headline">Quick Actions</CardTitle>
            <CardDescription>Manage your inventory on the go</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Button className="h-24 flex-col gap-2 bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
              <Plus className="h-6 w-6" />
              <span>Add Item</span>
            </Button>
            <Button variant="outline" className="h-24 flex-col gap-2 border-primary/20 hover:bg-primary/5">
              <Search className="h-6 w-6 text-primary" />
              <span>Lookup</span>
            </Button>
            <Button variant="outline" className="h-24 flex-col gap-2 border-primary/20 hover:bg-primary/5">
              <Utensils className="h-6 w-6 text-primary" />
              <span>Scan Recipe</span>
            </Button>
            <Button variant="outline" className="h-24 flex-col gap-2 border-accent/40 bg-accent/5 hover:bg-accent/10">
              <ChefHat className="h-6 w-6 text-primary" />
              <span>AI Suggest</span>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-none shadow-sm overflow-hidden bg-primary text-primary-foreground">
          <div className="relative p-6">
            <div className="relative z-10 flex flex-col justify-between h-full space-y-6">
              <div>
                <h3 className="text-2xl font-bold font-headline mb-2">Smart Grocery List</h3>
                <p className="text-primary-foreground/80 text-sm max-w-xs">
                  We've automatically added 5 low-stock items to your shopping list.
                </p>
              </div>
              <Link href="/shopping-list">
                <Button variant="secondary" className="w-fit">
                  Review List
                </Button>
              </Link>
            </div>
            <div className="absolute right-0 bottom-0 opacity-20 transform translate-x-1/4 translate-y-1/4">
               <ShoppingCart className="w-48 h-48" />
            </div>
          </div>
        </Card>

        <Card className="border-none shadow-sm overflow-hidden bg-accent">
          <div className="relative p-6">
             <div className="relative z-10 flex flex-col justify-between h-full space-y-6">
              <div>
                <h3 className="text-2xl font-bold font-headline mb-2 text-primary">AI Meal Suggester</h3>
                <p className="text-primary/70 text-sm max-w-xs">
                  Get creative with what's already in your fridge to reduce food waste.
                </p>
              </div>
              <Link href="/meal-planner?tab=suggestions">
                <Button variant="default" className="w-fit bg-primary hover:bg-primary/90">
                  Try AI Suggestions
                </Button>
              </Link>
            </div>
             <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-1/4 translate-y-1/4">
               <ChefHat className="w-48 h-48" />
            </div>
          </div>
        </Card>
      </div>
    </AppLayout>
  )
}
