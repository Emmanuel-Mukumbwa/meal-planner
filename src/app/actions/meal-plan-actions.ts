'use server';

import pool from '@/lib/db';
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { revalidatePath } from 'next/cache';
import type { InventoryItem } from '@/app/lib/types';
import {
  evaluateRecipeAgainstInventory,
  type IngredientMatchResult,
  type RecipeIngredientLike,
} from '@/app/lib/inventory-match';
import { createLowStockNotification } from '@/app/actions/notification-actions';

export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type MealPlanStatus = 'planned' | 'served';

export interface MealPlan {
  id: string;
  date: string;          // YYYY-MM-DD
  slot: MealSlot;
  recipeId: string;
  recipeName: string | null;
  recipeDescription: string | null;
  status: MealPlanStatus;
  servedAt: string | null;
  canServe: boolean;
  warningCount: number;
  warningMessage: string | null;
  ingredientWarnings: IngredientMatchResult[];
}

export type SaveMealPlanResult = {
  success: boolean;
  warningCount: number;
  warningMessage: string | null;
  ingredientWarnings: IngredientMatchResult[];
};

export type ServeMealPlanResult = {
  success: boolean;
  alreadyServed?: boolean;
  message: string;
  lowStockNotificationsCreated?: number;
};

const DEFAULT_USER_ID = 'default';

function toDateKey(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

async function fetchInventoryItems(db: any): Promise<InventoryItem[]> {
  const [rows] = await db.execute(
    'SELECT id, name, quantity, unit, category, expiryDate, lowStockThreshold, price FROM inventory ORDER BY name ASC'
  );
  return (rows as any[]).map((row) => ({
    id: String(row.id),
    name: String(row.name),
    quantity: Number(row.quantity) || 0,
    unit: String(row.unit || ''),
    category: String(row.category || 'Uncategorized'),
    expiryDate: row.expiryDate ? new Date(row.expiryDate).toISOString() : undefined,
    lowStockThreshold: Number(row.lowStockThreshold) || 1,
    price: Number(row.price) || 0,
  }));
}

async function fetchRecipeIngredients(db: any, recipeId: string): Promise<RecipeIngredientLike[]> {
  const [rows] = await db.execute(
    'SELECT name, quantity, unit FROM recipe_ingredients WHERE recipe_id = ? ORDER BY name ASC',
    [recipeId]
  );
  return (rows as any[]).map((row) => ({
    name: String(row.name),
    quantity: Number(row.quantity) || 0,
    unit: String(row.unit || ''),
  }));
}

async function fetchRecipeNameAndDescription(db: any, recipeId: string) {
  const [rows] = await db.execute('SELECT name, description FROM recipes WHERE id = ? LIMIT 1', [recipeId]);
  const result = (rows as any[])[0];
  if (!result) return null;
  return {
    name: String(result.name),
    description: result.description ? String(result.description) : null,
  };
}

async function getPlanRowByDateSlot(db: any, dateStr: string, slot: MealSlot) {
  const [rows] = await db.execute(
    `SELECT id, user_id, date, slot, recipe_id AS recipeId, status, servedAt
     FROM meal_plans
     WHERE user_id = ? AND date = ? AND slot = ?
     LIMIT 1`,
    [DEFAULT_USER_ID, dateStr, slot]
  );
  return (rows as any[])[0] || null;
}

async function buildMealPlanItem(db: any, row: any, inventory: InventoryItem[]): Promise<MealPlan> {
  const recipeId = String(row.recipeId);
  const recipeMeta = await fetchRecipeNameAndDescription(db, recipeId);
  const recipeIngredients = await fetchRecipeIngredients(db, recipeId);

  // Ensure date is a clean YYYY-MM-DD string
  const rawDate = row.date;
  let dateStr: string;
  if (rawDate instanceof Date) {
    dateStr = format(rawDate, 'yyyy-MM-dd');
  } else if (typeof rawDate === 'string') {
    dateStr = rawDate.slice(0, 10);
  } else {
    dateStr = format(new Date(rawDate), 'yyyy-MM-dd');
  }

  if (String(row.status) === 'served') {
    return {
      id: String(row.id),
      date: dateStr,
      slot: row.slot as MealSlot,
      recipeId,
      recipeName: recipeMeta?.name || null,
      recipeDescription: recipeMeta?.description || null,
      status: 'served',
      servedAt: row.servedAt ? new Date(row.servedAt).toISOString() : null,
      canServe: false,
      warningCount: 0,
      warningMessage: null,
      ingredientWarnings: [],
    };
  }

  const assessment = evaluateRecipeAgainstInventory(recipeIngredients, inventory);
  return {
    id: String(row.id),
    date: dateStr,
    slot: row.slot as MealSlot,
    recipeId,
    recipeName: recipeMeta?.name || null,
    recipeDescription: recipeMeta?.description || null,
    status: 'planned',
    servedAt: null,
    canServe: assessment.canServe,
    warningCount: assessment.warningCount,
    warningMessage: assessment.warningMessage,
    ingredientWarnings: assessment.ingredients,
  };
}

export async function getMealPlanForWeek(startDate: Date, endDate: Date): Promise<MealPlan[]> {
  try {
    const start = toDateKey(startDate);
    const end = toDateKey(endDate);

    const [planRows] = await pool.execute(
      `SELECT id, date, slot, recipe_id AS recipeId, status, servedAt
       FROM meal_plans
       WHERE user_id = ? AND date BETWEEN ? AND ?
       ORDER BY date, FIELD(slot, 'breakfast', 'lunch', 'dinner', 'snack')`,
      [DEFAULT_USER_ID, start, end]
    );

    const inventory = await fetchInventoryItems(pool);
    const rows = planRows as any[];

    const results = await Promise.all(rows.map(async (row) => buildMealPlanItem(pool, row, inventory)));
    return results;
  } catch (error) {
    console.error('Failed to fetch meal plan:', error);
    return [];
  }
}

export async function saveMealPlan(
  date: Date,
  slot: MealSlot,
  recipeId: string | null
): Promise<SaveMealPlanResult> {
  const dateStr = toDateKey(date);
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const existing = await getPlanRowByDateSlot(connection, dateStr, slot);

    if (!recipeId) {
      if (existing && String(existing.status) === 'served') {
        throw new Error('This meal has already been served and cannot be removed.');
      }
      await connection.execute(
        'DELETE FROM meal_plans WHERE user_id = ? AND date = ? AND slot = ?',
        [DEFAULT_USER_ID, dateStr, slot]
      );
      await connection.commit();
      revalidatePath('/meal-planner');
      return { success: true, warningCount: 0, warningMessage: null, ingredientWarnings: [] };
    }

    if (existing && String(existing.status) === 'served') {
      throw new Error('This slot has already been served and cannot be reassigned.');
    }

    const id = existing ? String(existing.id) : uuidv4();
    await connection.execute(
      `INSERT INTO meal_plans (id, user_id, date, slot, recipe_id, status, servedAt)
       VALUES (?, ?, ?, ?, ?, 'planned', NULL)
       ON DUPLICATE KEY UPDATE
         recipe_id = VALUES(recipe_id),
         status = 'planned',
         servedAt = NULL,
         updatedAt = CURRENT_TIMESTAMP`,
      [id, DEFAULT_USER_ID, dateStr, slot, recipeId]
    );

    await connection.commit();

    const inventory = await fetchInventoryItems(pool);
    const recipeIngredients = await fetchRecipeIngredients(pool, recipeId);
    const assessment = evaluateRecipeAgainstInventory(recipeIngredients, inventory);

    revalidatePath('/meal-planner');
    revalidatePath('/');

    return {
      success: true,
      warningCount: assessment.warningCount,
      warningMessage: assessment.warningMessage,
      ingredientWarnings: assessment.ingredients,
    };
  } catch (error) {
    await connection.rollback();
    console.error('Failed to save meal plan:', error);
    return {
      success: false,
      warningCount: 0,
      warningMessage: error instanceof Error ? error.message : 'Could not save meal plan.',
      ingredientWarnings: [],
    };
  } finally {
    connection.release();
  }
}

export async function serveMealPlan(date: Date, slot: MealSlot): Promise<ServeMealPlanResult> {
  const dateStr = toDateKey(date);
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [planRows] = await connection.execute(
      `SELECT id, date, slot, recipe_id AS recipeId, status, servedAt
       FROM meal_plans
       WHERE user_id = ? AND date = ? AND slot = ?
       FOR UPDATE`,
      [DEFAULT_USER_ID, dateStr, slot]
    );

    const plan = (planRows as any[])[0];
    if (!plan) {
      await connection.rollback();
      return { success: false, message: 'Meal plan not found.' };
    }

    if (String(plan.status) === 'served') {
      await connection.rollback();
      return { success: true, alreadyServed: true, message: 'This meal was already served.' };
    }

    const recipeId = String(plan.recipeId);
    const recipeIngredients = await fetchRecipeIngredients(connection, recipeId);
    const inventory = await fetchInventoryItems(connection);
    const assessment = evaluateRecipeAgainstInventory(recipeIngredients, inventory);

    if (!assessment.canServe) {
      await connection.rollback();
      return {
        success: false,
        message: assessment.warningMessage || 'Not enough inventory to serve this meal.',
      };
    }

    const inventoryMap = new Map(inventory.map((item) => [item.id, item]));
    const lowStockTargets: {
      inventoryId: string;
      inventoryName: string;
      remainingQuantity: number;
      unit: string;
      threshold: number;
    }[] = [];

    for (const item of assessment.ingredients) {
      if (!item.matchedInventoryId || item.requiredQuantityInInventoryUnit === null) continue;

      const inventoryItem = inventoryMap.get(item.matchedInventoryId);
      if (!inventoryItem) throw new Error(`Inventory item not found for ${item.ingredientName}.`);

      const oldQuantity = Number(inventoryItem.quantity) || 0;
      const deduct = Number(item.requiredQuantityInInventoryUnit) || 0;
      const nextQuantity = Math.max(0, Math.round((oldQuantity - deduct) * 100) / 100);

      if (nextQuantity < 0) throw new Error(`Insufficient stock for ${item.ingredientName}.`);

      await connection.execute('UPDATE inventory SET quantity = ? WHERE id = ?', [nextQuantity, inventoryItem.id]);

      const threshold = Number(inventoryItem.lowStockThreshold) || 0;
      if (oldQuantity > threshold && nextQuantity <= threshold) {
        lowStockTargets.push({
          inventoryId: inventoryItem.id,
          inventoryName: inventoryItem.name,
          remainingQuantity: nextQuantity,
          unit: inventoryItem.unit,
          threshold,
        });
      }
    }

    await connection.execute(
      "UPDATE meal_plans SET status = 'served', servedAt = NOW(), updatedAt = CURRENT_TIMESTAMP WHERE id = ?",
      [plan.id]
    );

    await connection.commit();

    for (const target of lowStockTargets) {
      await createLowStockNotification(target);
    }

    revalidatePath('/meal-planner');
    revalidatePath('/');
    revalidatePath('/inventory');
    revalidatePath('/notifications');

    return {
      success: true,
      message: 'Meal marked as served and inventory updated.',
      lowStockNotificationsCreated: lowStockTargets.length,
    };
  } catch (error) {
    await connection.rollback();
    console.error('Failed to serve meal plan:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Could not serve meal.',
    };
  } finally {
    connection.release();
  }
}