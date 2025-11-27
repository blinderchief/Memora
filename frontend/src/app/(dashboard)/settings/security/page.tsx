"use client";

import { useState } from "react";
import {
  Shield,
  Key,
  Smartphone,
  Monitor,
  LogOut,
  AlertTriangle,
  Check,
  X,
  Clock,
  Globe,
  Lock,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const activeSessions = [
  {
    id: "1",
    device: "Chrome on Windows",
    location: "New York, US",
    ip: "192.168.1.xxx",
    lastActive: "Active now",
    current: true,
  },
  {
    id: "2",
    device: "Safari on iPhone",
    location: "New York, US",
    ip: "192.168.1.xxx",
    lastActive: "2 hours ago",
    current: false,
  },
  {
    id: "3",
    device: "Firefox on MacOS",
    location: "San Francisco, US",
    ip: "10.0.0.xxx",
    lastActive: "Yesterday",
    current: false,
  },
];

const securityEvents = [
  {
    id: "1",
    event: "Successful login",
    location: "New York, US",
    time: "Today, 9:30 AM",
    status: "success",
  },
  {
    id: "2",
    event: "Password changed",
    location: "New York, US",
    time: "Jun 5, 2024",
    status: "success",
  },
  {
    id: "3",
    event: "Failed login attempt",
    location: "Unknown",
    time: "Jun 1, 2024",
    status: "warning",
  },
  {
    id: "4",
    event: "New device login",
    location: "San Francisco, US",
    time: "May 28, 2024",
    status: "info",
  },
];

export default function SecurityPage() {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Security
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Manage your account security and authentication settings
        </p>
      </div>

      {/* Security Overview */}
      <Card className="border-violet-500/20 bg-gradient-to-r from-violet-500/5 to-purple-500/5">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-violet-500/10">
                <Shield className="h-8 w-8 text-violet-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Security Score: Good
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Your account is secure. Enable 2FA for maximum protection.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Badge
                variant="outline"
                className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
              >
                <Check className="h-3 w-3 mr-1" />
                Strong Password
              </Badge>
              <Badge
                variant="outline"
                className={
                  twoFactorEnabled
                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                    : "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
                }
              >
                {twoFactorEnabled ? (
                  <>
                    <Check className="h-3 w-3 mr-1" />
                    2FA Enabled
                  </>
                ) : (
                  <>
                    <X className="h-3 w-3 mr-1" />
                    2FA Disabled
                  </>
                )}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Password
          </CardTitle>
          <CardDescription>
            Manage your password and authentication
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50">
            <div>
              <p className="font-medium text-slate-900 dark:text-white">
                Password
              </p>
              <p className="text-sm text-slate-500">
                Last changed 30 days ago
              </p>
            </div>
            <Dialog
              open={isPasswordDialogOpen}
              onOpenChange={setIsPasswordDialogOpen}
            >
              <DialogTrigger asChild>
                <Button variant="outline">Change Password</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Change Password</DialogTitle>
                  <DialogDescription>
                    Enter your current password and choose a new one.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Current Password
                    </label>
                    <Input type="password" placeholder="Enter current password" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">New Password</label>
                    <Input type="password" placeholder="Enter new password" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Confirm New Password
                    </label>
                    <Input type="password" placeholder="Confirm new password" />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsPasswordDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button className="bg-violet-600 hover:bg-violet-700">
                    Update Password
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Two-Factor Authentication */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>
            Add an extra layer of security to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50">
            <div className="flex items-center gap-4">
              <div
                className={`p-2 rounded-lg ${twoFactorEnabled ? "bg-emerald-500/10" : "bg-yellow-500/10"}`}
              >
                <Lock
                  className={`h-5 w-5 ${twoFactorEnabled ? "text-emerald-600" : "text-yellow-600"}`}
                />
              </div>
              <div>
                <p className="font-medium text-slate-900 dark:text-white">
                  Authenticator App
                </p>
                <p className="text-sm text-slate-500">
                  {twoFactorEnabled
                    ? "Two-factor authentication is enabled"
                    : "Secure your account with an authenticator app"}
                </p>
              </div>
            </div>
            <Switch
              checked={twoFactorEnabled}
              onCheckedChange={setTwoFactorEnabled}
            />
          </div>
        </CardContent>
      </Card>

      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Active Sessions
              </CardTitle>
              <CardDescription>
                Manage devices where you&apos;re currently signed in
              </CardDescription>
            </div>
            <Button variant="outline" className="text-red-600 hover:text-red-700">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {activeSessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
                    <Monitor className="h-5 w-5 text-slate-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-900 dark:text-white">
                        {session.device}
                      </p>
                      {session.current && (
                        <Badge
                          variant="outline"
                          className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                        >
                          Current
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Globe className="h-3 w-3" />
                      <span>{session.location}</span>
                      <span>•</span>
                      <Clock className="h-3 w-3" />
                      <span>{session.lastActive}</span>
                    </div>
                  </div>
                </div>
                {!session.current && (
                  <Button variant="ghost" size="sm" className="text-red-600">
                    <LogOut className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Security Log */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Log
          </CardTitle>
          <CardDescription>
            Recent security-related activity on your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {securityEvents.map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-1.5 rounded-full ${
                      event.status === "success"
                        ? "bg-emerald-500/10"
                        : event.status === "warning"
                          ? "bg-yellow-500/10"
                          : "bg-blue-500/10"
                    }`}
                  >
                    {event.status === "success" ? (
                      <Check className="h-3 w-3 text-emerald-600" />
                    ) : event.status === "warning" ? (
                      <AlertTriangle className="h-3 w-3 text-yellow-600" />
                    ) : (
                      <Monitor className="h-3 w-3 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {event.event}
                    </p>
                    <p className="text-xs text-slate-500">{event.location}</p>
                  </div>
                </div>
                <span className="text-xs text-slate-500">{event.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Irreversible actions that affect your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800">
            <div>
              <p className="font-medium text-red-600">Delete Account</p>
              <p className="text-sm text-red-500">
                Permanently delete your account and all associated data
              </p>
            </div>
            <Button variant="destructive">Delete Account</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
