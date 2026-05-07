'use server';

import pool from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { Recipe } from '@/app/lib/types';

export async function getRecipes(): Promise<Recipe[]> {
  const [recipes] = await pool.execute('SELECT * FROM recipes ORDER BY createdAt DESC');
  const allRecipes = recipes as any[];

  const results = await Promise.all(allRecipes.map(async (recipe) => {
    const [ingredients] = await pool.execute('SELECT name, quantity, unit FROM recipe_ingredients WHERE recipe_id = ?', [recipe.id]);
    const [steps] = await pool.execute('SELECT instruction FROM recipe_steps WHERE recipe_id = ? ORDER BY step_number ASC', [recipe.id]);
    
    return {
      ...recipe,
      ingredients: ingredients as any[],
      steps: (steps as any[]).map(s => s.instruction)
    };
  }));

  return results as Recipe[];
}

export async function addRecipe(recipe: Omit<Recipe, 'id'>) {
  const recipeId = uuidv4();
  await pool.execute(
    'INSERT INTO recipes (id, name, description) VALUES (?, ?, ?)',
    [recipeId, recipe.name, recipe.description || null]
  );

  for (const ingredient of recipe.ingredients) {
    await pool.execute(
      'INSERT INTO recipe_ingredients (id, recipe_id, name, quantity, unit) VALUES (?, ?, ?, ?, ?)',
      [uuidv4(), recipeId, ingredient.name, ingredient.quantity, ingredient.unit]
    );
  }

  for (let i = 0; i < recipe.steps.length; i++) {
    await pool.execute(
      'INSERT INTO recipe_steps (id, recipe_id, step_number, instruction) VALUES (?, ?, ?, ?)',
      [uuidv4(), recipeId, i + 1, recipe.steps[i]]
    );
  }

  return { id: recipeId, ...recipe };
}

export async function deleteRecipe(id: string) {
  await pool.execute('DELETE FROM recipes WHERE id = ?', [id]);
}
