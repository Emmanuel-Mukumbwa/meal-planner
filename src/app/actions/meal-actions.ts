"use server";

import { suggestMealsFromInventoryFlow } from "@/ai/flows/suggest-meals-from-inventory";
import type {
  SuggestMealsFromInventoryInput,
  SuggestMealsFromInventoryOutput,
} from "@/app/lib/meal-types";

export async function suggestMealsFromInventory(
  input: SuggestMealsFromInventoryInput
): Promise<SuggestMealsFromInventoryOutput> {
  try {
    return await suggestMealsFromInventoryFlow(input);
  } catch (error) {
    console.error("AI meal suggestion error:", error);
    throw new Error("Failed to generate meal suggestions.");
  }
}