import { ai } from "@/ai/genkit";
import { z } from "genkit";

const IngredientDetailSchema = z.object({
  name: z.string().describe('Ingredient name, e.g. "milk" or "eggs".'),
  quantity: z.number().positive().describe("Required quantity."),
  unit: z.string().describe('Unit, e.g. "grams", "ml", "pieces".'),
});

const InventoryItemSchema = IngredientDetailSchema.extend({
  expiryDate: z.string().datetime().optional().describe("Optional expiry date in ISO 8601 format."),
});

const RecipeIngredientSchema = IngredientDetailSchema;

const RecipeSchema = z.object({
  name: z.string().describe("Recipe name."),
  description: z.string().optional().describe("Optional recipe description."),
  ingredients: z.array(RecipeIngredientSchema).describe("Ingredients required for this recipe."),
});

export const SuggestMealsFromInventoryInputSchema = z.object({
  inventory: z.array(InventoryItemSchema).describe("Current inventory items."),
  recipes: z.array(RecipeSchema).describe("Saved recipes."),
});

export type SuggestMealsFromInventoryInput = z.infer<typeof SuggestMealsFromInventoryInputSchema>;

const SuggestedIngredientStatusSchema = z.object({
  name: z.string(),
  requiredQuantity: z.number(),
  requiredUnit: z.string(),
  availableQuantity: z.number(),
  availableUnit: z.string(),
  status: z.enum(["enough", "low", "need-to-buy"]),
  notes: z.string().optional(),
});

const SuggestedMealSchema = z.object({
  recipeName: z.string(),
  recipeDescription: z.string().optional(),
  ingredientStatus: z.array(SuggestedIngredientStatusSchema),
});

export const SuggestMealsFromInventoryOutputSchema = z.object({
  suggestions: z.array(SuggestedMealSchema),
});

export type SuggestMealsFromInventoryOutput = z.infer<typeof SuggestMealsFromInventoryOutputSchema>;

const getCurrentDate = () => new Date().toISOString();

const suggestMealsPrompt = ai.definePrompt({
  name: "suggestMealsPrompt",
  input: {
    schema: SuggestMealsFromInventoryInputSchema.extend({
      currentDate: z.string().describe("Current date in ISO 8601 format."),
    }),
  },
  output: { schema: SuggestMealsFromInventoryOutputSchema },
  prompt: `
You are an intelligent meal planning assistant.

Your task is to compare grocery inventory with saved recipes and suggest meals the user can make.

Rules:
- For each recipe, evaluate every ingredient against the inventory.
- Status meanings:
  - "enough": available quantity is greater than or equal to required quantity.
  - "low": available quantity is greater than zero but less than required quantity.
  - "need-to-buy": ingredient is missing or quantity is zero.
- Consider simple unit conversion only when it is obvious and safe.
- Prefer exact unit matches.
- If units are clearly incompatible, treat as "need-to-buy".
- If an inventory item expires within 2 days of currentDate, add a note saying "expires soon".
- If status is "low", add a note with the available quantity.
- Return valid JSON only.

Current date: {{currentDate}}

Inventory:
{{#if inventory}}
{{#each inventory}}
- {{name}}: {{quantity}} {{unit}}{{#if expiryDate}}, expires on {{expiryDate}}{{/if}}
{{/each}}
{{else}}
No inventory items provided.
{{/if}}

Recipes:
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
`,
});

export async function suggestMealsFromInventoryFlow(
  input: SuggestMealsFromInventoryInput
): Promise<SuggestMealsFromInventoryOutput> {
  const { output } = await suggestMealsPrompt({
    ...input,
    currentDate: getCurrentDate(),
  });

  return output!;
}