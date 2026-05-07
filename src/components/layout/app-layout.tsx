"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  LayoutDashboard, 
  Warehouse, 
  CalendarDays, 
  ShoppingCart, 
  UtensilsCrossed, 
  BarChart3,
  Search,
  PlusCircle,
  Bell,
  Menu
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"

const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Inventory", href: "/inventory", icon: Warehouse },
  { name: "Meal Planner", href: "/meal-planner", icon: CalendarDays },
  { name: "Recipes", href: "/recipes", icon: UtensilsCrossed },
  { name: "Shopping List", href: "/shopping-list", icon: ShoppingCart },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
]

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar">
        <SidebarHeader className="p-4">
          <Link href="/" className="flex items-center gap-3 font-headline text-xl font-bold text-primary">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-md">
              <Warehouse className="h-5 w-5" />
            </div>
            <span className="group-data-[collapsible=icon]:hidden">PantryPilot</span>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu className="px-2">
            {navItems.map((item) => (
              <SidebarMenuItem key={item.name}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
                  tooltip={item.name}
                  className="transition-all duration-200 hover:bg-accent/10"
                >
                  <Link href={item.href}>
                    <item.icon className="h-4 w-4" />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-4">
          <div className="group-data-[collapsible=icon]:hidden flex flex-col gap-2 rounded-xl bg-accent/20 p-4">
            <p className="text-xs font-semibold text-primary">Pro Tip</p>
            <p className="text-[10px] leading-relaxed text-muted-foreground">
              Add your expiry dates to get early warning alerts!
            </p>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="md:hidden" />
            <div className="hidden md:flex relative max-w-sm">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Search inventory..." 
                className="pl-8 bg-muted/50 border-none focus-visible:ring-1"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <Badge className="absolute -right-1 -top-1 h-4 w-4 bg-destructive p-0 flex items-center justify-center text-[10px]">
                3
              </Badge>
            </Button>
            <div className="h-8 w-8 rounded-full bg-accent shadow-inner ring-2 ring-background ring-offset-1" />
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6 md:p-8 lg:p-10">
          <div className="mx-auto max-w-7xl space-y-8">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}