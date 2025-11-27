"use client";

import { useState } from "react";
import {
  Bell,
  Mail,
  MessageSquare,
  Smartphone,
  Globe,
  Users,
  FileText,
  Search,
  Zap,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface NotificationSetting {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  email: boolean;
  push: boolean;
  slack: boolean;
}

export default function NotificationsPage() {
  const [digestFrequency, setDigestFrequency] = useState("daily");
  const [notifications, setNotifications] = useState<NotificationSetting[]>([
    {
      id: "new-memory",
      title: "New Memories",
      description: "When someone adds a memory to a shared project",
      icon: <FileText className="h-5 w-5 text-violet-500" />,
      email: true,
      push: true,
      slack: false,
    },
    {
      id: "search-results",
      title: "Saved Search Results",
      description: "When new content matches your saved searches",
      icon: <Search className="h-5 w-5 text-blue-500" />,
      email: true,
      push: false,
      slack: true,
    },
    {
      id: "team-updates",
      title: "Team Updates",
      description: "When team members join or leave your workspace",
      icon: <Users className="h-5 w-5 text-emerald-500" />,
      email: true,
      push: true,
      slack: false,
    },
    {
      id: "integration-alerts",
      title: "Integration Alerts",
      description: "When an integration fails or requires attention",
      icon: <AlertCircle className="h-5 w-5 text-orange-500" />,
      email: true,
      push: true,
      slack: true,
    },
    {
      id: "ai-insights",
      title: "AI Insights",
      description: "Weekly AI-generated insights about your knowledge base",
      icon: <Zap className="h-5 w-5 text-yellow-500" />,
      email: true,
      push: false,
      slack: false,
    },
  ]);

  const toggleNotification = (
    id: string,
    channel: "email" | "push" | "slack"
  ) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, [channel]: !n[channel] } : n))
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Notifications
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Choose how and when you want to be notified
        </p>
      </div>

      {/* Notification Channels */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Mail className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-slate-900 dark:text-white">
                  Email
                </p>
                <p className="text-xs text-slate-500">john@company.com</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-violet-500/10">
                <Smartphone className="h-5 w-5 text-violet-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-slate-900 dark:text-white">
                  Push Notifications
                </p>
                <p className="text-xs text-slate-500">Browser & Mobile</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-pink-500/10">
                <MessageSquare className="h-5 w-5 text-pink-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-slate-900 dark:text-white">
                  Slack
                </p>
                <p className="text-xs text-slate-500">#memora-updates</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Email Digest */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Email Digest
          </CardTitle>
          <CardDescription>
            Receive a summary of all activity in your workspace
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-900 dark:text-white">
                Digest Frequency
              </p>
              <p className="text-sm text-slate-500">
                How often should we send you a summary?
              </p>
            </div>
            <Select value={digestFrequency} onValueChange={setDigestFrequency}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="realtime">Real-time</SelectItem>
                <SelectItem value="hourly">Hourly</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="never">Never</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Preferences
          </CardTitle>
          <CardDescription>
            Customize notifications for each activity type
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Header Row */}
          <div className="hidden md:grid md:grid-cols-[1fr,100px,100px,100px] gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div />
            <div className="text-center text-sm font-medium text-slate-500">
              Email
            </div>
            <div className="text-center text-sm font-medium text-slate-500">
              Push
            </div>
            <div className="text-center text-sm font-medium text-slate-500">
              Slack
            </div>
          </div>

          {/* Notification Items */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className="py-4 first:pt-4 last:pb-0 grid md:grid-cols-[1fr,100px,100px,100px] gap-4 items-center"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
                    {notification.icon}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {notification.title}
                    </p>
                    <p className="text-sm text-slate-500">
                      {notification.description}
                    </p>
                  </div>
                </div>

                {/* Mobile Labels */}
                <div className="md:hidden grid grid-cols-3 gap-4 pl-12">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={notification.email}
                      onCheckedChange={() =>
                        toggleNotification(notification.id, "email")
                      }
                    />
                    <span className="text-xs text-slate-500">Email</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={notification.push}
                      onCheckedChange={() =>
                        toggleNotification(notification.id, "push")
                      }
                    />
                    <span className="text-xs text-slate-500">Push</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={notification.slack}
                      onCheckedChange={() =>
                        toggleNotification(notification.id, "slack")
                      }
                    />
                    <span className="text-xs text-slate-500">Slack</span>
                  </div>
                </div>

                {/* Desktop Switches */}
                <div className="hidden md:flex justify-center">
                  <Switch
                    checked={notification.email}
                    onCheckedChange={() =>
                      toggleNotification(notification.id, "email")
                    }
                  />
                </div>
                <div className="hidden md:flex justify-center">
                  <Switch
                    checked={notification.push}
                    onCheckedChange={() =>
                      toggleNotification(notification.id, "push")
                    }
                  />
                </div>
                <div className="hidden md:flex justify-center">
                  <Switch
                    checked={notification.slack}
                    onCheckedChange={() =>
                      toggleNotification(notification.id, "slack")
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quiet Hours */}
      <Card>
        <CardHeader>
          <CardTitle>Quiet Hours</CardTitle>
          <CardDescription>
            Pause notifications during specific hours
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">
                  Enable Quiet Hours
                </p>
                <p className="text-sm text-slate-500">
                  No notifications from 10:00 PM to 8:00 AM
                </p>
              </div>
            </div>
            <Switch />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
