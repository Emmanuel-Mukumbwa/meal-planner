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
  Loader2,
  Plus,
  X,
  Lock,
  AlertCircle,
  CheckCircle2,
  UtensilsCrossed,
} from "lucide-react";
import { format, addDays, startOfWeek, isBefore, isToday } from "date-fns";
import { getInventoryItems } from "@/app/actions/inventory-actions";
import { getRecipes } from "@/app/actions/recipe-actions";
import { suggestMealsFromInventory } from "@/app/actions/meal-actions";
import {
  getMealPlanForWeek,
  saveMealPlan,
  serveMealPlan,
  type MealSlot,
  type MealPlan,
} from "@/app/actions/meal-plan-actions";
import type { SuggestMealsFromInventoryOutput } from "@/app/lib/meal-types";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const SLOT_END_TIMES: Record<MealSlot, number> = {
  breakfast: 9.75,
  lunch: 13.5,
  dinner: 21.75,
  snack: 23.0,
};

function isSlotEditable(date: Date, slot: MealSlot): boolean {
  const now = new Date();
  if (isBefore(date, now) && !isToday(date)) return false;
  if (isToday(date)) {
    const currentHour = now.getHours() + now.getMinutes() / 60;
    return currentHour < SLOT_END_TIMES[slot];
  }
  return true;
}

function isSlotDue(date: Date, slot: MealSlot): boolean {
  const now = new Date();
  if (isBefore(date, now) && !isToday(date)) return true;
  if (isToday(date)) {
    const currentHour = now.getHours() + now.getMinutes() / 60;
    return currentHour >= SLOT_END_TIMES[slot];
  }
  return false;
}

type MealPlanMap = Record<string, Partial<Record<MealSlot, MealPlan>>>;

function toDateKey(date: Date) {
  return format(date, "yyyy-MM-dd");
}

export default function MealPlannerPage() {
  const { toast } = useToast();

  const [selectedWeek, setSelectedWeek] = React.useState(startOfWeek(new Date()));
  const [suggestions, setSuggestions] = React.useState<SuggestMealsFromInventoryOutput | null>(null);
  const [loadingSuggestions, setLoadingSuggestions] = React.useState(false);

  const [mealPlans, setMealPlans] = React.useState<MealPlanMap>({});
  const [recipes, setRecipes] = React.useState<any[]>([]);
  const [loadingMeals, setLoadingMeals] = React.useState(true);

  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = React.useState<MealSlot | null>(null);
  const [isSlotDialogOpen, setIsSlotDialogOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [servingKey, setServingKey] = React.useState<string | null>(null);

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(selectedWeek, i));

  React.useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWeek]);

  const loadData = async () => {
    try {
      setLoadingMeals(true);

      const [recipesData, mealPlanData] = await Promise.all([
        getRecipes(),
        getMealPlanForWeek(selectedWeek, addDays(selectedWeek, 6)),
      ]);

      setRecipes(recipesData);

      const plansMap: MealPlanMap = {};

      mealPlanData.forEach((plan) => {
        // ✅ Use the exact same date format as in the calendar
        const dateKey = plan.date; // already a string like "2026-05-14"
        if (!plansMap[dateKey]) plansMap[dateKey] = {};
        plansMap[dateKey][plan.slot] = plan;
      });

      setMealPlans(plansMap);
    } catch (error) {
      console.error("Failed to load meal planner data:", error);
      toast({
        variant: "destructive",
        title: "Load failed",
        description: "Could not load meal planner data.",
      });
    } finally {
      setLoadingMeals(false);
    }
  };

  const openSlotPicker = (date: Date, slot: MealSlot) => {
    if (!isSlotEditable(date, slot)) {
      toast({
        variant: "destructive",
        title: "Cannot edit",
        description: `You cannot edit ${slot} for ${format(date, "MMM d")} because the time has passed.`,
      });
      return;
    }

    setSelectedDate(date);
    setSelectedSlot(slot);
    setIsSlotDialogOpen(true);
  };

  const handleServeMeal = async (date: Date, slot: MealSlot) => {
    const key = `${toDateKey(date)}-${slot}`;

    try {
      setServingKey(key);
      const result = await serveMealPlan(date, slot);
      if (result.success) {
        await loadData();
        toast({
          title: "Meal served",
          description: result.message,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Cannot serve meal",
          description: result.message,
        });
      }
    } catch (error) {
      console.error("Serve meal error:", error);
      toast({
        variant: "destructive",
        title: "Cannot serve meal",
        description: "Something went wrong while serving this meal.",
      });
    } finally {
      setServingKey(null);
    }
  };

  const assignRecipe = async (recipeId: string | null) => {
    if (!selectedDate || !selectedSlot) return;

    setSaving(true);
    try {
      const result = await saveMealPlan(selectedDate, selectedSlot, recipeId);
      if (result.success) {
        await loadData();
        const recipeName = recipeId
          ? recipes.find((r) => r.id === recipeId)?.name || "Recipe"
          : null;
        toast({
          title: recipeId
            ? result.warningCount > 0
              ? "Meal assigned with warnings"
              : "Meal assigned"
            : "Meal removed",
          description: recipeId
            ? result.warningCount > 0
              ? `${recipeName} added to ${selectedSlot} on ${format(selectedDate, "MMM d")}. ${result.warningMessage || "Some ingredients are short."}`
              : `${recipeName} added to ${selectedSlot} on ${format(selectedDate, "MMM d")}`
            : `Removed meal from ${selectedSlot} on ${format(selectedDate, "MMM d")}`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.warningMessage || "Could not save meal plan.",
        });
      }
    } catch (error) {
      console.error("Assign recipe error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not save meal plan.",
      });
    } finally {
      setSaving(false);
      setIsSlotDialogOpen(false);
      setSelectedDate(null);
      setSelectedSlot(null);
    }
  };

  const handleSuggest = async () => {
    setLoadingSuggestions(true);
    try {
      const inventory = await getInventoryItems();
      const recipesList = await getRecipes();
      if (!inventory.length || !recipesList.length) {
        toast({
          variant: "destructive",
          title: "Missing Data",
          description: "Add inventory items and recipes first.",
        });
        return;
      }
      const result = await suggestMealsFromInventory({
        inventory: inventory.map((i) => ({
          name: i.name,
          quantity: Number(i.quantity),
          unit: i.unit,
          expiryDate: i.expiryDate ? new Date(i.expiryDate).toISOString() : undefined,
        })),
        recipes: recipesList.map((r) => ({
          name: r.name,
          description: r.description,
          ingredients: r.ingredients.map((ing) => ({
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
      toast({
        variant: "destructive",
        title: "AI Error",
        description: "Failed to generate suggestions.",
      });
    } finally {
      setLoadingSuggestions(false);
    }
  };

  return (
    <TooltipProvider>
      <AppLayout>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold font-headline tracking-tight">Meal Planner</h1>
              <p className="text-muted-foreground">
                Plan your week and assign recipes to breakfast, lunch, or dinner.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Breakfast ends at 9:45 AM, Lunch at 1:30 PM, Dinner at 9:45 PM.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => setSelectedWeek((d) => addDays(d, -7))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium">
                <CalendarIcon className="h-4 w-4 text-primary" />
                {format(selectedWeek, "MMM d")} - {format(addDays(selectedWeek, 6), "MMM d, yyyy")}
              </div>

              <Button variant="outline" size="icon" onClick={() => setSelectedWeek((d) => addDays(d, 7))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {loadingMeals ? (
            <div className="flex justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-7">
              {weekDays.map((day) => {
                const dateKey = format(day, "yyyy-MM-dd");
                const dayPlans = mealPlans[dateKey] || {};
                const isPastDay = isBefore(day, new Date()) && !isToday(day);

                return (
                  <Card
                    key={dateKey}
                    className={`border shadow-sm ${isPastDay ? "opacity-60 bg-muted/30" : ""}`}
                  >
                    <CardHeader className="p-3 border-b text-center">
                      <CardTitle className="text-sm font-bold">
                        {format(day, "EEE")}
                        <span className="block text-xl font-headline mt-1">{format(day, "d")}</span>
                      </CardTitle>
                    </CardHeader>

                    <CardContent className="p-2 space-y-2">
                      {(["breakfast", "lunch", "dinner"] as MealSlot[]).map((slot) => {
                        const plan = dayPlans[slot];
                        const recipeName = plan?.recipeName;
                        const editable = !isPastDay && isSlotEditable(day, slot);
                        const dueForServe = !!plan && plan.status === "planned" && isSlotDue(day, slot);
                        const serving = servingKey === `${dateKey}-${slot}`;

                        return (
                          <Tooltip key={slot}>
                            <TooltipTrigger asChild>
                              <div
                                className={`rounded-lg border p-2 min-h-[90px] transition-colors ${
                                  editable
                                    ? "cursor-pointer hover:bg-muted/20"
                                    : "cursor-default bg-muted/30 opacity-70"
                                }`}
                                onClick={() => editable && openSlotPicker(day, slot)}
                              >
                                <div className="flex justify-between items-start gap-2">
                                  <span className="text-xs font-bold uppercase text-muted-foreground">
                                    {slot}
                                  </span>

                                  {plan?.status === "served" ? (
                                    <Badge className="text-[10px] h-5 bg-primary/15 text-primary">
                                      Served
                                    </Badge>
                                  ) : plan && plan.warningCount > 0 ? (
                                    <Badge variant="outline" className="text-[10px] h-5 border-orange-500 text-orange-500">
                                      Check stock
                                    </Badge>
                                  ) : plan && editable ? (
                                    <Badge variant="secondary" className="text-[10px] h-5">
                                      Assigned
                                    </Badge>
                                  ) : plan && dueForServe ? (
                                    <Badge variant="outline" className="text-[10px] h-5">
                                      Ready to serve
                                    </Badge>
                                  ) : !editable ? (
                                    <Lock className="h-3 w-3 text-muted-foreground" />
                                  ) : null}
                                </div>

                                {recipeName ? (
                                  <div className="mt-1 space-y-1">
                                    <p className="text-sm font-medium line-clamp-2">{recipeName}</p>

                                    {plan?.status === "served" ? (
                                      <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                                        <CheckCircle2 className="h-3 w-3 text-primary" />
                                        Served
                                        {plan.servedAt ? ` at ${format(new Date(plan.servedAt), "p")}` : ""}
                                      </p>
                                    ) : (
                                      <>
                                        {plan && plan.warningCount > 0 && (
                                          <p className="text-[11px] text-orange-600 flex items-start gap-1">
                                            <AlertCircle className="h-3 w-3 mt-0.5" />
                                            {plan.warningMessage || "Some ingredients are short."}
                                          </p>
                                        )}

                                        {dueForServe && (
                                          <div className="pt-1">
                                            {plan?.canServe ? (
                                              <Button
                                                size="sm"
                                                className="w-full gap-2"
                                                disabled={serving}
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  void handleServeMeal(day, slot);
                                                }}
                                              >
                                                {serving ? (
                                                  <Loader2 className="h-3 w-3 animate-spin" />
                                                ) : (
                                                  <UtensilsCrossed className="h-3 w-3" />
                                                )}
                                                Serve meal
                                              </Button>
                                            ) : (
                                              <Button
                                                size="sm"
                                                variant="destructive"
                                                className="w-full"
                                                disabled
                                              >
                                                Insufficient stock
                                              </Button>
                                            )}
                                          </div>
                                        )}
                                      </>
                                    )}
                                  </div>
                                ) : (
                                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                    {editable ? <Plus className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                                    {editable ? "Tap to add a recipe" : "Time passed"}
                                  </p>
                                )}
                              </div>
                            </TooltipTrigger>

                            {!editable && !plan && (
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

          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-headline font-bold">AI Meal Suggestions</h2>
              <Button onClick={handleSuggest} disabled={loadingSuggestions} size="sm" variant="outline">
                {loadingSuggestions ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                Suggest
              </Button>
            </div>

            {suggestions && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {suggestions.suggestions.slice(0, 6).map((suggestion, idx) => (
                  <Card key={idx} className="border shadow-sm">
                    <CardHeader className="bg-primary/5">
                      <CardTitle className="text-base">{suggestion.recipeName}</CardTitle>
                      {suggestion.recipeDescription && (
                        <CardDescription className="text-xs line-clamp-1">
                          {suggestion.recipeDescription}
                        </CardDescription>
                      )}
                    </CardHeader>

                    <CardContent className="pt-3">
                      <p className="text-xs font-semibold mb-2">Ingredient status:</p>
                      <div className="space-y-1">
                        {suggestion.ingredientStatus.slice(0, 3).map((status, i) => (
                          <div key={i} className="flex items-center justify-between text-xs">
                            <span className="flex items-center gap-1 truncate max-w-[60%]">
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

                        {suggestion.ingredientStatus.length > 3 && (
                          <p className="text-[10px] text-muted-foreground">
                            +{suggestion.ingredientStatus.length - 3} more
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

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
                    <span className="text-xs text-muted-foreground">
                      {recipe.ingredients.length} ingredients
                    </span>
                  </div>
                </Button>
              ))}

              {recipes.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No recipes found. Please add some first.
                </p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </AppLayout>
    </TooltipProvider>
  );
}