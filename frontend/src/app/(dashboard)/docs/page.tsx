"use client";

import { useState } from "react";
import {
  BookOpen,
  Search,
  Code,
  Key,
  Database,
  Upload,
  Zap,
  ChevronRight,
  Copy,
  Check,
  ExternalLink,
  Terminal,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const apiEndpoints = [
  {
    method: "POST",
    path: "/api/v1/search",
    description: "Perform a semantic search across your knowledge base",
    category: "Search",
  },
  {
    method: "POST",
    path: "/api/v1/memories",
    description: "Create a new memory entry",
    category: "Memories",
  },
  {
    method: "GET",
    path: "/api/v1/memories/{id}",
    description: "Retrieve a specific memory by ID",
    category: "Memories",
  },
  {
    method: "POST",
    path: "/api/v1/ingest",
    description: "Upload and process a document",
    category: "Ingestion",
  },
  {
    method: "GET",
    path: "/api/v1/documents",
    description: "List all documents in your workspace",
    category: "Documents",
  },
  {
    method: "DELETE",
    path: "/api/v1/memories/{id}",
    description: "Delete a memory entry",
    category: "Memories",
  },
];

const sdkLanguages = [
  { name: "Python", icon: "🐍", status: "stable" },
  { name: "JavaScript", icon: "📜", status: "stable" },
  { name: "TypeScript", icon: "🔷", status: "stable" },
  { name: "Go", icon: "🔵", status: "beta" },
  { name: "Ruby", icon: "💎", status: "coming" },
];

const codeExamples = {
  python: `from memora import Memora

client = Memora(api_key="your_api_key")

# Search for memories
results = client.search(
    query="product roadmap Q4",
    limit=10,
    filters={"project": "engineering"}
)

for result in results:
    print(f"[{result.score:.2f}] {result.title}")`,
  javascript: `import { Memora } from '@memora/sdk';

const client = new Memora({ apiKey: 'your_api_key' });

// Search for memories
const results = await client.search({
  query: 'product roadmap Q4',
  limit: 10,
  filters: { project: 'engineering' }
});

results.forEach(result => {
  console.log(\`[\${result.score.toFixed(2)}] \${result.title}\`);
});`,
  curl: `curl -X POST https://api.memora.ai/v1/search \\
  -H "Authorization: Bearer your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "query": "product roadmap Q4",
    "limit": 10,
    "filters": {
      "project": "engineering"
    }
  }'`,
};

const quickStartSteps = [
  {
    step: 1,
    title: "Get your API key",
    description: "Generate an API key from your settings page",
  },
  {
    step: 2,
    title: "Install the SDK",
    description: "Install our SDK for your preferred language",
  },
  {
    step: 3,
    title: "Make your first request",
    description: "Use the examples below to get started",
  },
];

export default function DocsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [copied, setCopied] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<"python" | "javascript" | "curl">("python");

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case "GET":
        return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
      case "POST":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "PUT":
        return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
      case "DELETE":
        return "bg-red-500/10 text-red-600 border-red-500/20";
      default:
        return "bg-slate-500/10 text-slate-600 border-slate-500/20";
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            API Documentation
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Everything you need to integrate with Memora
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <ExternalLink className="h-4 w-4 mr-2" />
            Full Docs
          </Button>
          <Button className="bg-violet-600 hover:bg-violet-700">
            <Key className="h-4 w-4 mr-2" />
            Get API Key
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-xl">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search documentation..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Quick Start */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Quick Start
          </CardTitle>
          <CardDescription>
            Get up and running in under 5 minutes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6 mb-6">
            {quickStartSteps.map((item) => (
              <div key={item.step} className="flex gap-4">
                <div className="h-8 w-8 rounded-full bg-violet-500/10 flex items-center justify-center text-violet-600 font-semibold text-sm shrink-0">
                  {item.step}
                </div>
                <div>
                  <h4 className="font-medium text-slate-900 dark:text-white">
                    {item.title}
                  </h4>
                  <p className="text-sm text-slate-500">{item.description}</p>
                </div>
              </div>
            ))}
          </div>

          <Tabs value={selectedLanguage} onValueChange={(v) => setSelectedLanguage(v as typeof selectedLanguage)}>
            <div className="flex items-center justify-between mb-4">
              <TabsList>
                <TabsTrigger value="python">Python</TabsTrigger>
                <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                <TabsTrigger value="curl">cURL</TabsTrigger>
              </TabsList>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyCode(codeExamples[selectedLanguage])}
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-1" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            {(["python", "javascript", "curl"] as const).map((lang) => (
              <TabsContent key={lang} value={lang}>
                <div className="relative rounded-lg bg-slate-900 p-4 overflow-x-auto">
                  <pre className="text-sm text-slate-300 font-mono">
                    <code>{codeExamples[lang]}</code>
                  </pre>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* SDKs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Official SDKs
          </CardTitle>
          <CardDescription>
            Use our official libraries for the best developer experience
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-5">
            {sdkLanguages.map((sdk) => (
              <div
                key={sdk.name}
                className="flex items-center gap-3 p-4 rounded-lg border hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
              >
                <span className="text-2xl">{sdk.icon}</span>
                <div className="flex-1">
                  <p className="font-medium text-slate-900 dark:text-white">
                    {sdk.name}
                  </p>
                  <Badge
                    variant="outline"
                    className={
                      sdk.status === "stable"
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                        : sdk.status === "beta"
                          ? "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
                          : "bg-slate-500/10 text-slate-600 border-slate-500/20"
                    }
                  >
                    {sdk.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* API Endpoints */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Terminal className="h-5 w-5" />
            API Endpoints
          </CardTitle>
          <CardDescription>
            RESTful API endpoints for all operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {apiEndpoints.map((endpoint) => (
              <div
                key={endpoint.path}
                className="flex items-center justify-between py-4 first:pt-0 last:pb-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 -mx-4 px-4 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-4">
                  <Badge
                    variant="outline"
                    className={`w-16 justify-center ${getMethodColor(endpoint.method)}`}
                  >
                    {endpoint.method}
                  </Badge>
                  <code className="text-sm font-mono text-slate-900 dark:text-white">
                    {endpoint.path}
                  </code>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-slate-500 hidden md:block">
                    {endpoint.description}
                  </span>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </div>
              </div>
            ))}
          </div>
          <Button variant="ghost" className="w-full mt-4">
            View all endpoints
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </CardContent>
      </Card>

      {/* Resources */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-6">
            <div className="p-3 rounded-xl bg-violet-500/10 w-fit mb-4">
              <BookOpen className="h-6 w-6 text-violet-600" />
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
              Guides & Tutorials
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              Step-by-step guides for common use cases
            </p>
            <Button variant="ghost" size="sm" className="p-0">
              Browse guides
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-6">
            <div className="p-3 rounded-xl bg-blue-500/10 w-fit mb-4">
              <Database className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
              API Reference
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              Complete API documentation with examples
            </p>
            <Button variant="ghost" size="sm" className="p-0">
              View reference
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-6">
            <div className="p-3 rounded-xl bg-emerald-500/10 w-fit mb-4">
              <Upload className="h-6 w-6 text-emerald-600" />
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
              Changelog
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              Latest updates and API changes
            </p>
            <Button variant="ghost" size="sm" className="p-0">
              See updates
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Need Help */}
      <Card className="border-dashed">
        <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
              Need help with integration?
            </h3>
            <p className="text-sm text-slate-500">
              Our developer support team is here to help you succeed.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline">
              Join Discord
              <ExternalLink className="h-4 w-4 ml-2" />
            </Button>
            <Button className="bg-violet-600 hover:bg-violet-700">
              Contact Support
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
