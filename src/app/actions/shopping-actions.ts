//src/app/actions/shopping-actions.ts
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
