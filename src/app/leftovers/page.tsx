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
  Loader2,
  Timer,
} from "lucide-react"
import { format, differenceInDays, addDays, isPast } from "date-fns"
import {
  getLeftovers,
  addLeftover,
  updateLeftoverStatus,
  estimateLeftoverStorage,
} from "@/app/actions/leftover-actions"
import { Leftover, LeftoverType } from "@/app/lib/types"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"

const STORAGE_GUIDELINES: Record<LeftoverType, number> = {
  Meat: 90,
  Vegetables: 180,
  Soup: 60,
  Grain: 30,
  Dairy: 30,
  Other: 60,
}

type EstimateState = {
  days: number
  reason: string
  source: "ai" | "rule"
} | null

export default function LeftoversPage() {
  const { toast } = useToast()
  const [leftovers, setLeftovers] = React.useState<Leftover[]>([])
  const [loading, setLoading] = React.useState(true)
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)
  const [name, setName] = React.useState("")
  const [type, setType] = React.useState<LeftoverType>("Meat")
  const [estimate, setEstimate] = React.useState<EstimateState>(null)

  React.useEffect(() => {
    loadLeftovers()
  }, [])

  const loadLeftovers = async () => {
    try {
      const data = await getLeftovers()
      setLeftovers(data)
    } catch {
      toast({
        title: "Failed to load leftovers",
        description: "Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async () => {
    const trimmedName = name.trim()
    if (!trimmedName) {
      toast({
        title: "Food name required",
        description: "Add a leftover name first.",
        variant: "destructive",
      })
      return
    }

    try {
      setSubmitting(true)

      const savedEstimate =
        estimate ??
        (await estimateLeftoverStorage(trimmedName, type))

      const storedAt = new Date().toISOString()
      const expiresAt = addDays(new Date(), savedEstimate.days).toISOString()

      const newItem = await addLeftover({
        name: trimmedName,
        type,
        storedAt,
        expiresAt,
      })

      setLeftovers((current) => [newItem as Leftover, ...current])
      setName("")
      setType("Meat")
      setEstimate(null)
      setIsDialogOpen(false)

      toast({
        title: "Leftover recorded",
        description: `${trimmedName} is set for about ${savedEstimate.days} days (${savedEstimate.source === "ai" ? "AI estimate" : "category rule"}).`,
      })
    } catch (error) {
      console.error(error)
      toast({
        title: "Could not save leftover",
        description: "Please check the server logs and database schema.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleStatusUpdate = async (id: string, status: "consumed" | "discarded") => {
    try {
      await updateLeftoverStatus(id, status)
      setLeftovers((current) => current.filter((l) => l.id !== id))
      toast({ title: `Marked as ${status}` })
    } catch (error) {
      console.error(error)
      toast({
        title: "Update failed",
        description: "Could not update leftover status.",
        variant: "destructive",
      })
    }
  }

  const getUrgency = (expiresAt: string) => {
    const daysLeft = differenceInDays(new Date(expiresAt), new Date())
    if (isPast(new Date(expiresAt))) {
      return { color: "bg-destructive text-destructive-foreground", label: "OVERDUE" }
    }
    if (daysLeft < 7) {
      return { color: "bg-orange-500 text-white", label: "REHEAT SOON" }
    }
    return { color: "bg-accent/20 text-primary", label: "SAFE" }
  }

  const guidelineDays = STORAGE_GUIDELINES[type]

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
                  Save the food and the app will estimate a conservative storage window.
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
                      {Object.keys(STORAGE_GUIDELINES).map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="rounded-lg bg-muted/50 p-3 space-y-2">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-primary" />
                    <p className="text-xs">
                      Base guideline: <strong>{guidelineDays} days</strong> for {type}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    The server will refine this using the food name, then clamp it to a safe range.
                  </p>
                </div>

                {estimate && (
                  <div className="rounded-lg border bg-background p-3">
                    <p className="text-xs font-medium">Preview</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {estimate.source === "ai" ? "AI estimate" : "Fallback rule"}: {estimate.days} days
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{estimate.reason}</p>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="ghost" onClick={() => setIsDialogOpen(false)} disabled={submitting}>
                  Cancel
                </Button>
                <Button onClick={handleAdd} disabled={!name.trim() || submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save to Freezer"
                  )}
                </Button>
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
              const urgency = getUrgency(item.expiresAt)
              const daysIn = differenceInDays(new Date(), new Date(item.storedAt))

              return (
                <Card key={item.id} className="overflow-hidden border-none shadow-sm bg-white hover:shadow-md transition-shadow">
                  <div className={`h-2 ${isPast(new Date(item.expiresAt)) ? "bg-destructive" : "bg-primary"}`} />
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/20 text-primary">
                        <Snowflake className="h-5 w-5" />
                      </div>
                      <Badge className={urgency.color}>{urgency.label}</Badge>
                    </div>
                    <CardTitle className="text-xl font-headline mt-4">{item.name}</CardTitle>
                    <CardDescription>
                      {item.type} • Stored {daysIn} days ago
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between text-sm py-2 border-y border-muted">
                      <div className="flex items-center gap-2">
                        <Timer className="h-4 w-4 text-muted-foreground" />
                        <span>Reheat before:</span>
                      </div>
                      <span className="font-bold">{format(new Date(item.expiresAt), "MMM d, yyyy")}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="gap-2"
                        onClick={() => handleStatusUpdate(item.id, "consumed")}
                      >
                        <Utensils className="h-4 w-4" /> Reheated
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive gap-2"
                        onClick={() => handleStatusUpdate(item.id, "discarded")}
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