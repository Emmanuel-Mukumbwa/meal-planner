
"use client"

import * as React from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Snowflake, 
  Plus, 
  Clock, 
  Utensils, 
  Trash2, 
  AlertCircle,
  Loader2,
  Timer
} from "lucide-react"
import { format, differenceInDays, addDays, isPast } from "date-fns"
import { getLeftovers, addLeftover, updateLeftoverStatus } from "@/app/actions/leftover-actions"
import { Leftover, LeftoverType } from "@/app/lib/types"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"

const STORAGE_GUIDELINES: Record<LeftoverType, number> = {
  'Meat': 90, // 3 months
  'Vegetables': 180, // 6 months
  'Soup': 60, // 2 months
  'Grain': 30, // 1 month
  'Dairy': 30, // 1 month
  'Other': 60
}

export default function LeftoversPage() {
  const { toast } = useToast()
  const [leftovers, setLeftovers] = React.useState<Leftover[]>([])
  const [loading, setLoading] = React.useState(true)
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  
  // Form State
  const [name, setName] = React.useState("")
  const [type, setType] = React.useState<LeftoverType>("Meat")

  React.useEffect(() => {
    loadLeftovers()
  }, [])

  const loadLeftovers = async () => {
    try {
      const data = await getLeftovers()
      setLeftovers(data)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async () => {
    if (!name) return
    const storedAt = new Date().toISOString()
    const expiresAt = addDays(new Date(), STORAGE_GUIDELINES[type]).toISOString()
    
    const newItem = await addLeftover({ name, type, storedAt, expiresAt })
    setLeftovers([newItem as Leftover, ...leftovers])
    setName("")
    setIsDialogOpen(false)
    toast({ title: "Leftover Recorded", description: `${name} is now safely in the freezer.` })
  }

  const handleStatusUpdate = async (id: string, status: 'consumed' | 'discarded') => {
    await updateLeftoverStatus(id, status)
    setLeftovers(leftovers.filter(l => l.id !== id))
    toast({ title: `Marked as ${status}` })
  }

  const getUrgency = (expiresAt: string) => {
    const daysLeft = differenceInDays(new Date(expiresAt), new Date())
    if (isPast(new Date(expiresAt))) return { color: "bg-destructive text-destructive-foreground", label: "OVERDUE" }
    if (daysLeft < 7) return { color: "bg-orange-500 text-white", label: "REHEAT SOON" }
    return { color: "bg-accent/20 text-primary", label: "SAFE" }
  }

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold font-headline tracking-tight">Freezer Leftovers</h1>
            <p className="text-muted-foreground">Track stored meals and get reheat reminders.</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary">
                <Plus className="mr-2 h-4 w-4" /> Record Leftover
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Freeze Leftover</DialogTitle>
                <DialogDescription>
                  Choose the food type to set a safe storage timer.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Food Name</label>
                  <Input 
                    placeholder="e.g., Sunday Roast Chicken" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <Select value={type} onValueChange={(v) => setType(v as LeftoverType)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(STORAGE_GUIDELINES).map(t => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg flex items-center gap-3">
                  <Clock className="h-5 w-5 text-primary" />
                  <p className="text-xs">Reheat within <strong>{STORAGE_GUIDELINES[type]} days</strong> (Safety guideline for {type})</p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleAdd} disabled={!name}>Save to Freezer</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {leftovers.map((item) => {
              const urgency = getUrgency(item.expiresAt);
              const daysIn = differenceInDays(new Date(), new Date(item.storedAt));
              
              return (
                <Card key={item.id} className="overflow-hidden border-none shadow-sm bg-white hover:shadow-md transition-shadow">
                  <div className={`h-2 ${isPast(new Date(item.expiresAt)) ? 'bg-destructive' : 'bg-primary'}`} />
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/20 text-primary">
                        <Snowflake className="h-5 w-5" />
                      </div>
                      <Badge className={urgency.color}>{urgency.label}</Badge>
                    </div>
                    <CardTitle className="text-xl font-headline mt-4">{item.name}</CardTitle>
                    <CardDescription>{item.type} • Stored {daysIn} days ago</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between text-sm py-2 border-y border-muted">
                      <div className="flex items-center gap-2">
                        <Timer className="h-4 w-4 text-muted-foreground" />
                        <span>Reheat before:</span>
                      </div>
                      <span className="font-bold">{format(new Date(item.expiresAt), 'MMM d, yyyy')}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        className="gap-2" 
                        onClick={() => handleStatusUpdate(item.id, 'consumed')}
                      >
                        <Utensils className="h-4 w-4" /> Reheated
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-destructive gap-2" 
                        onClick={() => handleStatusUpdate(item.id, 'discarded')}
                      >
                        <Trash2 className="h-4 w-4" /> Discard
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
            
            {leftovers.length === 0 && (
              <div className="col-span-full py-20 text-center border-2 border-dashed rounded-3xl bg-muted/5">
                <Utensils className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-medium">No leftovers in the freezer</h3>
                <p className="text-muted-foreground">Save your extra meals to reduce waste!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
