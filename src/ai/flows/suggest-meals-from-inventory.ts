'use server';
/**
 * @fileOverview A meal suggestion AI agent that compares recipe requirements with current inventory.
 *
 * - suggestMealsFromInventory - A function that suggests meals based on inventory and recipes.
 * - SuggestMealsFromInventoryInput - The input type for the suggestMealsFromInventory function.
 * - SuggestMealsFromInventoryOutput - The return type for the suggestMealsFromInventory function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Input Schema
const IngredientDetailSchema = z.object({
  name: z.string().describe('The name of the ingredient (e.g., "milk", "eggs").'),
  quantity: z.number().positive().describe('The quantity of the ingredient.'),
  unit: z.string().describe('The unit of measurement (e.g., "liters", "pieces", "grams", "cups").'),
});

const InventoryItemSchema = IngredientDetailSchema.extend({
  expiryDate: z.string().datetime().optional().describe('Optional expiry date in ISO 8601 format.'),
});

const RecipeIngredientSchema = IngredientDetailSchema;

const RecipeSchema = z.object({
  name: z.string().describe('The name of the recipe.'),
  description: z.string().optional().describe('Optional recipe steps or general description.'),
  ingredients: z.array(RecipeIngredientSchema).describe('List of ingredients required for the recipe.'),
});

export const SuggestMealsFromInventoryInputSchema = z.object({
  inventory: z.array(InventoryItemSchema).describe('The user\'s current grocery inventory.'),
  recipes: z.array(RecipeSchema).describe('A list of saved recipes.'),
});
export type SuggestMealsFromInventoryInput = z.infer<typeof SuggestMealsFromInventoryInputSchema>;

// Output Schema
const SuggestedIngredientStatusSchema = z.object({
  name: z.string().describe('The name of the ingredient.'),
  requiredQuantity: z.number().describe('The quantity required for the recipe.'),
  requiredUnit: z.string().describe('The unit required for the recipe.'),
  availableQuantity: z.number().describe('The quantity available in inventory.'),
  availableUnit: z.string().describe('The unit available in inventory.'),
  status: z.enum(['enough', 'low', 'need-to-buy']).describe('Status of the ingredient: "enough", "low", or "need-to-buy".'),
  notes: z.string().optional().describe('Additional notes, e.g., "expires soon" or "only X quantity available".'),
});

const SuggestedMealSchema = z.object({
  recipeName: z.string().describe('The name of the suggested recipe.'),
  recipeDescription: z.string().optional().describe('The description of the suggested recipe.'),
  ingredientStatus: z.array(SuggestedIngredientStatusSchema).describe('The status of each ingredient for this recipe.'),
});

export const SuggestMealsFromInventoryOutputSchema = z.object({
  suggestions: z.array(SuggestedMealSchema).describe('A list of suggested meals with ingredient status.'),
});
export type SuggestMealsFromInventoryOutput = z.infer<typeof SuggestMealsFromInventoryOutputSchema>;

export async function suggestMealsFromInventory(input: SuggestMealsFromInventoryInput): Promise<SuggestMealsFromInventoryOutput> {
  return suggestMealsFromInventoryFlow(input);
}

// Helper to get current date for the prompt.
// This is done outside the prompt definition as Handlebars is logic-less.
const getCurrentDate = () => new Date().toISOString();

const suggestMealsPrompt = ai.definePrompt({
  name: 'suggestMealsPrompt',
  input: { schema: SuggestMealsFromInventoryInputSchema.extend({ currentDate: z.string().datetime().describe('The current date in ISO 8601 format for expiry calculations.') }) },
  output: { schema: SuggestMealsFromInventoryOutputSchema },
  prompt: `You are an intelligent meal planning assistant. Your task is to compare a list of available grocery inventory items with a list of saved recipes. For each recipe, you need to determine the status of its required ingredients based on the current inventory.

Inventory items are provided with name, quantity, unit, and an optional expiry date.
Recipe ingredients are provided with name, quantity, and unit.

For each ingredient in a recipe, determine its status:
- "enough": If the available quantity in the inventory is greater than or equal to the required quantity.
- "low": If the available quantity is less than the required quantity, but greater than zero.
- "need-to-buy": If the ingredient is not found in the inventory or the available quantity is zero.

Consider common unit conversions (e.g., 1 cup milk = 236ml milk, 1kg chicken = 1000g chicken) when comparing, but prioritize exact unit matches. If units are vastly different and cannot be reasonably converted (e.g., "pieces" vs "grams" for an apple), treat it as "need-to-buy" unless the quantity for the existing unit is clearly sufficient.

For "notes", if an item is expiring soon (e.g., within 2 days from today, based on currentDate: {{currentDate}}), mention "expires soon". Also, if the status is "low", mention the exact available quantity.

Here is the current inventory:
{{#if inventory}}
{{#each inventory}}
- {{name}}: {{quantity}} {{unit}}{{#if expiryDate}}, expires on {{expiryDate}}{{/if}}
{{/each}}
{{else}}
No inventory items provided.
{{/if}}

Here are the saved recipes:
{{#if recipes}}
{{#each recipes}}
--- Recipe: {{name}} ---
Description: {{description}}
Ingredients:
{{#each ingredients}}
- {{name}}: {{quantity}} {{unit}}
{{/each}}

{{/each}}
{{else}}
No recipes provided.
{{/if}}

Based on the above inventory and recipes, generate a JSON object structured according to the following schema, providing suggestions for each recipe and the status of its ingredients. Your response must be valid JSON.`
});


const suggestMealsFromInventoryFlow = ai.defineFlow(
  {
    name: 'suggestMealsFromInventoryFlow',
    inputSchema: SuggestMealsFromInventoryInputSchema,
    outputSchema: SuggestMealsFromInventoryOutputSchema,
  },
  async (input) => {
    // Pass the current date to the prompt for expiry calculations.
    const { output } = await suggestMealsPrompt({
      ...input,
      currentDate: getCurrentDate(),
    });
    return output!;
  }
);
