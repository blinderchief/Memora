"use client";

import { useState } from "react";
import {
  Plug,
  Check,
  ExternalLink,
  Settings,
  Trash2,
  Plus,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  connected: boolean;
  lastSync?: string;
  status?: "active" | "error" | "syncing";
}

const integrations: Integration[] = [
  {
    id: "slack",
    name: "Slack",
    description: "Sync messages and files from Slack channels",
    icon: "🔔",
    category: "Communication",
    connected: true,
    lastSync: "2024-06-10T14:30:00Z",
    status: "active",
  },
  {
    id: "notion",
    name: "Notion",
    description: "Import pages and databases from Notion workspaces",
    icon: "📝",
    category: "Documentation",
    connected: true,
    lastSync: "2024-06-10T12:00:00Z",
    status: "active",
  },
  {
    id: "google-drive",
    name: "Google Drive",
    description: "Sync documents, spreadsheets, and presentations",
    icon: "📁",
    category: "Storage",
    connected: false,
  },
  {
    id: "github",
    name: "GitHub",
    description: "Index repositories, issues, and documentation",
    icon: "🐙",
    category: "Development",
    connected: true,
    lastSync: "2024-06-10T15:00:00Z",
    status: "syncing",
  },
  {
    id: "confluence",
    name: "Confluence",
    description: "Import wiki pages and documentation",
    icon: "📘",
    category: "Documentation",
    connected: false,
  },
  {
    id: "jira",
    name: "Jira",
    description: "Sync issues, projects, and sprint data",
    icon: "🎯",
    category: "Project Management",
    connected: false,
  },
  {
    id: "linear",
    name: "Linear",
    description: "Connect issues, projects, and team workflows",
    icon: "⚡",
    category: "Project Management",
    connected: false,
  },
  {
    id: "dropbox",
    name: "Dropbox",
    description: "Sync files and folders from Dropbox",
    icon: "📦",
    category: "Storage",
    connected: false,
  },
  {
    id: "microsoft-teams",
    name: "Microsoft Teams",
    description: "Sync conversations and shared files",
    icon: "💬",
    category: "Communication",
    connected: false,
  },
  {
    id: "figma",
    name: "Figma",
    description: "Index design files and comments",
    icon: "🎨",
    category: "Design",
    connected: false,
  },
];

const categories = [
  "All",
  "Communication",
  "Documentation",
  "Storage",
  "Development",
  "Project Management",
  "Design",
];

export default function IntegrationsPage() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [autoSync, setAutoSync] = useState(true);

  const filteredIntegrations =
    selectedCategory === "All"
      ? integrations
      : integrations.filter((i) => i.category === selectedCategory);

  const connectedCount = integrations.filter((i) => i.connected).length;

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "active":
        return (
          <Badge
            variant="outline"
            className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
          >
            <Check className="h-3 w-3 mr-1" />
            Connected
          </Badge>
        );
      case "syncing":
        return (
          <Badge
            variant="outline"
            className="bg-blue-500/10 text-blue-600 border-blue-500/20"
          >
            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
            Syncing
          </Badge>
        );
      case "error":
        return (
          <Badge
            variant="outline"
            className="bg-red-500/10 text-red-600 border-red-500/20"
          >
            Error
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Integrations
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Connect your favorite tools to sync knowledge automatically
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-violet-500/10">
                <Plug className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {connectedCount}
                </p>
                <p className="text-xs text-slate-500">Connected</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <RefreshCw className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  1,234
                </p>
                <p className="text-xs text-slate-500">Items Synced Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Settings className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    Auto-sync
                  </p>
                  <p className="text-xs text-slate-500">Every 15 minutes</p>
                </div>
              </div>
              <Switch checked={autoSync} onCheckedChange={setAutoSync} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(category)}
            className={
              selectedCategory === category
                ? "bg-violet-600 hover:bg-violet-700"
                : ""
            }
          >
            {category}
          </Button>
        ))}
      </div>

      {/* Integrations Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredIntegrations.map((integration) => (
          <Card
            key={integration.id}
            className={
              integration.connected
                ? "border-violet-500/20 bg-violet-500/5"
                : ""
            }
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{integration.icon}</div>
                  <div>
                    <CardTitle className="text-base">
                      {integration.name}
                    </CardTitle>
                    <Badge variant="secondary" className="text-xs mt-1">
                      {integration.category}
                    </Badge>
                  </div>
                </div>
                {getStatusBadge(integration.status)}
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">
                {integration.description}
              </CardDescription>

              {integration.connected ? (
                <div className="space-y-3">
                  {integration.lastSync && (
                    <p className="text-xs text-slate-500">
                      Last synced:{" "}
                      {new Date(integration.lastSync).toLocaleString()}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Settings className="h-3 w-3 mr-1" />
                      Configure
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ) : (
                <Button className="w-full bg-violet-600 hover:bg-violet-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Connect
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Coming Soon */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-600">
            <Plug className="h-5 w-5" />
            Request an Integration
          </CardTitle>
          <CardDescription>
            Don&apos;t see an integration you need? Let us know and we&apos;ll add it to
            our roadmap.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline">
            <ExternalLink className="h-4 w-4 mr-2" />
            Request Integration
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
