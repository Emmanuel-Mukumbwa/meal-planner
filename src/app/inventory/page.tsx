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
  Filter, 
  ArrowUpDown,
  CircleAlert,
  Loader2
} from "lucide-react"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { format, isPast, isWithinInterval, addDays } from "date-fns"
import { getInventoryItems, addInventoryItem, deleteInventoryItem } from "@/app/actions/inventory-actions"
import { InventoryItem } from "@/app/lib/types"

export default function InventoryPage() {
  const [items, setItems] = React.useState<InventoryItem[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")

  React.useEffect(() => {
    loadItems()
  }, [])

  const loadItems = async () => {
    const data = await getInventoryItems()
    setItems(data)
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    await deleteInventoryItem(id)
    setItems(items.filter(i => i.id !== id))
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
            <p className="text-muted-foreground">Manage and track your grocery stock levels in MySQL.</p>
          </div>
          <Button className="w-full md:w-auto bg-primary">
            <Plus className="mr-2 h-4 w-4" /> Add New Item
          </Button>
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Search items by name or category..." 
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" /> Filter
            </Button>
            <Button variant="outline" size="sm">
              <ArrowUpDown className="mr-2 h-4 w-4" /> Sort
            </Button>
          </div>
        </div>

        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="font-semibold">Item Name</TableHead>
                  <TableHead className="font-semibold">Category</TableHead>
                  <TableHead className="font-semibold">Stock Level</TableHead>
                  <TableHead className="font-semibold">Expiry Date</TableHead>
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
                    <TableCell className="text-muted-foreground">
                      {item.expiryDate ? format(new Date(item.expiryDate), 'MMM d, yyyy') : 'N/A'}
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
                          <DropdownMenuItem>Edit Item</DropdownMenuItem>
                          <DropdownMenuItem>Deduct Quantity</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(item.id)}>Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredItems.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                      No items found. Try a different search.
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
