"use client";

import { useState } from "react";
import {
  Webhook,
  Plus,
  MoreVertical,
  Check,
  X,
  Clock,
  Copy,
  Trash2,
  RefreshCw,
  Code,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface WebhookType {
  id: string;
  name: string;
  url: string;
  events: string[];
  status: "active" | "inactive" | "error";
  lastTriggered?: string;
  successRate: number;
}

const webhooks: WebhookType[] = [
  {
    id: "1",
    name: "Slack Notification",
    url: "https://hooks.slack.com/services/xxx",
    events: ["memory.created", "memory.updated"],
    status: "active",
    lastTriggered: "2024-06-10T14:30:00Z",
    successRate: 100,
  },
  {
    id: "2",
    name: "CRM Integration",
    url: "https://api.mycrm.com/webhooks/memora",
    events: ["memory.created", "search.performed"],
    status: "active",
    lastTriggered: "2024-06-10T12:00:00Z",
    successRate: 98,
  },
  {
    id: "3",
    name: "Analytics Pipeline",
    url: "https://analytics.internal/ingest",
    events: ["memory.created", "memory.deleted"],
    status: "error",
    lastTriggered: "2024-06-09T10:00:00Z",
    successRate: 45,
  },
];

const availableEvents = [
  { id: "memory.created", name: "Memory Created", description: "When a new memory is added" },
  { id: "memory.updated", name: "Memory Updated", description: "When a memory is modified" },
  { id: "memory.deleted", name: "Memory Deleted", description: "When a memory is removed" },
  { id: "search.performed", name: "Search Performed", description: "When a search query is executed" },
  { id: "document.ingested", name: "Document Ingested", description: "When a document is processed" },
  { id: "team.member_added", name: "Team Member Added", description: "When someone joins the team" },
];

export default function WebhooksPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookName, setWebhookName] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);

  const toggleEvent = (eventId: string) => {
    setSelectedEvents((prev) =>
      prev.includes(eventId)
        ? prev.filter((e) => e !== eventId)
        : [...prev, eventId]
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge
            variant="outline"
            className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
          >
            <Check className="h-3 w-3 mr-1" />
            Active
          </Badge>
        );
      case "error":
        return (
          <Badge
            variant="outline"
            className="bg-red-500/10 text-red-600 border-red-500/20"
          >
            <X className="h-3 w-3 mr-1" />
            Error
          </Badge>
        );
      default:
        return (
          <Badge
            variant="outline"
            className="bg-slate-500/10 text-slate-600 border-slate-500/20"
          >
            Inactive
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Webhooks
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Send real-time notifications to external services
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-violet-600 hover:bg-violet-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Webhook
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Webhook</DialogTitle>
              <DialogDescription>
                Configure a new webhook endpoint to receive event notifications.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Webhook Name
                </label>
                <Input
                  placeholder="My Integration"
                  value={webhookName}
                  onChange={(e) => setWebhookName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Endpoint URL
                </label>
                <Input
                  placeholder="https://your-service.com/webhook"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                />
                <p className="text-xs text-slate-500">
                  We&apos;ll send a POST request to this URL for each event.
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Events
                </label>
                <div className="grid gap-2 max-h-48 overflow-y-auto p-1">
                  {availableEvents.map((event) => (
                    <button
                      key={event.id}
                      onClick={() => toggleEvent(event.id)}
                      className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                        selectedEvents.includes(event.id)
                          ? "border-violet-500 bg-violet-500/5"
                          : "border-slate-200 dark:border-slate-700 hover:border-slate-300"
                      }`}
                    >
                      <div
                        className={`h-4 w-4 rounded border flex items-center justify-center ${
                          selectedEvents.includes(event.id)
                            ? "bg-violet-500 border-violet-500"
                            : "border-slate-300 dark:border-slate-600"
                        }`}
                      >
                        {selectedEvents.includes(event.id) && (
                          <Check className="h-3 w-3 text-white" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                          {event.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {event.description}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => setIsCreateOpen(false)}
                disabled={!webhookUrl || !webhookName || selectedEvents.length === 0}
                className="bg-violet-600 hover:bg-violet-700"
              >
                Create Webhook
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-violet-500/10">
                <Webhook className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {webhooks.length}
                </p>
                <p className="text-xs text-slate-500">Total Webhooks</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <Check className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  1,234
                </p>
                <p className="text-xs text-slate-500">Successful Deliveries</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <RefreshCw className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  98%
                </p>
                <p className="text-xs text-slate-500">Success Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Webhooks List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Webhook className="h-5 w-5" />
            Your Webhooks
          </CardTitle>
          <CardDescription>
            Manage your webhook endpoints and event subscriptions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {webhooks.map((webhook) => (
              <div
                key={webhook.id}
                className="py-4 first:pt-0 last:pb-0"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h4 className="font-medium text-slate-900 dark:text-white">
                        {webhook.name}
                      </h4>
                      {getStatusBadge(webhook.status)}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-500 font-mono bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded">
                      <Code className="h-3 w-3" />
                      <span className="truncate max-w-md">{webhook.url}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={() => navigator.clipboard.writeText(webhook.url)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {webhook.events.map((event) => (
                        <Badge
                          key={event}
                          variant="secondary"
                          className="text-xs"
                        >
                          {event}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      {webhook.lastTriggered && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Last triggered:{" "}
                          {new Date(webhook.lastTriggered).toLocaleString()}
                        </span>
                      )}
                      <span
                        className={
                          webhook.successRate >= 90
                            ? "text-emerald-600"
                            : webhook.successRate >= 70
                              ? "text-yellow-600"
                              : "text-red-600"
                        }
                      >
                        {webhook.successRate}% success rate
                      </span>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Test Webhook
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Code className="h-4 w-4 mr-2" />
                        View Logs
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Edit Settings
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600 focus:text-red-600">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Webhook
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Documentation */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-600">
            <Code className="h-5 w-5" />
            Webhook Documentation
          </CardTitle>
          <CardDescription>
            Learn how to integrate with Memora webhooks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Button variant="outline">
              <ExternalLink className="h-4 w-4 mr-2" />
              View Documentation
            </Button>
            <Button variant="outline">
              <Code className="h-4 w-4 mr-2" />
              Example Payloads
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
