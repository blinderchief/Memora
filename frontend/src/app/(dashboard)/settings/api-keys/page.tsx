"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Key,
  Plus,
  Copy,
  Eye,
  EyeOff,
  Trash2,
  MoreHorizontal,
  Check,
  AlertCircle,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ApiKey {
  id: string;
  name: string;
  key: string;
  createdAt: string;
  lastUsed: string | null;
  expiresAt: string | null;
  permissions: string[];
}

// Mock data
const mockApiKeys: ApiKey[] = [
  {
    id: "1",
    name: "Production API Key",
    key: "mem_prod_xxxxxxxxxxxxxxxxxxxx",
    createdAt: "2024-11-15",
    lastUsed: "2024-11-27",
    expiresAt: null,
    permissions: ["read", "write"],
  },
  {
    id: "2",
    name: "Development Key",
    key: "mem_dev_xxxxxxxxxxxxxxxxxxxx",
    createdAt: "2024-11-20",
    lastUsed: "2024-11-26",
    expiresAt: "2025-01-20",
    permissions: ["read"],
  },
];

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>(mockApiKeys);
  const [showNewKeyDialog, setShowNewKeyDialog] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyPermissions, setNewKeyPermissions] = useState("read");
  const [newKeyExpiry, setNewKeyExpiry] = useState("never");
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const toggleKeyVisibility = (id: string) => {
    const newVisible = new Set(visibleKeys);
    if (newVisible.has(id)) {
      newVisible.delete(id);
    } else {
      newVisible.add(id);
    }
    setVisibleKeys(newVisible);
  };

  const copyToClipboard = async (key: string, id: string) => {
    await navigator.clipboard.writeText(key);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const createApiKey = () => {
    const newKey = `mem_${newKeyPermissions === "read" ? "read" : "rw"}_${Math.random().toString(36).substring(2, 32)}`;
    setGeneratedKey(newKey);
    
    const newApiKey: ApiKey = {
      id: Math.random().toString(),
      name: newKeyName,
      key: newKey,
      createdAt: new Date().toISOString().split("T")[0],
      lastUsed: null,
      expiresAt: newKeyExpiry === "never" ? null : calculateExpiry(newKeyExpiry),
      permissions: newKeyPermissions === "read" ? ["read"] : ["read", "write"],
    };
    
    setApiKeys([...apiKeys, newApiKey]);
  };

  const deleteApiKey = (id: string) => {
    setApiKeys(apiKeys.filter((k) => k.id !== id));
  };

  const resetDialog = () => {
    setNewKeyName("");
    setNewKeyPermissions("read");
    setNewKeyExpiry("never");
    setGeneratedKey(null);
    setShowNewKeyDialog(false);
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">API Keys</h2>
          <p className="text-muted-foreground mt-1">
            Manage your API keys for programmatic access to Memora
          </p>
        </div>
        <Dialog open={showNewKeyDialog} onOpenChange={setShowNewKeyDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-violet-600 hover:bg-violet-700">
              <Plus className="h-4 w-4" />
              Create API Key
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            {!generatedKey ? (
              <>
                <DialogHeader>
                  <DialogTitle>Create New API Key</DialogTitle>
                  <DialogDescription>
                    Create a new API key for accessing the Memora API
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="keyName">Key Name</Label>
                    <Input
                      id="keyName"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      placeholder="e.g., Production API Key"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Permissions</Label>
                    <Select value={newKeyPermissions} onValueChange={setNewKeyPermissions}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="read">Read Only</SelectItem>
                        <SelectItem value="read-write">Read & Write</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Expiration</Label>
                    <Select value={newKeyExpiry} onValueChange={setNewKeyExpiry}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="never">Never</SelectItem>
                        <SelectItem value="30">30 days</SelectItem>
                        <SelectItem value="60">60 days</SelectItem>
                        <SelectItem value="90">90 days</SelectItem>
                        <SelectItem value="365">1 year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowNewKeyDialog(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={createApiKey}
                    disabled={!newKeyName}
                    className="bg-violet-600 hover:bg-violet-700"
                  >
                    Create Key
                  </Button>
                </DialogFooter>
              </>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500" />
                    API Key Created
                  </DialogTitle>
                  <DialogDescription>
                    Make sure to copy your API key now. You won&apos;t be able to see it again!
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-muted font-mono text-sm">
                    <code className="flex-1 break-all">{generatedKey}</code>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard(generatedKey, "new")}
                    >
                      {copiedKey === "new" ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-500">
                      This is the only time you&apos;ll see this key. Store it securely!
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={resetDialog} className="bg-violet-600 hover:bg-violet-700">
                    Done
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* API Keys List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your API Keys</CardTitle>
          <CardDescription>
            Keys are used to authenticate API requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          {apiKeys.length === 0 ? (
            <div className="text-center py-8">
              <Key className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium mb-1">No API keys yet</h3>
              <p className="text-sm text-muted-foreground">
                Create your first API key to get started
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {apiKeys.map((apiKey) => (
                <motion.div
                  key={apiKey.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between p-4 rounded-lg border border-border/50 hover:border-border transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{apiKey.name}</h4>
                      <div className="flex gap-1">
                        {apiKey.permissions.map((perm) => (
                          <Badge key={perm} variant="secondary" className="text-xs">
                            {perm}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <code className="font-mono">
                        {visibleKeys.has(apiKey.id)
                          ? apiKey.key
                          : apiKey.key.substring(0, 12) + "••••••••••••"}
                      </code>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Created {apiKey.createdAt}
                      </span>
                      {apiKey.lastUsed && (
                        <span>Last used {apiKey.lastUsed}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleKeyVisibility(apiKey.id)}
                    >
                      {visibleKeys.has(apiKey.id) ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard(apiKey.key, apiKey.id)}
                    >
                      {copiedKey === apiKey.id ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                        <DropdownMenuItem>Regenerate</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-500"
                          onClick={() => deleteApiKey(apiKey.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* API Usage */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">API Usage</CardTitle>
          <CardDescription>
            Your API usage for the current billing period
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Requests Today</p>
              <p className="text-2xl font-bold mt-1">1,234</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Requests This Month</p>
              <p className="text-2xl font-bold mt-1">45,678</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Monthly Limit</p>
              <p className="text-2xl font-bold mt-1">100,000</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function calculateExpiry(days: string): string {
  const date = new Date();
  date.setDate(date.getDate() + parseInt(days));
  return date.toISOString().split("T")[0];
}
