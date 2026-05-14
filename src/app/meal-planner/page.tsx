"use client";

import * as React from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Plus,
  X,
  Lock,
} from "lucide-react";
import { format, addDays, startOfWeek, isAfter, isToday, isBefore } from "date-fns";
import { getInventoryItems } from "@/app/actions/inventory-actions";
import { getRecipes } from "@/app/actions/recipe-actions";
import { suggestMealsFromInventory } from "@/app/actions/meal-actions";
import { getMealPlanForWeek, saveMealPlan, type MealSlot } from "@/app/actions/meal-plan-actions";
import type { SuggestMealsFromInventoryOutput } from "@/app/lib/meal-types";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Define end times for each meal slot (24-hour format)
const SLOT_END_TIMES: Record<MealSlot, number> = {
  breakfast: 9.75, // 9:45 AM = 9.75 hours
  lunch: 13.5,     // 1:30 PM = 13.5 hours
  dinner: 21.75,   // 9:45 PM = 21.75 hours
  snack: 23.0,     // optional, for completeness
};

// Helper: Check if a given slot is still editable
function isSlotEditable(date: Date, slot: MealSlot): boolean {
  const now = new Date();
  // If date is in the past, not editable
  if (isBefore(date, now) && !isToday(date)) return false;
  // If it's today, compare current time with slot end time
  if (isToday(date)) {
    const currentHour = now.getHours() + now.getMinutes() / 60;
    return currentHour < SLOT_END_TIMES[slot];
  }
  // Future dates are always editable
  return true;
}

export default function MealPlannerPage() {
  const { toast } = useToast();

  const [selectedWeek, setSelectedWeek] = React.useState(startOfWeek(new Date()));
  const [suggestions, setSuggestions] = React.useState<SuggestMealsFromInventoryOutput | null>(null);
  const [loadingSuggestions, setLoadingSuggestions] = React.useState(false);
  const [mealPlans, setMealPlans] = React.useState<Record<string, Record<MealSlot, string>>>({});
  const [recipes, setRecipes] = React.useState<any[]>([]);
  const [loadingMeals, setLoadingMeals] = React.useState(true);

  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = React.useState<MealSlot | null>(null);
  const [isSlotDialogOpen, setIsSlotDialogOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(selectedWeek, i));

  React.useEffect(() => {
    loadData();
  }, [selectedWeek]);

  const loadData = async () => {
    try {
      setLoadingMeals(true);
      const [recipesData, mealPlanData] = await Promise.all([
        getRecipes(),
        getMealPlanForWeek(selectedWeek, addDays(selectedWeek, 6)),
      ]);
      setRecipes(recipesData);
      const plansMap: Record<string, Record<MealSlot, string>> = {};
      mealPlanData.forEach((plan) => {
        const dateKey = plan.date;
        if (!plansMap[dateKey]) plansMap[dateKey] = {} as any;
        plansMap[dateKey][plan.slot] = plan.recipeId;
      });
      setMealPlans(plansMap);
    } catch (error) {
      console.error("Failed to load meal planner data:", error);
    } finally {
      setLoadingMeals(false);
    }
  };

  const openSlotPicker = (date: Date, slot: MealSlot) => {
    if (!isSlotEditable(date, slot)) {
      toast({
        title: "Slot locked",
        description: `You cannot edit ${slot} for ${format(date, "MMM d")} because the time has passed.`,
        variant: "destructive",
      });
      return;
    }
    setSelectedDate(date);
    setSelectedSlot(slot);
    setIsSlotDialogOpen(true);
  };

  const assignRecipe = async (recipeId: string | null) => {
    if (!selectedDate || !selectedSlot) return;
    setSaving(true);
    const result = await saveMealPlan(selectedDate, selectedSlot, recipeId);
    if (result.success) {
      await loadData();
      toast({
        title: recipeId ? "Meal assigned" : "Meal removed",
        description: recipeId
          ? `${recipes.find(r => r.id === recipeId)?.name} added to ${selectedSlot} on ${format(selectedDate, "MMM d")}`
          : `Removed meal from ${selectedSlot} on ${format(selectedDate, "MMM d")}`,
      });
    } else {
      toast({ variant: "destructive", title: "Error", description: "Could not save meal plan." });
    }
    setSaving(false);
    setIsSlotDialogOpen(false);
    setSelectedDate(null);
    setSelectedSlot(null);
  };

  const getRecipeName = (recipeId: string | undefined) => {
    if (!recipeId) return null;
    const recipe = recipes.find(r => r.id === recipeId);
    return recipe?.name || "Unknown";
  };

  const handleSuggest = async () => {
    setLoadingSuggestions(true);
    try {
      const inventory = await getInventoryItems();
      const recipesList = await getRecipes();
      if (!inventory.length || !recipesList.length) {
        toast({ variant: "destructive", title: "Missing Data", description: "Add inventory items and recipes first." });
        return;
      }
      const result = await suggestMealsFromInventory({
        inventory: inventory.map(i => ({
          name: i.name,
          quantity: Number(i.quantity),
          unit: i.unit,
          expiryDate: i.expiryDate ? new Date(i.expiryDate).toISOString() : undefined,
        })),
        recipes: recipesList.map(r => ({
          name: r.name,
          description: r.description,
          ingredients: r.ingredients.map(ing => ({
            name: ing.name,
            quantity: Number(ing.quantity),
            unit: ing.unit,
          })),
        })),
      });
      setSuggestions(result);
      toast({ title: "Suggestions Ready", description: "AI matched your meals successfully." });
    } catch (error) {
      console.error("Meal Planner Error:", error);
      toast({ variant: "destructive", title: "AI Error", description: "Failed to generate suggestions." });
    } finally {
      setLoadingSuggestions(false);
    }
  };

  return (
    <TooltipProvider>
      <AppLayout>
        <div className="flex flex-col gap-6">
          {/* Header */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold font-headline tracking-tight">Meal Planner</h1>
              <p className="text-muted-foreground">Plan your week and assign recipes to breakfast, lunch, or dinner.</p>
              <p className="text-xs text-muted-foreground mt-1">
                ⏰ Breakfast ends at 9:45 AM, Lunch at 1:30 PM, Dinner at 9:45 PM.
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

          {/* Weekly Calendar */}
          <div className="w-full">
            <div className="border-b pb-2 mb-4 flex gap-4">
              <span className="font-semibold text-primary border-b-2 border-primary pb-2">Weekly Calendar</span>
              <span className="text-muted-foreground">AI Suggestions</span>
            </div>

            {loadingMeals ? (
              <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
            ) : (
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-7">
                {weekDays.map((day) => {
                  const dateKey = format(day, "yyyy-MM-dd");
                  const dayPlans = mealPlans[dateKey] || {};
                  const isPastDay = isBefore(day, new Date()) && !isToday(day);
                  return (
                    <Card key={dateKey} className={`border shadow-sm ${isPastDay ? "opacity-60 bg-muted/30" : ""}`}>
                      <CardHeader className="p-3 border-b text-center">
                        <CardTitle className="text-sm font-bold">
                          {format(day, "EEE")}
                          <span className="block text-xl font-headline mt-1">{format(day, "d")}</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-2 space-y-2">
                        {(["breakfast", "lunch", "dinner"] as MealSlot[]).map((slot) => {
                          const recipeId = dayPlans[slot];
                          const recipeName = getRecipeName(recipeId);
                          const editable = !isPastDay && isSlotEditable(day, slot);
                          return (
                            <Tooltip key={slot}>
                              <TooltipTrigger asChild>
                                <div
                                  className={`rounded-lg border p-2 min-h-[70px] transition-colors ${
                                    editable
                                      ? "cursor-pointer hover:bg-muted/20"
                                      : "cursor-not-allowed bg-muted/30 opacity-70"
                                  }`}
                                  onClick={() => editable && openSlotPicker(day, slot)}
                                >
                                  <div className="flex justify-between items-start">
                                    <span className="text-xs font-bold uppercase text-muted-foreground">{slot}</span>
                                    {!editable && (
                                      <Lock className="h-3 w-3 text-muted-foreground" />
                                    )}
                                    {recipeId && editable && (
                                      <Badge variant="secondary" className="text-[10px] h-5">Assigned</Badge>
                                    )}
                                    {recipeId && !editable && (
                                      <Badge variant="outline" className="text-[10px] h-5">Locked</Badge>
                                    )}
                                  </div>
                                  {recipeName ? (
                                    <p className="text-sm font-medium mt-1 line-clamp-2">{recipeName}</p>
                                  ) : (
                                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                      {editable ? <Plus className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                                      {editable ? "Tap to add a recipe" : "Time passed"}
                                    </p>
                                  )}
                                </div>
                              </TooltipTrigger>
                              {!editable && (
                                <TooltipContent side="right">
                                  <p>This {slot} slot is locked because the time has already passed.</p>
                                </TooltipContent>
                              )}
                            </Tooltip>
                          );
                        })}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* AI Suggestions Section */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-headline font-bold">AI Meal Suggestions</h2>
              <Button onClick={handleSuggest} disabled={loadingSuggestions} size="sm" variant="outline">
                {loadingSuggestions ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                Suggest
              </Button>
            </div>
            {suggestions && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {suggestions.suggestions.map((suggestion, idx) => (
                  <Card key={idx} className="border shadow-sm">
                    <CardHeader className="bg-primary/5">
                      <CardTitle className="text-base">{suggestion.recipeName}</CardTitle>
                      {suggestion.recipeDescription && (
                        <CardDescription className="text-xs line-clamp-1">{suggestion.recipeDescription}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="pt-3">
                      <p className="text-xs font-semibold mb-2">Ingredient status:</p>
                      <div className="space-y-1">
                        {suggestion.ingredientStatus.slice(0, 3).map((status, i) => (
                          <div key={i} className="flex items-center justify-between text-xs">
                            <span className="flex items-center gap-1 truncate max-w-[60%]">{status.name}</span>
                            <Badge variant="outline" className={
                              status.status === "enough" ? "border-primary text-primary" :
                              status.status === "low" ? "border-orange-500 text-orange-500" : "border-destructive text-destructive"
                            }>{status.status === "enough" ? "Ready" : status.status === "low" ? "Low" : "Buy"}</Badge>
                          </div>
                        ))}
                        {suggestion.ingredientStatus.length > 3 && <p className="text-[10px] text-muted-foreground">+{suggestion.ingredientStatus.length - 3} more</p>}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Slot picker dialog */}
        <Dialog open={isSlotDialogOpen} onOpenChange={setIsSlotDialogOpen}>
          <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedDate && selectedSlot
                  ? `${format(selectedDate, "EEEE, MMM d")} – ${selectedSlot.charAt(0).toUpperCase() + selectedSlot.slice(1)}`
                  : "Select a Recipe"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-2 py-2">
              <Button
                variant="ghost"
                className="w-full justify-start text-destructive"
                onClick={() => assignRecipe(null)}
                disabled={saving}
              >
                <X className="mr-2 h-4 w-4" /> Remove current meal
              </Button>
              <div className="h-px bg-border my-2" />
              {recipes.map((recipe) => (
                <Button
                  key={recipe.id}
                  variant="ghost"
                  className="w-full justify-start text-left"
                  onClick={() => assignRecipe(recipe.id)}
                  disabled={saving}
                >
                  <div className="flex flex-col items-start">
                    <span>{recipe.name}</span>
                    <span className="text-xs text-muted-foreground">{recipe.ingredients.length} ingredients</span>
                  </div>
                </Button>
              ))}
              {recipes.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No recipes found. Please add some first.</p>}
            </div>
          </DialogContent>
        </Dialog>
      </AppLayout>
    </TooltipProvider>
  );
}