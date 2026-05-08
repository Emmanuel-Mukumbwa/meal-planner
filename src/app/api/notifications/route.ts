import { NextResponse } from "next/server"
import { getNotifications } from "@/app/actions/notification-actions"

export async function GET() {
  try {
    const notifications = await getNotifications(100)
    const unreadCount = notifications.filter((n) => !n.isRead).length

    return NextResponse.json({
      notifications,
      unreadCount,
    })
  } catch (error) {
    console.error("Notifications API error:", error)
    return NextResponse.json(
      {
        notifications: [],
        unreadCount: 0,
      },
      { status: 200 }
    )
  }
}