"use client";

import { useState } from "react";
import {
  Bell,
  FileText,
  Users,
  Zap,
  Check,
  X,
  Clock,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Notification {
  id: string;
  type: "memory" | "team" | "ai" | "system";
  title: string;
  message: string;
  time: string;
  read: boolean;
}

const notifications: Notification[] = [
  {
    id: "1",
    type: "ai",
    title: "AI Insight",
    message: "New pattern detected in your customer feedback documents",
    time: "5 min ago",
    read: false,
  },
  {
    id: "2",
    type: "team",
    title: "Team Update",
    message: "Sarah Chen shared 'Q4 Roadmap' with you",
    time: "1 hour ago",
    read: false,
  },
  {
    id: "3",
    type: "memory",
    title: "New Memory",
    message: "Document 'Product Specs v2' was added to Engineering",
    time: "2 hours ago",
    read: false,
  },
  {
    id: "4",
    type: "system",
    title: "Sync Complete",
    message: "Slack integration synced 23 new messages",
    time: "3 hours ago",
    read: true,
  },
  {
    id: "5",
    type: "ai",
    title: "Weekly Digest",
    message: "Your weekly knowledge insights are ready",
    time: "Yesterday",
    read: true,
  },
];

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "memory":
      return <FileText className="h-4 w-4 text-blue-500" />;
    case "team":
      return <Users className="h-4 w-4 text-emerald-500" />;
    case "ai":
      return <Zap className="h-4 w-4 text-violet-500" />;
    default:
      return <Bell className="h-4 w-4 text-slate-500" />;
  }
};

export function NotificationsPopover() {
  const [notificationList, setNotificationList] = useState(notifications);
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = notificationList.filter((n) => !n.read).length;

  const markAsRead = (id: string) => {
    setNotificationList((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotificationList((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const dismissNotification = (id: string) => {
    setNotificationList((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-violet-600 text-[10px] font-medium text-white flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-slate-900 dark:text-white">
              Notifications
            </h4>
            {unreadCount > 0 && (
              <Badge
                variant="secondary"
                className="bg-violet-500/10 text-violet-600"
              >
                {unreadCount} new
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-xs h-7 px-2"
              >
                <Check className="h-3 w-3 mr-1" />
                Mark all read
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Notifications List */}
        <ScrollArea className="h-[360px]">
          {notificationList.length > 0 ? (
            <div className="divide-y">
              {notificationList.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group ${
                    !notification.read ? "bg-violet-500/5" : ""
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex gap-3">
                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 h-fit">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={`text-sm font-medium ${
                            notification.read
                              ? "text-slate-600 dark:text-slate-400"
                              : "text-slate-900 dark:text-white"
                          }`}
                        >
                          {notification.title}
                        </p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            dismissNotification(notification.id);
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-1 mt-2 text-xs text-slate-400">
                        <Clock className="h-3 w-3" />
                        {notification.time}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="h-12 w-12 text-slate-300 mb-3" />
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                No notifications
              </p>
              <p className="text-xs text-slate-500 mt-1">
                You&apos;re all caught up!
              </p>
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="p-3 border-t">
          <Button variant="ghost" className="w-full text-sm" size="sm">
            View all notifications
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
