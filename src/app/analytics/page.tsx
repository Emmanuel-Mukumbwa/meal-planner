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
  Cell
} from "recharts"
import { 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  ArrowDownRight,
  Trash2,
  DollarSign,
  ShoppingCart,
  CheckCircle2
} from "lucide-react"

const usageData = [
  { name: "Mon", usage: 45 },
  { name: "Tue", usage: 52 },
  { name: "Wed", usage: 38 },
  { name: "Thu", usage: 65 },
  { name: "Fri", usage: 48 },
  { name: "Sat", usage: 72 },
  { name: "Sun", usage: 55 },
]

const wasteData = [
  { name: "Vegetables", value: 400 },
  { name: "Dairy", value: 300 },
  { name: "Meat", value: 100 },
  { name: "Other", value: 200 },
]

const COLORS = ['#48784A', '#A7DE66', '#FF8042', '#0088FE']

export default function AnalyticsPage() {
  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold font-headline tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">Insights into your grocery spending and consumption habits.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
           <Card className="border-none shadow-sm">
             <CardHeader className="flex flex-row items-center justify-between pb-2">
               <CardTitle className="text-sm font-medium text-muted-foreground">Wasted (Expired)</CardTitle>
               <Trash2 className="h-4 w-4 text-destructive" />
             </CardHeader>
             <CardContent>
               <div className="text-2xl font-bold">$12.40</div>
               <div className="flex items-center text-xs text-destructive">
                 <ArrowUpRight className="h-3 w-3 mr-1" />
                 +2.5% from last month
               </div>
             </CardContent>
           </Card>
           <Card className="border-none shadow-sm">
             <CardHeader className="flex flex-row items-center justify-between pb-2">
               <CardTitle className="text-sm font-medium text-muted-foreground">Potential Savings</CardTitle>
               <DollarSign className="h-4 w-4 text-accent" />
             </CardHeader>
             <CardContent>
               <div className="text-2xl font-bold">$45.80</div>
               <div className="flex items-center text-xs text-primary">
                 <ArrowDownRight className="h-3 w-3 mr-1" />
                 -15% reduced waste
               </div>
             </CardContent>
           </Card>
           <Card className="border-none shadow-sm">
             <CardHeader className="flex flex-row items-center justify-between pb-2">
               <CardTitle className="text-sm font-medium text-muted-foreground">Shopping Trips</CardTitle>
               <ShoppingCart className="h-4 w-4 text-primary" />
             </CardHeader>
             <CardContent>
               <div className="text-2xl font-bold">4</div>
               <div className="text-xs text-muted-foreground">Avg. 1 trip/week</div>
             </CardContent>
           </Card>
           <Card className="border-none shadow-sm">
             <CardHeader className="flex flex-row items-center justify-between pb-2">
               <CardTitle className="text-sm font-medium text-muted-foreground">Inventory Freshness</CardTitle>
               <CheckCircle2 className="h-4 w-4 text-accent" />
             </CardHeader>
             <CardContent>
               <div className="text-2xl font-bold">88%</div>
               <div className="text-xs text-muted-foreground">Above average</div>
             </CardContent>
           </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
           <Card className="border-none shadow-sm">
             <CardHeader>
               <CardTitle className="font-headline">Consumption Rate</CardTitle>
               <CardDescription>Daily inventory usage over the last 7 days</CardDescription>
             </CardHeader>
             <CardContent className="h-[300px]">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={usageData}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} />
                   <XAxis dataKey="name" />
                   <YAxis />
                   <Tooltip />
                   <Bar dataKey="usage" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                 </BarChart>
               </ResponsiveContainer>
             </CardContent>
           </Card>

           <Card className="border-none shadow-sm">
             <CardHeader>
               <CardTitle className="font-headline">Waste by Category</CardTitle>
               <CardDescription>Percentage of food thrown away last month</CardDescription>
             </CardHeader>
             <CardContent className="h-[300px] flex items-center justify-center">
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                   <Pie
                     data={wasteData}
                     cx="50%"
                     cy="50%"
                     innerRadius={60}
                     outerRadius={80}
                     paddingAngle={5}
                     dataKey="value"
                   >
                     {wasteData.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                     ))}
                   </Pie>
                   <Tooltip />
                 </PieChart>
               </ResponsiveContainer>
             </CardContent>
           </Card>
        </div>

        <Card className="border-none shadow-sm">
           <CardHeader>
             <CardTitle className="font-headline">Most Used Ingredients</CardTitle>
             <CardDescription>Your pantry's greatest hits</CardDescription>
           </CardHeader>
           <CardContent>
             <div className="space-y-4">
               {[
                 { name: "Eggs", count: 24, trend: "up", percent: "12%" },
                 { name: "Milk", count: 8, trend: "down", percent: "5%" },
                 { name: "Spinach", count: 1.5, trend: "up", percent: "20%" },
                 { name: "Chicken", count: 4, trend: "stable", percent: "0%" },
               ].map((item) => (
                 <div key={item.name} className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {item.name[0]}
                      </div>
                      <span className="font-medium">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-semibold">{item.count} items</span>
                      <Badge className={item.trend === 'up' ? 'bg-primary/20 text-primary border-none' : 'bg-muted text-muted-foreground border-none'}>
                        {item.trend === 'up' ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                        {item.percent}
                      </Badge>
                    </div>
                 </div>
               ))}
             </div>
           </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}