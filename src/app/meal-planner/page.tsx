
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
  Plus, 
  Sparkles,
  Utensils,
  CheckCircle2,
  AlertCircle,
  Loader2
} from "lucide-react"
import { format, addDays, startOfWeek } from "date-fns"
import { getInventoryItems } from "@/app/actions/inventory-actions"
import { getRecipes } from "@/app/actions/recipe-actions"
import { suggestMealsFromInventory, SuggestMealsFromInventoryOutput } from "@/ai/flows/suggest-meals-from-inventory"
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

      const result = await suggestMealsFromInventory({
        inventory: inventory.map(i => ({
          name: i.name,
          quantity: Number(i.quantity),
          unit: i.unit,
          expiryDate: i.expiryDate
        })),
        recipes: recipes.map(r => ({
          name: r.name,
          ingredients: r.ingredients.map(ing => ({
            name: ing.name,
            quantity: Number(ing.quantity),
            unit: ing.unit
          }))
        }))
      })
      setSuggestions(result)
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Check your Aiven MySQL connection." })
    } finally {
      setLoadingSuggestions(false)
    }
  }

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold font-headline tracking-tight">Meal Planner</h1>
            <p className="text-muted-foreground">Real-time planning with AI & Aiven MySQL.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setSelectedWeek(d => addDays(d, -7))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium">
              <CalendarIcon className="h-4 w-4 text-primary" />
              {format(selectedWeek, 'MMM d')} - {format(addDays(selectedWeek, 6), 'MMM d, yyyy')}
            </div>
            <Button variant="outline" size="icon" onClick={() => setSelectedWeek(d => addDays(d, 7))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Tabs defaultValue="week" className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
            <TabsTrigger value="week">Weekly Calendar</TabsTrigger>
            <TabsTrigger value="suggestions">AI Suggestions</TabsTrigger>
          </TabsList>
          
          <TabsContent value="week" className="mt-6">
            <div className="grid gap-4 md:grid-cols-7">
              {weekDays.map((day) => (
                <Card key={day.toISOString()} className="border-none shadow-sm">
                  <CardHeader className="p-4 border-b">
                    <CardTitle className="text-sm font-bold text-center">
                      {format(day, 'EEE')}
                      <span className="block text-xl font-headline mt-1">{format(day, 'd')}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 space-y-4">
                    {['Breakfast', 'Lunch', 'Dinner'].map((slot) => (
                      <div key={slot} className="rounded-lg border border-dashed p-2 h-16 flex items-center justify-center opacity-40">
                        <p className="text-[10px] font-bold uppercase">{slot}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="suggestions" className="mt-6">
            <div className="space-y-6">
              <Button onClick={handleSuggest} disabled={loadingSuggestions} className="gap-2">
                {loadingSuggestions ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Generate Smart Suggestions
              </Button>

              {suggestions ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {suggestions.suggestions.map((suggestion, idx) => (
                    <Card key={idx} className="overflow-hidden border-none shadow-md">
                      <CardHeader>
                        <CardTitle className="text-lg font-headline">{suggestion.recipeName}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {suggestion.ingredientStatus.map((status, sIdx) => (
                            <div key={sIdx} className="flex items-center justify-between text-sm">
                              <span className="flex items-center gap-2">
                                {status.status === 'enough' ? <CheckCircle2 className="h-3 w-3 text-accent" /> : <AlertCircle className="h-3 w-3 text-destructive" />}
                                {status.name}
                              </span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : !loadingSuggestions && (
                <div className="text-center py-20 border-2 border-dashed rounded-3xl">
                  <p>Click the button above to analyze your database and get suggestions.</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  )
}
