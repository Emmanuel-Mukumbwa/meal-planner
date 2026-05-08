"use client"

import * as React from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2
} from "lucide-react"
import { format, addDays, startOfWeek } from "date-fns"
import { getInventoryItems } from "@/app/actions/inventory-actions"
import { getRecipes } from "@/app/actions/recipe-actions"
import { suggestMealsFromInventory } from "@/app/actions/meal-actions" // ✅ FIXED
import type { SuggestMealsFromInventoryOutput } from "@/app/lib/meal-types" // ✅ FIXED
import { useToast } from "@/hooks/use-toast"

export default function MealPlannerPage() {
  const { toast } = useToast()

  const [selectedWeek, setSelectedWeek] = React.useState(startOfWeek(new Date()))
  const [suggestions, setSuggestions] = React.useState<SuggestMealsFromInventoryOutput | null>(null)
  const [loadingSuggestions, setLoadingSuggestions] = React.useState(false)

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(selectedWeek, i))

  const handleSuggest = async () => {
    setLoadingSuggestions(true)

    try {
      const inventory = await getInventoryItems()
      const recipes = await getRecipes()

      if (!inventory.length || !recipes.length) {
        toast({
          variant: "destructive",
          title: "Missing Data",
          description: "Add inventory items and recipes first."
        })
        return
      }

      const result = await suggestMealsFromInventory({
        inventory: inventory.map(i => ({
          name: i.name,
          quantity: Number(i.quantity),
          unit: i.unit,
          expiryDate: i.expiryDate
            ? new Date(i.expiryDate).toISOString()
            : undefined
        })),
        recipes: recipes.map(r => ({
          name: r.name,
          description: r.description,
          ingredients: r.ingredients.map(ing => ({
            name: ing.name,
            quantity: Number(ing.quantity),
            unit: ing.unit
          }))
        }))
      })

      setSuggestions(result)

      toast({
        title: "Suggestions Ready",
        description: "AI matched your meals successfully."
      })

    } catch (error) {
      console.error("Meal Planner Error:", error)

      toast({
        variant: "destructive",
        title: "AI Error",
        description: "Failed to generate suggestions."
      })
    } finally {
      setLoadingSuggestions(false)
    }
  }

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">

        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold font-headline tracking-tight">Meal Planner</h1>
            <p className="text-muted-foreground">
              Plan your week based on your inventory and recipes.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setSelectedWeek(d => addDays(d, -7))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium">
              <CalendarIcon className="h-4 w-4 text-primary" />
              {format(selectedWeek, "MMM d")} - {format(addDays(selectedWeek, 6), "MMM d, yyyy")}
            </div>

            <Button variant="outline" size="icon" onClick={() => setSelectedWeek(d => addDays(d, 7))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="week" className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
            <TabsTrigger value="week">Weekly Calendar</TabsTrigger>
            <TabsTrigger value="suggestions">AI Suggestions</TabsTrigger>
          </TabsList>

          {/* WEEK VIEW */}
          <TabsContent value="week" className="mt-6">
            <div className="grid gap-4 md:grid-cols-7">
              {weekDays.map((day) => (
                <Card key={day.toISOString()} className="border-none shadow-sm">
                  <CardHeader className="p-4 border-b">
                    <CardTitle className="text-sm font-bold text-center">
                      {format(day, "EEE")}
                      <span className="block text-xl font-headline mt-1">
                        {format(day, "d")}
                      </span>
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="p-3 space-y-4">
                    {["Breakfast", "Lunch", "Dinner"].map((slot) => (
                      <div
                        key={slot}
                        className="rounded-lg border border-dashed p-2 h-16 flex items-center justify-center opacity-40"
                      >
                        <p className="text-[10px] font-bold uppercase">{slot}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* AI SUGGESTIONS */}
          <TabsContent value="suggestions" className="mt-6">
            <div className="space-y-6">

              {/* Trigger */}
              <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-3xl bg-muted/30">
                <Sparkles className="h-10 w-10 text-primary mb-4" />

                <h3 className="text-lg font-bold">Smart Inventory Matching</h3>

                <p className="text-muted-foreground text-center mb-6 max-w-md">
                  We compare your inventory with recipes and suggest meals you can cook now.
                </p>

                <Button
                  onClick={handleSuggest}
                  disabled={loadingSuggestions}
                  size="lg"
                  className="gap-2"
                >
                  {loadingSuggestions ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  Generate Suggestions
                </Button>
              </div>

              {/* Results */}
              {suggestions && (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {suggestions.suggestions.map((suggestion, idx) => (
                    <Card key={idx} className="border-none shadow-md hover:shadow-lg transition-shadow">
                      <CardHeader className="bg-primary/5">
                        <CardTitle className="text-lg font-headline">
                          {suggestion.recipeName}
                        </CardTitle>

                        {suggestion.recipeDescription && (
                          <CardDescription className="line-clamp-2">
                            {suggestion.recipeDescription}
                          </CardDescription>
                        )}
                      </CardHeader>

                      <CardContent className="pt-4 space-y-3">
                        <p className="text-xs font-bold text-muted-foreground uppercase">
                          Ingredient Status
                        </p>

                        {suggestion.ingredientStatus.map((status, sIdx) => (
                          <div key={sIdx} className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-2">
                              {status.status === "enough" ? (
                                <CheckCircle2 className="h-4 w-4 text-primary" />
                              ) : status.status === "low" ? (
                                <AlertCircle className="h-4 w-4 text-orange-500" />
                              ) : (
                                <AlertCircle className="h-4 w-4 text-destructive" />
                              )}
                              {status.name}
                            </span>

                            <Badge
                              variant="outline"
                              className={
                                status.status === "enough"
                                  ? "border-primary text-primary"
                                  : status.status === "low"
                                  ? "border-orange-500 text-orange-500"
                                  : "border-destructive text-destructive"
                              }
                            >
                              {status.status === "enough"
                                ? "Ready"
                                : status.status === "low"
                                ? "Low"
                                : "Buy"}
                            </Badge>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  )
}