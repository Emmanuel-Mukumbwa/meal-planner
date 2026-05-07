
'use server';

import pool from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { InventoryItem } from '@/app/lib/types';
import { revalidatePath } from 'next/cache';

export async function getInventoryItems(): Promise<InventoryItem[]> {
  try {
    const [rows] = await pool.execute('SELECT * FROM inventory ORDER BY createdAt DESC');
    return rows as InventoryItem[];
  } catch (error) {
    console.error('Database error in getInventoryItems:', error);
    return [];
  }
}

export async function addInventoryItem(item: Omit<InventoryItem, 'id'>) {
  try {
    const id = uuidv4();
    // Use coalesce/default values to ensure numeric fields aren't null
    await pool.execute(
      'INSERT INTO inventory (id, name, quantity, unit, category, expiryDate, lowStockThreshold, price) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        id, 
        item.name, 
        Number(item.quantity) || 0, 
        item.unit, 
        item.category, 
        item.expiryDate || null, 
        Number(item.lowStockThreshold) || 1,
        Number(item.price) || 0
      ]
    );
    revalidatePath('/inventory');
    revalidatePath('/');
    return { id, ...item };
  } catch (error) {
    console.error('Database error in addInventoryItem:', error);
    throw new Error('Failed to add item. Ensure the "price" column exists in your database.');
  }
}

export async function updateInventoryItem(id: string, updates: Partial<InventoryItem>) {
  try {
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    if (fields) {
      await pool.execute(`UPDATE inventory SET ${fields} WHERE id = ?`, [...values, id]);
      revalidatePath('/inventory');
      revalidatePath('/');
    }
  } catch (error) {
    console.error('Database error in updateInventoryItem:', error);
    throw new Error('Failed to update item.');
  }
}

export async function deleteInventoryItem(id: string) {
  try {
    await pool.execute('DELETE FROM inventory WHERE id = ?', [id]);
    revalidatePath('/inventory');
    revalidatePath('/');
  } catch (error) {
    console.error('Database error in deleteInventoryItem:', error);
    throw new Error('Failed to delete item.');
  }
}
