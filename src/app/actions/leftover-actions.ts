"use server"

import pool from "@/lib/db"
import { v4 as uuidv4 } from "uuid"
import { revalidatePath } from "next/cache"
import { addDays, subDays } from "date-fns"
import { GoogleGenAI } from "@google/genai"
import { Leftover, LeftoverType } from "@/app/lib/types"

const STORAGE_GUIDELINES: Record<LeftoverType, number> = {
  Meat: 90,
  Vegetables: 180,
  Soup: 60,
  Grain: 30,
  Dairy: 30,
  Other: 60,
}

type EstimateResult = {
  days: number
  reason: string
  source: "ai" | "rule"
}

function toMysqlDatetime(value: string | Date) {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) {
    throw new Error("Invalid date value")
  }
  return d.toISOString().slice(0, 19).replace("T", " ")
}

function clampDays(days: number, type: LeftoverType) {
  const cap = STORAGE_GUIDELINES[type]
  const safe = Math.max(1, Math.min(Math.round(days), cap))
  return safe
}

function extractJson(text: string) {
  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim()

  const first = cleaned.indexOf("{")
  const last = cleaned.lastIndexOf("}")

  if (first === -1 || last === -1 || last <= first) {
    throw new Error("No JSON found")
  }

  return JSON.parse(cleaned.slice(first, last + 1))
}

export async function estimateLeftoverStorage(name: string, type: LeftoverType): Promise<EstimateResult> {
  const fallbackDays = STORAGE_GUIDELINES[type]

  try {
    const ai = new GoogleGenAI({})

    const prompt = `
You are estimating a conservative freezer storage window for a leftover food item.

Food name: ${name}
Category: ${type}
Maximum allowed days: ${fallbackDays}

Return ONLY valid JSON with this shape:
{
  "days": number,
  "reason": string
}

Rules:
- Be conservative.
- Do not exceed the maximum allowed days.
- Use a smaller number when the food sounds delicate or mixed.
- Do not include markdown, code fences, or extra text.
`

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    })

    const text = response.text ?? ""
    const parsed = extractJson(text)

    const rawDays = Number(parsed?.days)
    const reason = typeof parsed?.reason === "string" && parsed.reason.trim()
      ? parsed.reason.trim()
      : "AI estimate generated successfully."

    if (!Number.isFinite(rawDays)) {
      return {
        days: fallbackDays,
        reason: `Fallback to category guideline for ${type}.`,
        source: "rule",
      }
    }

    return {
      days: clampDays(rawDays, type),
      reason,
      source: "ai",
    }
  } catch (error) {
    console.error("AI estimation failed:", error)
    return {
      days: fallbackDays,
      reason: `Fallback to category guideline for ${type}.`,
      source: "rule",
    }
  }
}

export async function getLeftovers(): Promise<Leftover[]> {
  try {
    const [rows] = await pool.execute(
      "SELECT * FROM leftovers WHERE status = 'frozen' ORDER BY storedAt DESC"
    )
    return rows as Leftover[]
  } catch (error) {
    console.error("Database error in getLeftovers:", error)
    return []
  }
}

async function createLeftoverNotifications(params: {
  leftoverId: string
  leftoverName: string
  expiresAt: string | Date
}) {
  const expires = new Date(params.expiresAt)
  if (Number.isNaN(expires.getTime())) return

  const notify3Days = toMysqlDatetime(subDays(expires, 3))
  const notify1Day = toMysqlDatetime(subDays(expires, 1))

  const rows = [
    {
      id: uuidv4(),
      title: "Leftover reheating reminder",
      message: `${params.leftoverName} may need reheating in 3 days.`,
      type: "leftover_reminder",
      relatedType: "leftover",
      relatedId: params.leftoverId,
      notifyAt: notify3Days,
    },
    {
      id: uuidv4(),
      title: "Leftover reheating reminder",
      message: `${params.leftoverName} may need reheating in 1 day.`,
      type: "leftover_reminder",
      relatedType: "leftover",
      relatedId: params.leftoverId,
      notifyAt: notify1Day,
    },
  ]

  for (const row of rows) {
    await pool.execute(
      `INSERT INTO notifications
        (id, title, message, type, relatedType, relatedId, notifyAt, isRead)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
      [row.id, row.title, row.message, row.type, row.relatedType, row.relatedId, row.notifyAt]
    )
  }
}

export async function addLeftover(item: Omit<Leftover, "id" | "status">) {
  try {
    if (!item.name?.trim()) {
      throw new Error("Name is required")
    }

    const id = uuidv4()
    const storedAt = toMysqlDatetime(item.storedAt)
    const expiresAt = toMysqlDatetime(item.expiresAt)

    await pool.execute(
      "INSERT INTO leftovers (id, name, type, storedAt, expiresAt, status) VALUES (?, ?, ?, ?, ?, ?)",
      [id, item.name.trim(), item.type, storedAt, expiresAt, "frozen"]
    )

    await createLeftoverNotifications({
      leftoverId: id,
      leftoverName: item.name.trim(),
      expiresAt,
    })

    revalidatePath("/leftovers")
    revalidatePath("/")

    return {
      id,
      name: item.name.trim(),
      type: item.type,
      storedAt,
      expiresAt,
      status: "frozen" as const,
    }
  } catch (error) {
    console.error("Database error in addLeftover:", error)
    throw new Error("Failed to add leftover to database.")
  }
}

export async function updateLeftoverStatus(id: string, status: "consumed" | "discarded") {
  try {
    await pool.execute("UPDATE leftovers SET status = ? WHERE id = ?", [status, id])

    revalidatePath("/leftovers")
    revalidatePath("/")
  } catch (error) {
    console.error("Database error in updateLeftoverStatus:", error)
    throw new Error("Failed to update status.")
  }
}

export async function deleteLeftover(id: string) {
  try {
    await pool.execute("DELETE FROM leftovers WHERE id = ?", [id])

    revalidatePath("/leftovers")
    revalidatePath("/")
  } catch (error) {
    console.error("Database error in deleteLeftover:", error)
    throw new Error("Failed to delete leftover.")
  }
}