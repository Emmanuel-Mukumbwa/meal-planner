'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ImportRecipeFromURLInputSchema = z.object({
  url: z.string().url().describe('The URL of the recipe to import.'),
});
export type ImportRecipeFromURLInput = z.infer<typeof ImportRecipeFromURLInputSchema>;

const ImportRecipeFromURLOutputSchema = z.object({
  title: z.string().describe('The title of the recipe.'),
  ingredients: z
    .array(z.string())
    .describe(
      'A list of ingredients, each as a descriptive string including quantity and unit (e.g., "1 cup all-purpose flour", "2 large eggs", "1/2 tsp salt").'
    ),
  steps: z
    .array(z.string())
    .describe('A list of cooking steps, each as a concise instruction.'),
  prepTime: z.string().optional().describe('The estimated preparation time for the recipe.'),
  cookTime: z.string().optional().describe('The estimated cooking time for the recipe.'),
  servings: z.string().optional().describe('The number of servings the recipe yields.'),
});
export type ImportRecipeFromURLOutput = z.infer<typeof ImportRecipeFromURLOutputSchema>;

const PromptInputSchema = z.object({
  htmlContent: z.string().describe('The HTML content of the recipe webpage.'),
});

const recipeImportPrompt = ai.definePrompt({
  name: 'recipeImportPrompt',
  input: { schema: PromptInputSchema },
  output: { schema: ImportRecipeFromURLOutputSchema },
  prompt: `You are an expert recipe extractor. Your task is to extract recipe information from the provided HTML content.
Focus on identifying the recipe's title, a clear list of ingredients (each including quantity and unit if available, as a single descriptive string), and a sequential list of cooking steps.
Also try to extract optional information like preparation time, cooking time, and servings.
If a piece of information cannot be found, omit it from the output or leave the field empty if it's an array.

HTML Content:
{{{htmlContent}}}`,
});

const importRecipeFromURLFlow = ai.defineFlow(
  {
    name: 'importRecipeFromURLFlow',
    inputSchema: ImportRecipeFromURLInputSchema,
    outputSchema: ImportRecipeFromURLOutputSchema,
  },
  async (input) => {
    let htmlContent: string;

    try {
      const response = await fetch(input.url);
      if (!response.ok) {
        throw new Error(`Failed to fetch recipe from ${input.url}: ${response.statusText}`);
      }
      htmlContent = await response.text();
    } catch (error) {
      console.error('Error fetching URL content:', error);
      throw new Error(`Could not retrieve recipe content from the provided URL: ${input.url}`);
    }

    const { output } = await recipeImportPrompt({ htmlContent });

    if (!output) {
      throw new Error('Failed to extract recipe details from the URL content.');
    }

    return output;
  }
);

export async function importRecipeFromURL(
  input: ImportRecipeFromURLInput
): Promise<ImportRecipeFromURLOutput> {
  return importRecipeFromURLFlow(input);
}