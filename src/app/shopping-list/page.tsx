"use client"

import * as React from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { getShoppingList, addShoppingItem, updateShoppingItem, deleteShoppingItem } from "@/app/actions/shopping-actions"
import { ShoppingListItem } from "@/app/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Plus, ShoppingCart, Trash2, Loader2, PackageCheck } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function ShoppingListPage() {
  const { toast } = useToast()
  const [items, setItems] = React.useState<ShoppingListItem[]>([])
  const [loading, setLoading] = React.useState(true)
  const [newItemName, setNewItemName] = React.useState("")

  React.useEffect(() => {
    loadList()
  }, [])

  const loadList = async () => {
    try {
      const data = await getShoppingList()
      setItems(data)
    } finally {
      setLoading(false)
    }
  }

  const handleAddItem = async () => {
    const trimmed = newItemName.trim()
    if (!trimmed) return
    try {
      const newItem = await addShoppingItem({
        name: trimmed,
        quantity: 1,
        unit: 'pcs',
        completed: false,
        category: 'Uncategorized'
      })
      setItems([newItem as ShoppingListItem, ...items])
      setNewItemName("")
      toast({ title: "Item added", description: `${trimmed} has been added to your list.` })
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Could not add item. Please try again." })
    }
  }

  const handleToggle = async (id: string, completed: boolean) => {
    try {
      await updateShoppingItem(id, !completed)
      setItems(items.map(i => i.id === id ? { ...i, completed: !completed } : i))
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to update status." })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteShoppingItem(id)
      setItems(items.filter(i => i.id !== id))
      toast({ title: "Item removed" })
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete item." })
    }
  }

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold font-headline tracking-tight">Shopping List</h1>
          <p className="text-muted-foreground">
            Keep track of what you need to buy. Check off items as you shop and reduce last‑minute runs.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
             <Card className="border-none shadow-sm">
                <CardContent className="p-4 flex gap-2">
                  <Input
                    placeholder="Add an item... e.g., Milk, Eggs, Bread"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                  />
                  <Button onClick={handleAddItem} size="icon" className="bg-primary">
                    <Plus className="h-5 w-5" />
                  </Button>
                </CardContent>
             </Card>

             {loading ? (
               <div className="flex justify-center p-10"><Loader2 className="h-8 w-8 animate-spin" /></div>
             ) : (
               <Card className="border-none shadow-sm overflow-hidden">
                 <CardContent className="p-0 divide-y">
                   {items.map((item) => (
                     <div key={item.id} className="flex items-center justify-between p-4 hover:bg-muted/5">
                       <div className="flex items-center gap-4">
                         <Checkbox
                           checked={!!item.completed}
                           onCheckedChange={() => handleToggle(item.id, !!item.completed)}
                         />
                         <div>
                           <span className={item.completed ? "line-through text-muted-foreground" : "font-medium"}>
                             {item.name}
                           </span>
                           <p className="text-xs text-muted-foreground">
                             {item.quantity} {item.unit}
                             {item.completed && <span className="ml-2 text-primary">✓ Purchased</span>}
                           </p>
                         </div>
                       </div>
                       <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                         <Trash2 className="h-4 w-4 text-destructive" />
                       </Button>
                     </div>
                   ))}
                   {items.length === 0 && (
                      <div className="p-10 text-center space-y-2">
                         <PackageCheck className="h-10 w-10 mx-auto text-accent" />
                         <p className="text-muted-foreground">Your shopping list is empty.</p>
                         <p className="text-xs text-muted-foreground">Add items above to get started.</p>
                      </div>
                   )}
                 </CardContent>
               </Card>
             )}
          </div>

          {/* Optional tip card (can be removed if not needed) */}
          <div className="hidden lg:block">
            <Card className="border-none shadow-sm bg-accent/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-headline">Smart Tip</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                You can auto‑fill this list from inventory items that are low in stock. That feature is coming soon!
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}