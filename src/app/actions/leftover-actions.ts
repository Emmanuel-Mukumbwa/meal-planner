
'use server';

import pool from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { Leftover } from '@/app/lib/types';

export async function getLeftovers(): Promise<Leftover[]> {
  const [rows] = await pool.execute('SELECT * FROM leftovers WHERE status = "frozen" ORDER BY storedAt DESC');
  return rows as Leftover[];
}

export async function addLeftover(item: Omit<Leftover, 'id' | 'status'>) {
  const id = uuidv4();
  await pool.execute(
    'INSERT INTO leftovers (id, name, type, storedAt, expiresAt, status) VALUES (?, ?, ?, ?, ?, ?)',
    [id, item.name, item.type, item.storedAt, item.expiresAt, 'frozen']
  );
  return { id, ...item, status: 'frozen' };
}

export async function updateLeftoverStatus(id: string, status: 'consumed' | 'discarded') {
  await pool.execute('UPDATE leftovers SET status = ? WHERE id = ?', [status, id]);
}

export async function deleteLeftover(id: string) {
  await pool.execute('DELETE FROM leftovers WHERE id = ?', [id]);
}
