export type MealIngredient = {
  name: string;
  quantity: number;
  unit: string;
  expiryDate?: string;
};

export type MealRecipe = {
  name: string;
  description?: string;
  ingredients: {
    name: string;
    quantity: number;
    unit: string;
  }[];
};

export type SuggestMealsFromInventoryInput = {
  inventory: MealIngredient[];
  recipes: MealRecipe[];
};

export type SuggestedIngredientStatus = {
  name: string;
  requiredQuantity: number;
  requiredUnit: string;
  availableQuantity: number;
  availableUnit: string;
  status: "enough" | "low" | "need-to-buy";
  notes?: string;
};

export type SuggestedMeal = {
  recipeName: string;
  recipeDescription?: string;
  ingredientStatus: SuggestedIngredientStatus[];
};

export type SuggestMealsFromInventoryOutput = {
  suggestions: SuggestedMeal[];
};