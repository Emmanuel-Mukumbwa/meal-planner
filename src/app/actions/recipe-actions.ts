'use server';

import pool from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { Recipe } from '@/app/lib/types';
import { revalidatePath } from 'next/cache';
import {
  importRecipeFromURL as importRecipeFromURLFlow,
  type ImportRecipeFromURLInput,
  type ImportRecipeFromURLOutput,
} from '@/ai/flows/import-recipe-from-url';

export async function getRecipes(): Promise<Recipe[]> {
  try {
    const [recipes] = await pool.execute('SELECT * FROM recipes ORDER BY createdAt DESC');
    const allRecipes = recipes as any[];

    const results = await Promise.all(
      allRecipes.map(async (recipe) => {
        const [ingredients] = await pool.execute(
          'SELECT name, quantity, unit FROM recipe_ingredients WHERE recipe_id = ?',
          [recipe.id]
        );
        const [steps] = await pool.execute(
          'SELECT instruction FROM recipe_steps WHERE recipe_id = ? ORDER BY step_number ASC',
          [recipe.id]
        );

        return {
          ...recipe,
          ingredients: ingredients as any[],
          steps: (steps as any[]).map((s) => s.instruction),
        };
      })
    );

    return results as Recipe[];
  } catch (error) {
    console.error('Database error in getRecipes:', error);
    return [];
  }
}

export async function addRecipe(recipe: Omit<Recipe, 'id'>) {
  try {
    if (!recipe.name?.trim()) {
      throw new Error('Recipe name is required.');
    }

    if (!recipe.ingredients?.length) {
      throw new Error('At least one ingredient is required.');
    }

    if (!recipe.steps?.length) {
      throw new Error('At least one step is required.');
    }

    const recipeId = uuidv4();

    await pool.execute(
      'INSERT INTO recipes (id, name, description) VALUES (?, ?, ?)',
      [recipeId, recipe.name.trim(), recipe.description || null]
    );

    for (const ingredient of recipe.ingredients) {
      await pool.execute(
        'INSERT INTO recipe_ingredients (id, recipe_id, name, quantity, unit) VALUES (?, ?, ?, ?, ?)',
        [uuidv4(), recipeId, ingredient.name.trim(), Number(ingredient.quantity) || 0, ingredient.unit.trim()]
      );
    }

    for (let i = 0; i < recipe.steps.length; i++) {
      await pool.execute(
        'INSERT INTO recipe_steps (id, recipe_id, step_number, instruction) VALUES (?, ?, ?, ?)',
        [uuidv4(), recipeId, i + 1, recipe.steps[i].trim()]
      );
    }

    revalidatePath('/recipes');
    return { id: recipeId, ...recipe };
  } catch (error) {
    console.error('Database error in addRecipe:', error);
    throw new Error('Failed to save recipe.');
  }
}

export async function deleteRecipe(id: string) {
  try {
    await pool.execute('DELETE FROM recipes WHERE id = ?', [id]);
    revalidatePath('/recipes');
  } catch (error) {
    console.error('Database error in deleteRecipe:', error);
    throw new Error('Failed to delete recipe.');
  }
}

export async function importRecipeFromURL(
  input: ImportRecipeFromURLInput
): Promise<ImportRecipeFromURLOutput> {
  try {
    return await importRecipeFromURLFlow(input);
  } catch (error) {
    console.error('AI recipe import error:', error);
    throw new Error('Failed to import recipe from URL.');
  }
}