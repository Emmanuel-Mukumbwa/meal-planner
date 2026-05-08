"use client"

import * as React from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Bell,
  BellRing,
  CheckCheck,
  Clock3,
  Loader2,
  AlertTriangle,
  Trash2,
  RefreshCcw,
  Snowflake,
  Sparkles,
  MessageSquareMore,
} from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"
import {
  deleteNotification,
  getNotifications,
  getUnreadNotificationsCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@/app/actions/notification-actions"
import type { NotificationItem, NotificationType } from "@/app/lib/notification-types"
import { useToast } from "@/hooks/use-toast"

type FilterKey = "all" | "unread" | NotificationType

function getTypeLabel(type: NotificationType) {
  switch (type) {
    case "leftover_reminder":
      return "Leftover reminder"
    case "leftover_overdue":
      return "Leftover overdue"
    case "system":
      return "System"
    default:
      return type
  }
}

function getTypeIcon(type: NotificationType) {
  switch (type) {
    case "leftover_reminder":
      return <Clock3 className="h-4 w-4 text-orange-500" />
    case "leftover_overdue":
      return <AlertTriangle className="h-4 w-4 text-destructive" />
    case "system":
      return <Sparkles className="h-4 w-4 text-primary" />
    default:
      return <Bell className="h-4 w-4 text-muted-foreground" />
  }
}

function getTypeBadgeClass(type: NotificationType) {
  switch (type) {
    case "leftover_reminder":
      return "border-orange-500 text-orange-500"
    case "leftover_overdue":
      return "border-destructive text-destructive"
    case "system":
      return "border-primary text-primary"
    default:
      return "border-muted-foreground text-muted-foreground"
  }
}

export default function NotificationsPage() {
  const { toast } = useToast()
  const [notifications, setNotifications] = React.useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = React.useState(0)
  const [loading, setLoading] = React.useState(true)
  const [activeFilter, setActiveFilter] = React.useState<FilterKey>("all")

  React.useEffect(() => {
    void loadNotifications()
  }, [])

  const loadNotifications = async () => {
    try {
      setLoading(true)
      const [items, unread] = await Promise.all([
        getNotifications(200),
        getUnreadNotificationsCount(),
      ])

      setNotifications(items)
      setUnreadCount(unread)
    } catch (error) {
      console.error("Load notifications error:", error)
      toast({
        title: "Notifications unavailable",
        description: "Could not load your notifications.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleMarkRead = async (id: string) => {
    try {
      await markNotificationAsRead(id)
      setNotifications((current) =>
        current.map((item) =>
          item.id === id ? { ...item, isRead: true, readAt: new Date().toISOString() } : item
        )
      )
      setUnreadCount((current) => Math.max(0, current - 1))
      toast({
        title: "Marked as read",
        description: "Notification updated successfully.",
      })
    } catch (error) {
      console.error(error)
      toast({
        title: "Update failed",
        description: "Could not mark the notification as read.",
        variant: "destructive",
      })
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead()
      setNotifications((current) =>
        current.map((item) => ({
          ...item,
          isRead: true,
          readAt: item.readAt || new Date().toISOString(),
        }))
      )
      setUnreadCount(0)
      toast({
        title: "All read",
        description: "All unread notifications have been marked as read.",
      })
    } catch (error) {
      console.error(error)
      toast({
        title: "Update failed",
        description: "Could not mark all notifications as read.",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const target = notifications.find((item) => item.id === id)
      await deleteNotification(id)

      setNotifications((current) => current.filter((item) => item.id !== id))
      if (target && !target.isRead) {
        setUnreadCount((current) => Math.max(0, current - 1))
      }

      toast({
        title: "Notification deleted",
        description: "The notification has been removed.",
      })
    } catch (error) {
      console.error(error)
      toast({
        title: "Delete failed",
        description: "Could not delete the notification.",
        variant: "destructive",
      })
    }
  }

  const filteredNotifications = React.useMemo(() => {
    return notifications.filter((item) => {
      if (activeFilter === "all") return true
      if (activeFilter === "unread") return !item.isRead
      return item.type === activeFilter
    })
  }, [notifications, activeFilter])

  const reminderCount = notifications.filter((n) => n.type === "leftover_reminder").length
  const overdueCount = notifications.filter((n) => n.type === "leftover_overdue").length
  const systemCount = notifications.filter((n) => n.type === "system").length

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold font-headline tracking-tight">Notifications</h1>
            <p className="text-muted-foreground">
              Keep track of leftover reminders, overdue alerts, and system messages.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={loadNotifications} className="gap-2">
              <RefreshCcw className="h-4 w-4" />
              Refresh
            </Button>
            <Button
              onClick={handleMarkAllRead}
              disabled={unreadCount === 0}
              className="gap-2"
            >
              <CheckCheck className="h-4 w-4" />
              Mark all read
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Unread</CardTitle>
              <BellRing className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{unreadCount}</div>
              <div className="text-xs text-muted-foreground">Needs your attention</div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Leftover Reminders</CardTitle>
              <Clock3 className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reminderCount}</div>
              <div className="text-xs text-muted-foreground">Reheat reminders</div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Overdue Alerts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overdueCount}</div>
              <div className="text-xs text-muted-foreground">Past storage window</div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">System Messages</CardTitle>
              <Sparkles className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemCount}</div>
              <div className="text-xs text-muted-foreground">App updates and notices</div>
            </CardContent>
          </Card>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed bg-muted/5 py-20 text-center">
            <Bell className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
            <h3 className="text-lg font-semibold">No notifications yet</h3>
            <p className="text-muted-foreground">
              New leftover reminders and system alerts will appear here.
            </p>
          </div>
        ) : (
          <>
            <Tabs value={activeFilter} onValueChange={(v) => setActiveFilter(v as FilterKey)}>
              <TabsList className="grid w-full grid-cols-5 lg:w-[760px]">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="unread">Unread</TabsTrigger>
                <TabsTrigger value="leftover_reminder">Reminders</TabsTrigger>
                <TabsTrigger value="leftover_overdue">Overdue</TabsTrigger>
                <TabsTrigger value="system">System</TabsTrigger>
              </TabsList>

              <TabsContent value={activeFilter} className="mt-6">
                <div className="space-y-3">
                  {filteredNotifications.map((item) => (
                    <Card
                      key={item.id}
                      className={`border-none shadow-sm transition-shadow hover:shadow-md ${
                        item.isRead ? "bg-background" : "bg-primary/5"
                      }`}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              {getTypeIcon(item.type)}
                              <CardTitle className="text-base">{item.title}</CardTitle>
                              {!item.isRead && (
                                <Badge className="bg-primary/15 text-primary border-primary/30">
                                  Unread
                                </Badge>
                              )}
                              <Badge variant="outline" className={getTypeBadgeClass(item.type)}>
                                {getTypeLabel(item.type)}
                              </Badge>
                            </div>

                            <CardDescription className="max-w-3xl">
                              {item.message}
                            </CardDescription>
                          </div>

                          <div className="flex items-center gap-2">
                            {!item.isRead && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleMarkRead(item.id)}
                                className="gap-2"
                              >
                                <CheckCheck className="h-4 w-4" />
                                Mark read
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(item.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="pt-0">
                        <div className="flex flex-col gap-2 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
                          <span>
                            Created {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                          </span>
                          <span>
                            Notify at: {format(new Date(item.notifyAt), "MMM d, yyyy h:mm a")}
                          </span>
                          <span>
                            {item.readAt
                              ? `Read ${formatDistanceToNow(new Date(item.readAt), { addSuffix: true })}`
                              : "Not read yet"}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {filteredNotifications.length === 0 && (
                    <div className="rounded-3xl border-2 border-dashed bg-muted/5 py-20 text-center">
                      <MessageSquareMore className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
                      <h3 className="text-lg font-semibold">No notifications in this filter</h3>
                      <p className="text-muted-foreground">
                        Try another tab or wait for new reminders to appear.
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </AppLayout>
  )
}