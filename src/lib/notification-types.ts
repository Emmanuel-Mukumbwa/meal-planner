export type NotificationType = "leftover_reminder" | "leftover_overdue" | "system"

export type NotificationItem = {
  id: string
  title: string
  message: string
  type: NotificationType
  relatedType: string | null
  relatedId: string | null
  notifyAt: string
  isRead: boolean
  readAt: string | null
  createdAt: string
}

export type NotificationStats = {
  unreadCount: number
  totalCount: number
}