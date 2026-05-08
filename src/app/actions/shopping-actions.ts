'use server';

import pool from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { ShoppingListItem } from '@/app/lib/types';

export async function getShoppingList(): Promise<ShoppingListItem[]> { 
  const [rows] = await pool.execute('SELECT * FROM shopping_list ORDER BY createdAt DESC');
  return rows as ShoppingListItem[];
} 

export async function addShoppingItem(item: Omit<ShoppingListItem, 'id'>) {
  const id = uuidv4();
  await pool.execute(
    'INSERT INTO shopping_list (id, name, quantity, unit, completed, category) VALUES (?, ?, ?, ?, ?, ?)',
    [id, item.name, item.quantity, item.unit, item.completed ? 1 : 0, item.category]
  );
  return { id, ...item };
}

export async function updateShoppingItem(id: string, completed: boolean) {
  await pool.execute('UPDATE shopping_list SET completed = ? WHERE id = ?', [completed ? 1 : 0, id]);
}

export async function deleteShoppingItem(id: string) {
  await pool.execute('DELETE FROM shopping_list WHERE id = ?', [id]);
}

// New function: add items only if they aren't already in the shopping list
export async function addShoppingItemsIfMissing(
  items: Array<{ name: string; quantity: number; unit: string; category: string }>
) {
  try {
    // Get current shopping list names (case‑insensitive)
    const [existingRows] = await pool.execute('SELECT name FROM shopping_list');
    const existingNames = (existingRows as any[]).map(row => row.name.toLowerCase());

    const addedItems: string[] = [];
    for (const item of items) {
      if (!existingNames.includes(item.name.toLowerCase())) {
        const id = uuidv4();
        await pool.execute(
          'INSERT INTO shopping_list (id, name, quantity, unit, completed, category) VALUES (?, ?, ?, ?, ?, ?)',
          [id, item.name, item.quantity, item.unit, 0, item.category]
        );
        addedItems.push(item.name);
      }
    }
    return { addedCount: addedItems.length, addedItems };
  } catch (error) {
    console.error('Database error in addShoppingItemsIfMissing:', error);
    throw new Error('Failed to add one or more shopping items.');
  }
}