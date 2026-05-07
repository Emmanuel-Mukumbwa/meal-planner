'use server';

import pool from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { InventoryItem } from '@/app/lib/types';

export async function getInventoryItems(): Promise<InventoryItem[]> {
  const [rows] = await pool.execute('SELECT * FROM inventory ORDER BY createdAt DESC');
  return rows as InventoryItem[];
}

export async function addInventoryItem(item: Omit<InventoryItem, 'id'>) {
  const id = uuidv4();
  await pool.execute(
    'INSERT INTO inventory (id, name, quantity, unit, category, expiryDate, lowStockThreshold) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, item.name, item.quantity, item.unit, item.category, item.expiryDate || null, item.lowStockThreshold]
  );
  return { id, ...item };
}

export async function updateInventoryItem(id: string, updates: Partial<InventoryItem>) {
  const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
  const values = Object.values(updates);
  if (fields) {
    await pool.execute(`UPDATE inventory SET ${fields} WHERE id = ?`, [...values, id]);
  }
}

export async function deleteInventoryItem(id: string) {
  await pool.execute('DELETE FROM inventory WHERE id = ?', [id]);
}
