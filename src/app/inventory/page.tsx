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
  Banknote,
  Edit
} from "lucide-react"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
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
import { getInventoryItems, addInventoryItem, updateInventoryItem, deleteInventoryItem } from "@/app/actions/inventory-actions"
import { InventoryItem } from "@/app/lib/types"
import { useToast } from "@/hooks/use-toast"

// Common units for dropdown
const commonUnits = [
  { value: "litres", label: "Litres (L)" },
  { value: "millilitres", label: "Millilitres (ml)" },
  { value: "kg", label: "Kilograms (kg)" },
  { value: "g", label: "Grams (g)" },
  { value: "packets", label: "Packets" },
  { value: "pieces", label: "Pieces" },
  { value: "cartons", label: "Cartons" },
  { value: "bottles", label: "Bottles" },
  { value: "cans", label: "Cans" },
  { value: "other", label: "Other (custom)" },
]

export default function InventoryPage() {
  const { toast } = useToast()
  const [items, setItems] = React.useState<InventoryItem[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false)
  const [editingItem, setEditingItem] = React.useState<InventoryItem | null>(null)

  // New Item State
  const [newItem, setNewItem] = React.useState({
    name: "",
    quantity: 1,
    unit: "litres",
    category: "Pantry",
    expiryDate: "",
    lowStockThreshold: 1,
    unitPrice: 0,
    totalPrice: 0,        // added for user convenience
    customUnit: "",
  })

  // Edit Item State
  const [editItem, setEditItem] = React.useState({
    name: "",
    quantity: 1,
    unit: "",
    category: "",
    expiryDate: "",
    lowStockThreshold: 1,
    unitPrice: 0,
    totalPrice: 0,
    customUnit: "",
  })

  const displayUnit = newItem.unit === "other" ? newItem.customUnit : newItem.unit
  const editDisplayUnit = editItem.unit === "other" ? editItem.customUnit : editItem.unit

  // Synchronize unitPrice <-> totalPrice based on quantity
  const updateUnitPriceFromTotal = (total: number, quantity: number, setter: (value: number) => void) => {
    if (quantity > 0) {
      setter(total / quantity)
    } else {
      setter(0)
    }
  }

  const updateTotalFromUnitPrice = (unit: number, quantity: number, setter: (value: number) => void) => {
    setter(unit * quantity)
  }

  // Handlers for new item fields
  const handleNewUnitPriceChange = (value: number) => {
    setNewItem(prev => {
      const unitPrice = value
      const totalPrice = unitPrice * prev.quantity
      return { ...prev, unitPrice, totalPrice }
    })
  }

  const handleNewTotalPriceChange = (value: number) => {
    setNewItem(prev => {
      const totalPrice = value
      const unitPrice = prev.quantity > 0 ? totalPrice / prev.quantity : 0
      return { ...prev, unitPrice, totalPrice }
    })
  }

  const handleNewQuantityChange = (quantity: number) => {
    setNewItem(prev => {
      const newUnitPrice = prev.unitPrice
      const newTotalPrice = newUnitPrice * quantity
      return { ...prev, quantity, totalPrice: newTotalPrice }
    })
  }

  // Handlers for edit item fields
  const handleEditUnitPriceChange = (value: number) => {
    setEditItem(prev => {
      const unitPrice = value
      const totalPrice = unitPrice * prev.quantity
      return { ...prev, unitPrice, totalPrice }
    })
  }

  const handleEditTotalPriceChange = (value: number) => {
    setEditItem(prev => {
      const totalPrice = value
      const unitPrice = prev.quantity > 0 ? totalPrice / prev.quantity : 0
      return { ...prev, unitPrice, totalPrice }
    })
  }

  const handleEditQuantityChange = (quantity: number) => {
    setEditItem(prev => {
      const newUnitPrice = prev.unitPrice
      const newTotalPrice = newUnitPrice * quantity
      return { ...prev, quantity, totalPrice: newTotalPrice }
    })
  }

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
      toast({ variant: "destructive", title: "Connection Error", description: "Could not fetch inventory." })
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async () => {
    if (!newItem.name) return
    if (newItem.unit === "other" && !newItem.customUnit.trim()) {
      toast({ title: "Unit required", description: "Please enter a custom unit.", variant: "destructive" })
      return
    }
    const finalUnit = newItem.unit === "other" ? newItem.customUnit.trim() : newItem.unit
    try {
      const added = await addInventoryItem({
        name: newItem.name,
        quantity: newItem.quantity,
        unit: finalUnit,
        category: newItem.category,
        expiryDate: newItem.expiryDate || undefined,
        lowStockThreshold: newItem.lowStockThreshold,
        price: newItem.totalPrice,  // use total price from state
      })
      setItems([added as InventoryItem, ...items])
      setIsAddDialogOpen(false)
      setNewItem({ 
        name: "", 
        quantity: 1, 
        unit: "litres", 
        category: "Pantry", 
        expiryDate: "", 
        lowStockThreshold: 1, 
        unitPrice: 0,
        totalPrice: 0,
        customUnit: ""
      })
      toast({ title: "Item Added", description: `${newItem.name} (${newItem.quantity} × MK${newItem.unitPrice.toFixed(2)} per ${finalUnit}) saved.` })
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to add item." })
    }
  }

  const handleEdit = async () => {
    if (!editingItem) return
    if (editItem.unit === "other" && !editItem.customUnit.trim()) {
      toast({ title: "Unit required", description: "Please enter a custom unit.", variant: "destructive" })
      return
    }
    const finalUnit = editItem.unit === "other" ? editItem.customUnit.trim() : editItem.unit
    try {
      await updateInventoryItem(editingItem.id, {
        name: editItem.name,
        quantity: editItem.quantity,
        unit: finalUnit,
        category: editItem.category,
        expiryDate: editItem.expiryDate || null,
        lowStockThreshold: editItem.lowStockThreshold,
        price: editItem.totalPrice,
      })
      await loadItems()
      setIsEditDialogOpen(false)
      setEditingItem(null)
      toast({ title: "Item Updated", description: `${editItem.name} has been updated.` })
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to update item." })
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

  const openEditDialog = (item: InventoryItem) => {
    const unitPrice = item.quantity > 0 ? item.price / item.quantity : 0
    const isKnownUnit = commonUnits.some(u => u.value === item.unit)
    setEditingItem(item)
    setEditItem({
      name: item.name,
      quantity: item.quantity,
      unit: isKnownUnit ? item.unit : "other",
      category: item.category,
      expiryDate: item.expiryDate || "",
      lowStockThreshold: item.lowStockThreshold,
      unitPrice: unitPrice,
      totalPrice: item.price,
      customUnit: isKnownUnit ? "" : item.unit,
    })
    setIsEditDialogOpen(true)
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
      <div className="flex flex-col gap-4 md:gap-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold font-headline tracking-tight">Inventory</h1>
            <p className="text-sm text-muted-foreground">Track your pantry stock and values in Malawi Kwacha.</p>
          </div>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full md:w-auto bg-primary">
                <Plus className="mr-2 h-4 w-4" /> Add New Item
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-[425px] rounded-lg p-4">
              <DialogHeader>
                <DialogTitle>Add Inventory Item</DialogTitle>
                <DialogDescription>Enter the item details. Use decimal quantities for partial units (e.g., 0.5 litres).</DialogDescription>
              </DialogHeader>
              <div className="grid gap-3 py-3">
                <div className="grid gap-1.5">
                  <label className="text-sm font-medium">Name</label>
                  <Input placeholder="e.g., Cooking Oil, Milk, Potatoes" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5">
                    <label className="text-sm font-medium">Quantity</label>
                    <Input type="number" min="0" step="0.01" value={newItem.quantity} onChange={e => handleNewQuantityChange(parseFloat(e.target.value) || 0)} />
                  </div>
                  <div className="grid gap-1.5">
                    <label className="text-sm font-medium">Unit</label>
                    <Select value={newItem.unit} onValueChange={v => setNewItem({...newItem, unit: v, customUnit: v === "other" ? newItem.customUnit : ""})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {commonUnits.map(unit => (
                          <SelectItem key={unit.value} value={unit.value}>{unit.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {newItem.unit === "other" && (
                      <Input 
                        placeholder="e.g., bucket, tray, plate" 
                        value={newItem.customUnit}
                        onChange={e => setNewItem({...newItem, customUnit: e.target.value})}
                        className="mt-1"
                      />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5">
                    <label className="text-sm font-medium">Unit Price (MK)</label>
                    <Input type="number" min="0" step="0.01" placeholder="per unit" value={newItem.unitPrice} onChange={e => handleNewUnitPriceChange(parseFloat(e.target.value) || 0)} />
                    <p className="text-[10px] text-muted-foreground">Price per {displayUnit || "unit"}</p>
                  </div>
                  <div className="grid gap-1.5">
                    <label className="text-sm font-medium">Total Price (MK)</label>
                    <Input type="number" min="0" step="0.01" placeholder="e.g., 13000" value={newItem.totalPrice} onChange={e => handleNewTotalPriceChange(parseFloat(e.target.value) || 0)} />
                    <p className="text-[10px] text-muted-foreground">Total value for {newItem.quantity} {displayUnit}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5">
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
                  <div className="grid gap-1.5">
                    <label className="text-sm font-medium">Low Stock Threshold</label>
                    <Input type="number" min="0" step="0.01" value={newItem.lowStockThreshold} onChange={e => setNewItem({...newItem, lowStockThreshold: parseFloat(e.target.value) || 0})} />
                    <p className="text-[10px] text-muted-foreground">Alert when quantity ≤ this value (in {displayUnit})</p>
                  </div>
                </div>

                <div className="grid gap-1.5">
                  <label className="text-sm font-medium">Expiry Date (Optional)</label>
                  <Input type="date" value={newItem.expiryDate} onChange={e => setNewItem({...newItem, expiryDate: e.target.value})} />
                </div>

                <div className="rounded-lg bg-muted/30 p-2 text-center">
                  <span className="text-xs font-medium text-muted-foreground">Total Value: </span>
                  <span className="text-sm font-bold text-primary">
                    {new Intl.NumberFormat('en-MW', { style: 'currency', currency: 'MWK' }).format(newItem.totalPrice)}
                  </span>
                </div>
              </div>
              <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
                <Button variant="ghost" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleAdd} disabled={!newItem.name || newItem.totalPrice <= 0}>Add to Pantry</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center">
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

        {/* Mobile-friendly table container with horizontal scroll */}
        <div className="rounded-xl border bg-card shadow-sm overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading inventory...</p>
            </div>
          ) : (
            <Table className="min-w-[640px] md:min-w-full">
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="font-semibold">Item Name</TableHead>
                  <TableHead className="font-semibold">Category</TableHead>
                  <TableHead className="font-semibold">Stock Level</TableHead>
                  <TableHead className="font-semibold">Total Value (MK)</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="text-right w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => {
                  const unitPrice = item.quantity > 0 ? (item.price / item.quantity) : 0
                  return (
                    <TableRow key={item.id} className="transition-colors hover:bg-muted/20">
                      <TableCell className="font-medium whitespace-nowrap">
                        {item.name}
                        {unitPrice > 0 && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            (MK{unitPrice.toFixed(2)}/{item.unit})
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-normal text-xs">
                          {item.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className={item.quantity <= item.lowStockThreshold ? "text-destructive font-bold" : ""}>
                            {item.quantity} {item.unit}
                          </span>
                          {item.quantity <= item.lowStockThreshold && (
                            <CircleAlert className="h-4 w-4 text-destructive shrink-0" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-1 text-sm font-medium">
                          <Banknote className="h-3 w-3 text-primary shrink-0" />
                          {new Intl.NumberFormat('en-MW', { style: 'currency', currency: 'MWK' }).format(item.price || 0)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(item.expiryDate, item.quantity, item.lowStockThreshold) + " text-xs"}>
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
                            <DropdownMenuItem onClick={() => openEditDialog(item)}>
                              <Edit className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(item.id)}>
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
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

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-[425px] rounded-lg p-4">
          <DialogHeader>
            <DialogTitle>Edit Inventory Item</DialogTitle>
            <DialogDescription>Update the item details. Adjust low stock threshold to avoid unwanted alerts.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-3">
            <div className="grid gap-1.5">
              <label className="text-sm font-medium">Name</label>
              <Input value={editItem.name} onChange={e => setEditItem({...editItem, name: e.target.value})} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <label className="text-sm font-medium">Quantity</label>
                <Input type="number" min="0" step="0.01" value={editItem.quantity} onChange={e => handleEditQuantityChange(parseFloat(e.target.value) || 0)} />
              </div>
              <div className="grid gap-1.5">
                <label className="text-sm font-medium">Unit</label>
                <Select value={editItem.unit} onValueChange={v => setEditItem({...editItem, unit: v, customUnit: v === "other" ? editItem.customUnit : ""})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {commonUnits.map(unit => (
                      <SelectItem key={unit.value} value={unit.value}>{unit.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {editItem.unit === "other" && (
                  <Input 
                    placeholder="e.g., bucket, tray, plate" 
                    value={editItem.customUnit}
                    onChange={e => setEditItem({...editItem, customUnit: e.target.value})}
                    className="mt-1"
                  />
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <label className="text-sm font-medium">Unit Price (MK)</label>
                <Input type="number" min="0" step="0.01" value={editItem.unitPrice} onChange={e => handleEditUnitPriceChange(parseFloat(e.target.value) || 0)} />
                <p className="text-[10px] text-muted-foreground">Price per {editDisplayUnit || "unit"}</p>
              </div>
              <div className="grid gap-1.5">
                <label className="text-sm font-medium">Total Price (MK)</label>
                <Input type="number" min="0" step="0.01" value={editItem.totalPrice} onChange={e => handleEditTotalPriceChange(parseFloat(e.target.value) || 0)} />
                <p className="text-[10px] text-muted-foreground">Total value for {editItem.quantity} {editDisplayUnit}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <label className="text-sm font-medium">Category</label>
                <Select value={editItem.category} onValueChange={v => setEditItem({...editItem, category: v})}>
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
              <div className="grid gap-1.5">
                <label className="text-sm font-medium">Low Stock Threshold</label>
                <Input type="number" min="0" step="0.01" value={editItem.lowStockThreshold} onChange={e => setEditItem({...editItem, lowStockThreshold: parseFloat(e.target.value) || 0})} />
                <p className="text-[10px] text-muted-foreground">Alert when quantity ≤ this value (in {editDisplayUnit})</p>
              </div>
            </div>

            <div className="grid gap-1.5">
              <label className="text-sm font-medium">Expiry Date (Optional)</label>
              <Input type="date" value={editItem.expiryDate} onChange={e => setEditItem({...editItem, expiryDate: e.target.value})} />
            </div>

            <div className="rounded-lg bg-muted/30 p-2 text-center">
              <span className="text-xs font-medium text-muted-foreground">Total Value: </span>
              <span className="text-sm font-bold text-primary">
                {new Intl.NumberFormat('en-MW', { style: 'currency', currency: 'MWK' }).format(editItem.totalPrice)}
              </span>
            </div>
          </div>
          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
            <Button variant="ghost" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleEdit} disabled={editItem.totalPrice <= 0}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  )
}