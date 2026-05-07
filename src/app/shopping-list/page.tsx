"use client"

import * as React from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { MOCK_SHOPPING_LIST, MOCK_INVENTORY } from "@/app/lib/mock-data"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Plus, 
  ShoppingCart, 
  Trash2, 
  Share2, 
  RefreshCcw,
  PackageCheck
} from "lucide-react"

export default function ShoppingListPage() {
  const [items, setItems] = React.useState(MOCK_SHOPPING_LIST)
  const [newItemName, setNewItemName] = React.useState("")

  const addItem = () => {
    if (!newItemName) return
    const newItem = {
      id: Math.random().toString(),
      name: newItemName,
      quantity: 1,
      unit: 'pcs',
      completed: false,
      category: 'Uncategorized'
    }
    setItems([newItem, ...items])
    setNewItemName("")
  }

  const toggleComplete = (id: string) => {
    setItems(items.map(item => item.id === id ? { ...item, completed: !item.completed } : item))
  }

  const autoRestock = () => {
    const lowStock = MOCK_INVENTORY.filter(i => i.quantity <= i.lowStockThreshold)
    const newItems = lowStock.map(ls => ({
      id: `ls-${ls.id}`,
      name: ls.name,
      quantity: Math.max(1, (ls.lowStockThreshold * 2) - ls.quantity),
      unit: ls.unit,
      completed: false,
      category: ls.category
    }))
    setItems([...newItems, ...items])
  }

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold font-headline tracking-tight">Shopping List</h1>
            <p className="text-muted-foreground">Don't forget the essentials for your meal plan.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-2" onClick={autoRestock}>
              <RefreshCcw className="h-4 w-4" /> Auto-Restock Low Items
            </Button>
            <Button className="bg-primary">
              <Share2 className="mr-2 h-4 w-4" /> Share List
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
             <Card className="border-none shadow-sm">
                <CardContent className="p-4 flex gap-2">
                  <Input 
                    placeholder="Quick add item..." 
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addItem()}
                  />
                  <Button onClick={addItem} size="icon" className="bg-primary shrink-0">
                    <Plus className="h-5 w-5" />
                  </Button>
                </CardContent>
             </Card>

             <Card className="border-none shadow-sm overflow-hidden">
               <CardHeader className="bg-muted/30">
                 <CardTitle className="text-sm font-headline uppercase tracking-wider text-muted-foreground">To Buy</CardTitle>
               </CardHeader>
               <CardContent className="p-0 divide-y">
                 {items.filter(i => !i.completed).map((item) => (
                   <div key={item.id} className="flex items-center justify-between p-4 transition-colors hover:bg-muted/10">
                     <div className="flex items-center gap-4">
                       <Checkbox 
                         id={item.id} 
                         checked={item.completed} 
                         onCheckedChange={() => toggleComplete(item.id)}
                         className="h-5 w-5 rounded-full border-primary"
                       />
                       <div>
                         <label htmlFor={item.id} className="font-medium cursor-pointer">{item.name}</label>
                         <p className="text-xs text-muted-foreground">{item.quantity} {item.unit} • {item.category}</p>
                       </div>
                     </div>
                     <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                       <Trash2 className="h-4 w-4" />
                     </Button>
                   </div>
                 ))}
                 {items.filter(i => !i.completed).length === 0 && (
                    <div className="p-10 text-center space-y-2">
                       <PackageCheck className="h-12 w-12 mx-auto text-accent" />
                       <p className="font-medium">All caught up! Your pantry is full.</p>
                    </div>
                 )}
               </CardContent>
             </Card>

             <Card className="border-none shadow-sm overflow-hidden opacity-60">
               <CardHeader className="bg-muted/10">
                 <CardTitle className="text-sm font-headline uppercase tracking-wider text-muted-foreground">Completed</CardTitle>
               </CardHeader>
               <CardContent className="p-0 divide-y">
                 {items.filter(i => i.completed).map((item) => (
                   <div key={item.id} className="flex items-center justify-between p-4 bg-muted/5">
                     <div className="flex items-center gap-4">
                        <Checkbox 
                         id={item.id} 
                         checked={item.completed} 
                         onCheckedChange={() => toggleComplete(item.id)}
                         className="h-5 w-5 rounded-full border-muted-foreground"
                       />
                       <div>
                         <label htmlFor={item.id} className="font-medium line-through text-muted-foreground">{item.name}</label>
                         <p className="text-xs text-muted-foreground">{item.quantity} {item.unit}</p>
                       </div>
                     </div>
                   </div>
                 ))}
               </CardContent>
             </Card>
          </div>

          <div className="space-y-6">
            <Card className="bg-primary text-primary-foreground border-none shadow-md overflow-hidden">
               <CardHeader>
                 <CardTitle className="font-headline">Summary</CardTitle>
               </CardHeader>
               <CardContent className="space-y-4">
                 <div className="flex justify-between text-sm">
                   <span>Remaining Items</span>
                   <span className="font-bold">{items.filter(i => !i.completed).length}</span>
                 </div>
                 <div className="flex justify-between text-sm">
                   <span>Total Progress</span>
                   <span className="font-bold">
                     {Math.round((items.filter(i => i.completed).length / items.length) * 100) || 0}%
                   </span>
                 </div>
                 <div className="h-2 w-full bg-primary-foreground/20 rounded-full overflow-hidden">
                   <div 
                    className="h-full bg-accent transition-all duration-500" 
                    style={{ width: `${(items.filter(i => i.completed).length / items.length) * 100 || 0}%` }}
                   />
                 </div>
                 <Button variant="secondary" className="w-full mt-4">
                   Bulk Add to Inventory
                 </Button>
               </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
               <CardHeader>
                 <CardTitle className="text-base">Shop by Category</CardTitle>
               </CardHeader>
               <CardContent className="space-y-2">
                 {['Vegetables', 'Dairy', 'Bakery', 'Meat', 'Pantry'].map(cat => (
                   <div key={cat} className="flex items-center justify-between py-1 border-b border-muted last:border-0 text-sm">
                     <span>{cat}</span>
                     <Badge variant="outline">{items.filter(i => i.category === cat).length}</Badge>
                   </div>
                 ))}
               </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}