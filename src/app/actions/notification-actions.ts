"use server"

import pool from "@/lib/db"
import { revalidatePath } from "next/cache"
import { v4 as uuidv4 } from "uuid"
import type { NotificationItem, NotificationType } from "@/app/lib/notification-types"

function toMysqlDatetime(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString().slice(0, 19).replace("T", " ")
  }
  return date.toISOString().slice(0, 19).replace("T", " ")
}

function toIsoDate(value: unknown): string {
  if (value instanceof Date) return value.toISOString()

  const parsed = new Date(String(value))
  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString()
  }

  return parsed.toISOString()
}

function rowToNotification(row: any): NotificationItem {
  return {
    id: String(row.id),
    title: String(row.title),
    message: String(row.message),
    type: row.type as NotificationType,
    relatedType: row.relatedType ? String(row.relatedType) : null,
    relatedId: row.relatedId ? String(row.relatedId) : null,
    notifyAt: toIsoDate(row.notifyAt),
    isRead: Number(row.isRead) === 1,
    readAt: row.readAt ? toIsoDate(row.readAt) : null,
    createdAt: toIsoDate(row.createdAt),
  }
}

export async function createNotification(input: {
  title: string
  message: string
  type?: NotificationType
  relatedType?: string | null
  relatedId?: string | null
  notifyAt?: string | Date
}) {
  try {
    const id = uuidv4()
    const notifyAt = input.notifyAt ? toMysqlDatetime(input.notifyAt) : toMysqlDatetime(new Date())

    await pool.execute(
      `INSERT INTO notifications
        (id, title, message, type, relatedType, relatedId, notifyAt, isRead)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
      [
        id,
        input.title,
        input.message,
        input.type || "system",
        input.relatedType || null,
        input.relatedId || null,
        notifyAt,
      ]
    )

    revalidatePath("/notifications")
    revalidatePath("/")

    return { success: true, id }
  } catch (error) {
    console.error("Database error in createNotification:", error)
    throw new Error("Failed to create notification.")
  }
}

export async function createLowStockNotification(input: {
  inventoryId: string
  inventoryName: string
  remainingQuantity: number
  unit: string
  threshold: number
}) {
  try {
    const [existing] = await pool.execute(
      `SELECT id
       FROM notifications
       WHERE isRead = 0
         AND type = 'system'
         AND relatedType = 'inventory'
         AND relatedId = ?
         AND title = 'Low stock alert'
       LIMIT 1`,
      [input.inventoryId]
    )

    const existingRows = existing as any[]
    if (existingRows.length > 0) {
      return { created: false }
    }

    const message = `${input.inventoryName} is now low in stock. Remaining: ${Number(input.remainingQuantity).toFixed(2)} ${input.unit}. Threshold: ${Number(input.threshold).toFixed(2)} ${input.unit}.`

    const created = await createNotification({
      title: "Low stock alert",
      message,
      type: "system",
      relatedType: "inventory",
      relatedId: input.inventoryId,
      notifyAt: new Date(),
    })

    return { created: true, id: created.id }
  } catch (error) {
    console.error("Database error in createLowStockNotification:", error)
    return { created: false }
  }
}

export async function getNotifications(limit = 100): Promise<NotificationItem[]> {
  try {
    const safeLimit = Math.max(1, Math.min(500, Number(limit) || 100))

    const [rows] = await pool.execute(
      `SELECT id, title, message, type, relatedType, relatedId, notifyAt, isRead, readAt, createdAt
       FROM notifications
       ORDER BY isRead ASC, notifyAt DESC, createdAt DESC
       LIMIT ${safeLimit}`
    )

    return (rows as any[]).map(rowToNotification)
  } catch (error) {
    console.error("Database error in getNotifications:", error)
    return []
  }
}

export async function getUnreadNotificationsCount(): Promise<number> {
  try {
    const [rows] = await pool.execute(
      "SELECT COUNT(*) AS count FROM notifications WHERE isRead = 0"
    )
    const result = rows as any[]
    return Number(result?.[0]?.count) || 0
  } catch (error) {
    console.error("Database error in getUnreadNotificationsCount:", error)
    return 0
  }
}

export async function markNotificationAsRead(id: string) {
  try {
    await pool.execute(
      "UPDATE notifications SET isRead = 1, readAt = NOW() WHERE id = ?",
      [id]
    )

    revalidatePath("/notifications")
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Database error in markNotificationAsRead:", error)
    throw new Error("Failed to mark notification as read.")
  }
}

export async function markAllNotificationsAsRead() {
  try {
    await pool.execute(
      "UPDATE notifications SET isRead = 1, readAt = NOW() WHERE isRead = 0"
    )

    revalidatePath("/notifications")
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Database error in markAllNotificationsAsRead:", error)
    throw new Error("Failed to mark all notifications as read.")
  }
}

export async function deleteNotification(id: string) {
  try {
    await pool.execute("DELETE FROM notifications WHERE id = ?", [id])

    revalidatePath("/notifications")
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Database error in deleteNotification:", error)
    throw new Error("Failed to delete notification.")
  }
}