'use server';

import pool from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { Recipe } from '@/app/lib/types';
import { revalidatePath } from 'next/cache';

export async function getRecipes(): Promise<Recipe[]> {
  try {
    const [recipes] = await pool.execute('SELECT * FROM recipes ORDER BY createdAt DESC');
    const allRecipes = recipes as any[];

    const results = await Promise.all(allRecipes.map(async (recipe) => {
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
        steps: (steps as any[]).map(s => s.instruction),
      };
    }));

    return results as Recipe[];
  } catch (error) {
    console.error('Database error in getRecipes:', error);
    return [];
  }
}

export async function addRecipe(recipe: Omit<Recipe, 'id'>) {
  try {
    const recipeId = uuidv4();
    await pool.execute(
      'INSERT INTO recipes (id, name, description) VALUES (?, ?, ?)',
      [recipeId, recipe.name, recipe.description || null]
    );

    for (const ingredient of recipe.ingredients) {
      await pool.execute(
        'INSERT INTO recipe_ingredients (id, recipe_id, name, quantity, unit) VALUES (?, ?, ?, ?, ?)',
        [uuidv4(), recipeId, ingredient.name, Number(ingredient.quantity) || 0, ingredient.unit]
      );
    }

    for (let i = 0; i < recipe.steps.length; i++) {
      await pool.execute(
        'INSERT INTO recipe_steps (id, recipe_id, step_number, instruction) VALUES (?, ?, ?, ?)',
        [uuidv4(), recipeId, i + 1, recipe.steps[i]]
      );
    }

    revalidatePath('/recipes');
    return { id: recipeId, ...recipe };
  } catch (error) {
    console.error('Database error in addRecipe:', error);
    throw new Error('Failed to save recipe.');
  }
}

export async function updateRecipe(
  id: string,
  recipe: Partial<Omit<Recipe, 'id'>> & { ingredients?: any[]; steps?: string[] }
) {
  try {
    if (recipe.name !== undefined || recipe.description !== undefined) {
      const updates: string[] = [];
      const values: any[] = [];
      if (recipe.name !== undefined) {
        updates.push('name = ?');
        values.push(recipe.name);
      }
      if (recipe.description !== undefined) {
        updates.push('description = ?');
        values.push(recipe.description);
      }
      if (updates.length) {
        await pool.execute(`UPDATE recipes SET ${updates.join(', ')} WHERE id = ?`, [...values, id]);
      }
    }

    if (recipe.ingredients) {
      await pool.execute('DELETE FROM recipe_ingredients WHERE recipe_id = ?', [id]);
      for (const ing of recipe.ingredients) {
        await pool.execute(
          'INSERT INTO recipe_ingredients (id, recipe_id, name, quantity, unit) VALUES (?, ?, ?, ?, ?)',
          [uuidv4(), id, ing.name, Number(ing.quantity) || 0, ing.unit]
        );
      }
    }

    if (recipe.steps) {
      await pool.execute('DELETE FROM recipe_steps WHERE recipe_id = ?', [id]);
      for (let i = 0; i < recipe.steps.length; i++) {
        await pool.execute(
          'INSERT INTO recipe_steps (id, recipe_id, step_number, instruction) VALUES (?, ?, ?, ?)',
          [uuidv4(), id, i + 1, recipe.steps[i]]
        );
      }
    }

    revalidatePath('/recipes');
    return { success: true };
  } catch (error) {
    console.error('Database error in updateRecipe:', error);
    throw new Error('Failed to update recipe.');
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