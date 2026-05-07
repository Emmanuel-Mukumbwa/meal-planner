
'use server';

import pool from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { Leftover } from '@/app/lib/types';
import { revalidatePath } from 'next/cache';

export async function getLeftovers(): Promise<Leftover[]> {
  try {
    const [rows] = await pool.execute('SELECT * FROM leftovers WHERE status = "frozen" ORDER BY storedAt DESC');
    return rows as Leftover[];
  } catch (error) {
    console.error('Database error in getLeftovers:', error);
    return [];
  }
}

export async function addLeftover(item: Omit<Leftover, 'id' | 'status'>) {
  try {
    const id = uuidv4();
    await pool.execute(
      'INSERT INTO leftovers (id, name, type, storedAt, expiresAt, status) VALUES (?, ?, ?, ?, ?, ?)',
      [id, item.name, item.type, item.storedAt, item.expiresAt, 'frozen']
    );
    revalidatePath('/leftovers');
    revalidatePath('/');
    return { id, ...item, status: 'frozen' };
  } catch (error) {
    console.error('Database error in addLeftover:', error);
    throw new Error('Failed to add leftover to database.');
  }
}

export async function updateLeftoverStatus(id: string, status: 'consumed' | 'discarded') {
  try {
    await pool.execute('UPDATE leftovers SET status = ? WHERE id = ?', [status, id]);
    revalidatePath('/leftovers');
    revalidatePath('/');
  } catch (error) {
    console.error('Database error in updateLeftoverStatus:', error);
    throw new Error('Failed to update status.');
  }
}

export async function deleteLeftover(id: string) {
  try {
    await pool.execute('DELETE FROM leftovers WHERE id = ?', [id]);
    revalidatePath('/leftovers');
    revalidatePath('/');
  } catch (error) {
    console.error('Database error in deleteLeftover:', error);
    throw new Error('Failed to delete leftover.');
  }
}
