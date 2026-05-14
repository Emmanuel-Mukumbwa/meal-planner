'use server';

import pool from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { revalidatePath } from 'next/cache';

export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface MealPlan {
  id: string;
  date: string;
  slot: MealSlot;
  recipeId: string;
  recipeName?: string;
}

export async function getMealPlanForWeek(startDate: Date, endDate: Date): Promise<MealPlan[]> {
  try {
    const [rows] = await pool.execute(
      `SELECT mp.*, r.name as recipeName 
       FROM meal_plans mp 
       LEFT JOIN recipes r ON mp.recipe_id = r.id 
       WHERE mp.date BETWEEN ? AND ? 
       ORDER BY mp.date, FIELD(mp.slot, 'breakfast', 'lunch', 'dinner', 'snack')`,
      [startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]]
    );
    return rows as MealPlan[];
  } catch (error) {
    console.error('Failed to fetch meal plan:', error);
    return [];
  }
}

export async function saveMealPlan(
  date: Date,
  slot: MealSlot,
  recipeId: string | null
): Promise<{ success: boolean }> {
  const dateStr = date.toISOString().split('T')[0];
  try {
    if (!recipeId) {
      // Delete existing meal
      await pool.execute(
        'DELETE FROM meal_plans WHERE date = ? AND slot = ?',
        [dateStr, slot]
      );
    } else {
      // Upsert: replace or insert
      await pool.execute(
        `INSERT INTO meal_plans (id, date, slot, recipe_id) 
         VALUES (?, ?, ?, ?) 
         ON DUPLICATE KEY UPDATE recipe_id = VALUES(recipe_id), updatedAt = CURRENT_TIMESTAMP`,
        [uuidv4(), dateStr, slot, recipeId]
      );
    }
    revalidatePath('/meal-planner');
    return { success: true };
  } catch (error) {
    console.error('Failed to save meal plan:', error);
    return { success: false };
  }
}