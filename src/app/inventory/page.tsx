
"use client"

import * as React from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Plus, 
  Search, 
  MoreVertical, 
  CircleAlert,
  Loader2,
  Banknote
} from "lucide-react"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format, isPast, isWithinInterval, addDays } from "date-fns"
import { getInventoryItems, addInventoryItem, deleteInventoryItem } from "@/app/actions/inventory-actions"
import { InventoryItem } from "@/app/lib/types"
import { useToast } from "@/hooks/use-toast"

export default function InventoryPage() {
  const { toast } = useToast()
  const [items, setItems] = React.useState<InventoryItem[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)

  // New Item State
  const [newItem, setNewItem] = React.useState({
    name: "",
    quantity: 1,
    unit: "pcs",
    category: "Pantry",
    expiryDate: "",
    lowStockThreshold: 1,
    price: 0
  })

  React.useEffect(() => {
    loadItems()
  }, [])

  const loadItems = async () => {
    try {
      setLoading(true)
      const data = await getInventoryItems()
      setItems(data)
    } catch (error) {
      console.error("Failed to load items:", error)
      toast({ variant: "destructive", title: "Connection Error", description: "Could not fetch inventory from database." })
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async () => {
    if (!newItem.name) return
    try {
      const added = await addInventoryItem({
        ...newItem,
        quantity: Number(newItem.quantity),
        lowStockThreshold: Number(newItem.lowStockThreshold),
        price: Number(newItem.price),
        expiryDate: newItem.expiryDate || undefined
      })
      setItems([added as InventoryItem, ...items])
      setIsDialogOpen(false)
      setNewItem({ name: "", quantity: 1, unit: "pcs", category: "Pantry", expiryDate: "", lowStockThreshold: 1, price: 0 })
      toast({ title: "Item Added", description: `${newItem.name} saved successfully.` })
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to add item. Check your database settings." })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteInventoryItem(id)
      setItems(items.filter(i => i.id !== id))
      toast({ title: "Item Deleted" })
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete item." })
    }
  }

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.category.toLowerCase().includes(search.toLowerCase())
  )

  const getStatusColor = (expiryDate?: string, quantity: number, threshold: number) => {
    if (!expiryDate) {
       if (quantity <= threshold) return 'bg-destructive/10 text-destructive border-destructive'
       return 'bg-secondary text-secondary-foreground border-border'
    }

    const date = new Date(expiryDate)
    if (isPast(date)) return 'bg-destructive text-destructive-foreground border-none'
    if (isWithinInterval(date, { start: new Date(), end: addDays(new Date(), 3) })) return 'bg-orange-500 text-white border-none'
    if (quantity <= threshold) return 'bg-destructive/10 text-destructive border-destructive'
    
    return 'bg-accent/20 text-primary border-accent'
  }

  const getStatusLabel = (expiryDate?: string, quantity: number, threshold: number) => {
    if (!expiryDate) {
      return quantity <= threshold ? 'Low Stock' : 'Good'
    }
    const date = new Date(expiryDate)
    if (isPast(date)) return 'Expired'
    if (isWithinInterval(date, { start: new Date(), end: addDays(new Date(), 3) })) return 'Expiring Soon'
    if (quantity <= threshold) return 'Low Stock'
    return 'Fresh'
  }

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold font-headline tracking-tight">Inventory</h1>
            <p className="text-muted-foreground">Manage your pantry stock and values in Malawi Kwacha.</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full md:w-auto bg-primary">
                <Plus className="mr-2 h-4 w-4" /> Add New Item
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add Inventory Item</DialogTitle>
                <DialogDescription>Store a new item in your Aiven MySQL database.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Name</label>
                  <Input placeholder="e.g., Rice, Milk, Chicken" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Quantity</label>
                    <Input type="number" value={newItem.quantity} onChange={e => setNewItem({...newItem, quantity: Number(e.target.value)})} />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Unit</label>
                    <Input placeholder="kg, liters, pcs" value={newItem.unit} onChange={e => setNewItem({...newItem, unit: e.target.value})} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Price (MK)</label>
                    <Input type="number" placeholder="0.00" value={newItem.price} onChange={e => setNewItem({...newItem, price: Number(e.target.value)})} />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Category</label>
                    <Select value={newItem.category} onValueChange={v => setNewItem({...newItem, category: v})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Dairy">Dairy</SelectItem>
                        <SelectItem value="Vegetables">Vegetables</SelectItem>
                        <SelectItem value="Meat">Meat</SelectItem>
                        <SelectItem value="Pantry">Pantry</SelectItem>
                        <SelectItem value="Fruits">Fruits</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Expiry Date (Optional)</label>
                  <Input type="date" value={newItem.expiryDate} onChange={e => setNewItem({...newItem, expiryDate: e.target.value})} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleAdd} disabled={!newItem.name}>Save to Database</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Search inventory..." 
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Connecting to database...</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="font-semibold">Item Name</TableHead>
                  <TableHead className="font-semibold">Category</TableHead>
                  <TableHead className="font-semibold">Stock Level</TableHead>
                  <TableHead className="font-semibold">Price (MK)</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow key={item.id} className="transition-colors hover:bg-muted/20">
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-normal">
                        {item.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className={item.quantity <= item.lowStockThreshold ? "text-destructive font-bold" : ""}>
                          {item.quantity} {item.unit}
                        </span>
                        {item.quantity <= item.lowStockThreshold && (
                          <CircleAlert className="h-4 w-4 text-destructive" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm font-medium">
                        <Banknote className="h-3 w-3 text-primary" />
                        {new Intl.NumberFormat('en-MW', { style: 'currency', currency: 'MWK' }).format(item.price || 0)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(item.expiryDate, item.quantity, item.lowStockThreshold)}>
                        {getStatusLabel(item.expiryDate, item.quantity, item.lowStockThreshold)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(item.id)}>Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredItems.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                      No items found. Click "Add New Item" to begin.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
