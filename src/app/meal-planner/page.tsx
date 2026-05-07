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
  AlertCircle
} from "lucide-react"
import { format, addDays, startOfWeek } from "date-fns"
import { MOCK_INVENTORY, MOCK_RECIPES } from "@/app/lib/mock-data"
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
      // Mapping mock data to input schema format
      const result = await suggestMealsFromInventory({
        inventory: MOCK_INVENTORY.map(i => ({
          name: i.name,
          quantity: i.quantity,
          unit: i.unit,
          expiryDate: i.expiryDate
        })),
        recipes: MOCK_RECIPES.map(r => ({
          name: r.name,
          ingredients: r.ingredients
        }))
      })
      setSuggestions(result)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to get meal suggestions."
      })
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
            <p className="text-muted-foreground">Plan your week and reduce grocery waste.</p>
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
            <TabsTrigger value="suggestions" onClick={handleSuggest}>AI Suggestions</TabsTrigger>
          </TabsList>
          
          <TabsContent value="week" className="mt-6">
            <div className="grid gap-4 md:grid-cols-7">
              {weekDays.map((day) => (
                <Card key={day.toISOString()} className={`border-none shadow-sm ${format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') ? 'ring-2 ring-primary ring-offset-2' : ''}`}>
                  <CardHeader className="p-4 border-b">
                    <CardTitle className="text-sm font-bold text-center">
                      {format(day, 'EEE')}
                      <span className="block text-xl font-headline mt-1">{format(day, 'd')}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 space-y-4">
                    {['Breakfast', 'Lunch', 'Dinner'].map((slot) => (
                      <div key={slot} className="group relative rounded-lg border border-dashed border-muted-foreground/20 p-2 transition-colors hover:border-primary/40 hover:bg-primary/5">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">{slot}</p>
                        <div className="h-10 flex items-center justify-center">
                          <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="suggestions" className="mt-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold font-headline flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-accent" />
                    AI Chef Recommendations
                  </h2>
                  <p className="text-sm text-muted-foreground">Based on your current pantry contents</p>
                </div>
                <Button onClick={handleSuggest} disabled={loadingSuggestions} variant="outline" className="gap-2">
                  <Utensils className="h-4 w-4" /> Refresh Suggestions
                </Button>
              </div>

              {loadingSuggestions ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3].map(i => (
                    <Card key={i} className="animate-pulse h-64 bg-muted/20" />
                  ))}
                </div>
              ) : suggestions ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {suggestions.suggestions.map((suggestion, idx) => (
                    <Card key={idx} className="overflow-hidden border-none shadow-md transition-all hover:shadow-lg">
                      <div className="h-32 bg-accent/20 relative flex items-center justify-center">
                         <Utensils className="h-12 w-12 text-primary/30" />
                         <Badge className="absolute top-2 right-2 bg-primary">95% Match</Badge>
                      </div>
                      <CardHeader>
                        <CardTitle className="text-lg font-headline">{suggestion.recipeName}</CardTitle>
                        <CardDescription className="line-clamp-2">{suggestion.recipeDescription || 'A delicious meal idea based on your available ingredients.'}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <p className="text-xs font-bold uppercase text-muted-foreground">Ingredient Status</p>
                          {suggestion.ingredientStatus.map((status, sIdx) => (
                            <div key={sIdx} className="flex items-center justify-between text-sm">
                              <span className="flex items-center gap-2">
                                {status.status === 'enough' ? (
                                  <CheckCircle2 className="h-3 w-3 text-accent" />
                                ) : (
                                  <AlertCircle className="h-3 w-3 text-destructive" />
                                )}
                                {status.name}
                              </span>
                              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                                status.status === 'enough' ? 'bg-accent/10 text-primary' : 'bg-destructive/10 text-destructive'
                              }`}>
                                {status.status === 'enough' ? 'In Stock' : 'Needed'}
                              </span>
                            </div>
                          ))}
                        </div>
                        <Button className="w-full mt-6 bg-primary">Add to Plan</Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 border-2 border-dashed rounded-3xl">
                  <Utensils className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">Click "Refresh Suggestions" to see what you can cook today!</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  )
}