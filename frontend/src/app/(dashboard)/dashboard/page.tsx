"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Brain,
  Upload,
  Search,
  Clock,
  TrendingUp,
  FileText,
  Users,
  Zap,
  ArrowRight,
  ArrowUpRight,
  Sparkles,
  BarChart3,
  Calendar,
  Target,
  FolderKanban,
  MessageSquare,
  Timer,
  PlusCircle,
} from "lucide-react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

// Default mock stats - overridden when real data is available
const defaultStats = [
  {
    title: "Total Memories",
    value: "1,284",
    change: "+12%",
    trend: "up",
    icon: Brain,
    color: "violet",
    key: "memories",
  },
  {
    title: "Documents Processed",
    value: "342",
    change: "+8%",
    trend: "up",
    icon: FileText,
    color: "blue",
    key: "uploads",
  },
  {
    title: "Searches This Week",
    value: "156",
    change: "+24%",
    trend: "up",
    icon: Search,
    color: "green",
    key: "searches",
  },
  {
    title: "Team Members",
    value: "8",
    change: "+2",
    trend: "up",
    icon: Users,
    color: "orange",
  },
];

const recentActivity = [
  {
    id: 1,
    type: "upload",
    title: "Q4 Marketing Strategy.pdf",
    description: "Uploaded and processed 24 memories",
    time: "2 minutes ago",
    user: { name: "Sarah Chen", avatar: "" },
  },
  {
    id: 2,
    type: "search",
    title: "Project timeline for client X",
    description: "Found 12 relevant memories",
    time: "15 minutes ago",
    user: { name: "You", avatar: "" },
  },
  {
    id: 3,
    type: "memory",
    title: "New insight added",
    description: "Decision: Adopt new framework",
    time: "1 hour ago",
    user: { name: "Mike Johnson", avatar: "" },
  },
  {
    id: 4,
    type: "upload",
    title: "Research Notes.docx",
    description: "Uploaded and processed 18 memories",
    time: "3 hours ago",
    user: { name: "Emily Davis", avatar: "" },
  },
];

const quickActions = [
  {
    title: "Upload Document",
    description: "Add new knowledge to your memory",
    icon: Upload,
    href: "/upload",
    color: "violet",
  },
  {
    title: "Search Memories",
    description: "Find insights from your knowledge base",
    icon: Search,
    href: "/search",
    color: "blue",
  },
  {
    title: "View Timeline",
    description: "Browse memories chronologically",
    icon: Clock,
    href: "/timeline",
    color: "green",
  },
  {
    title: "Ask AI",
    description: "Get AI-powered insights",
    icon: Sparkles,
    href: "/search",
    color: "purple",
  },
];

const topProjects = [
  { name: "Q4 Marketing", memories: 234, progress: 85 },
  { name: "Product Roadmap", memories: 156, progress: 62 },
  { name: "Customer Research", memories: 98, progress: 45 },
];

interface Activity {
  id: string;
  action: string;
  details?: {
    filename?: string;
    query?: string;
    mode?: string;
    result_count?: number;
    session_type?: string;
    duration_minutes?: number;
    [key: string]: unknown;
  };
  created_at: string;
}

// Activity stats is a dynamic object with action names as keys
interface ActivityStats {
  [key: string]: number;
}

const getActivityIcon = (action: string) => {
  if (action.includes("search")) return Search;
  if (action.includes("upload")) return Upload;
  if (action.includes("chat")) return MessageSquare;
  if (action.includes("focus")) return Timer;
  if (action.includes("memory")) return Brain;
  return Sparkles;
};

const getActivityTitle = (activity: Activity): string => {
  const { action, details } = activity;
  if (action === "search" && details?.query) return `Searched: "${details.query}"`;
  if (action === "upload" && details?.filename) return `Uploaded: ${details.filename}`;
  if (action === "chat") return "AI Chat Message";
  if (action === "focus_start") return `Started Focus: ${details?.session_type || "session"}`;
  if (action === "focus_complete") return `Completed Focus: ${details?.duration_minutes || 0} mins`;
  if (action === "memory_create") return "Created Memory";
  if (action === "memory_delete") return "Deleted Memory";
  return action.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
};

const getActivityDescription = (activity: Activity): string => {
  const { action, details } = activity;
  if (action === "search" && details?.result_count !== undefined) {
    return `Found ${details.result_count} results (${details.mode || "auto"} mode)`;
  }
  if (action === "upload" && details?.chunks_created !== undefined) {
    return `Created ${details.chunks_created} memory chunks`;
  }
  if (action === "focus_start" && details?.topic) {
    return `Topic: ${details.topic}`;
  }
  return "";
};

export default function DashboardPage() {
  const { user } = useUser();
  const greeting = getGreeting();
  
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activityStats, setActivityStats] = useState<ActivityStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchActivityData = async () => {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      
      try {
        const [activitiesRes, statsRes] = await Promise.all([
          fetch(`${baseUrl}/api/activity/recent?limit=10`),
          fetch(`${baseUrl}/api/activity/stats?days=7`),
        ]);
        
        if (activitiesRes.ok) {
          const data = await activitiesRes.json();
          setActivities(data);
        }
        
        if (statsRes.ok) {
          const data = await statsRes.json();
          setActivityStats(data);
        }
      } catch (error) {
        console.error("Failed to fetch activity data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchActivityData();
  }, []);

  return (
    <div className="p-6 space-y-8">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold tracking-tight"
          >
            {greeting}, {user?.firstName || "there"}! 👋
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground mt-1"
          >
            Here&apos;s what&apos;s happening with your knowledge base today.
          </motion.p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <Calendar className="h-4 w-4" />
            This Week
          </Button>
          <Button className="gap-2 bg-violet-600 hover:bg-violet-700">
            <Upload className="h-4 w-4" />
            Upload Document
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
      >
        {(() => {
          // Compute stats with real data when available
          const computedStats = defaultStats.map((stat) => {
            if (!activityStats) return stat;
            
            switch (stat.key) {
              case "searches":
                // Backend returns "search" not "searches"
                return { ...stat, value: (activityStats["search"] || 0).toString() };
              case "uploads":
                // Backend returns "upload" not "uploads"
                return { ...stat, value: (activityStats["upload"] || 0).toString() };
              default:
                return stat;
            }
          });
          
          return computedStats.map((stat) => (
            <Card key={stat.title} className="relative overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div
                    className={`p-2 rounded-lg bg-${stat.color}-500/10 border border-${stat.color}-500/20`}
                  >
                    <stat.icon className={`h-5 w-5 text-${stat.color}-500`} />
                  </div>
                  <Badge
                    variant="secondary"
                    className={`gap-1 ${
                      stat.trend === "up"
                        ? "text-green-500 bg-green-500/10"
                        : "text-red-500 bg-red-500/10"
                    }`}
                  >
                    <TrendingUp className="h-3 w-3" />
                    {stat.change}
                  </Badge>
                </div>
                <div className="mt-4">
                  <h3 className="text-3xl font-bold">{stat.value}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{stat.title}</p>
                </div>
              </CardContent>
            </Card>
          ));
        })()}
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-violet-500" />
                Quick Actions
              </CardTitle>
              <CardDescription>
                Common tasks to help you get started
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                {quickActions.map((action) => (
                  <Link key={action.title} href={action.href}>
                    <div className="group flex items-center gap-4 p-4 rounded-xl border border-border/50 hover:border-violet-500/50 hover:bg-violet-500/5 transition-all cursor-pointer">
                      <div
                        className={`p-3 rounded-lg bg-${action.color}-500/10 border border-${action.color}-500/20 group-hover:scale-110 transition-transform`}
                      >
                        <action.icon className={`h-5 w-5 text-${action.color}-500`} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium group-hover:text-violet-500 transition-colors">
                          {action.title}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {action.description}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-violet-500 group-hover:translate-x-1 transition-all" />
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Storage Usage */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-violet-500" />
                Storage Usage
              </CardTitle>
              <CardDescription>Your memory storage overview</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Used</span>
                  <span className="text-sm font-medium">4.2 GB / 10 GB</span>
                </div>
                <Progress value={42} className="h-2" />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-violet-500" />
                    <span>Documents</span>
                  </div>
                  <span className="text-muted-foreground">2.1 GB</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span>Embeddings</span>
                  </div>
                  <span className="text-muted-foreground">1.5 GB</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span>Metadata</span>
                  </div>
                  <span className="text-muted-foreground">0.6 GB</span>
                </div>
              </div>

              <Button variant="outline" className="w-full gap-2">
                <Zap className="h-4 w-4" />
                Upgrade for More Storage
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Bottom Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-violet-500" />
                  Recent Activity
                </CardTitle>
                <CardDescription>Latest actions in your workspace</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="gap-1">
                View All
                <ArrowUpRight className="h-3 w-3" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isLoading ? (
                  // Loading skeletons
                  [...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-start gap-4 p-3">
                      <Skeleton className="h-9 w-9 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))
                ) : activities.length > 0 ? (
                  activities.slice(0, 5).map((activity) => {
                    const ActivityIcon = getActivityIcon(activity.action);
                    return (
                      <div
                        key={activity.id}
                        className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-500/10">
                          <ActivityIcon className="h-4 w-4 text-violet-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {getActivityTitle(activity)}
                          </p>
                          {getActivityDescription(activity) && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {getActivityDescription(activity)}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  // Fallback to mock data if no real activities
                  recentActivity.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={activity.user.avatar} />
                        <AvatarFallback>
                          {activity.user.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{activity.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {activity.description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {activity.user.name} • {activity.time}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Top Projects */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-violet-500" />
                  Top Projects
                </CardTitle>
                <CardDescription>Projects with most memories</CardDescription>
              </div>
              <Link href="/projects">
                <Button variant="ghost" size="sm" className="gap-1">
                  View All
                  <ArrowUpRight className="h-3 w-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topProjects.map((project) => (
                  <div key={project.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{project.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {project.memories} memories
                      </span>
                    </div>
                    <Progress value={project.progress} className="h-2" />
                  </div>
                ))}
              </div>

              <Button variant="outline" className="w-full mt-6 gap-2">
                <FolderKanban className="h-4 w-4" />
                Create New Project
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* AI Insights Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Card className="bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-pink-500/10 border-violet-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-violet-500/20">
                  <Sparkles className="h-6 w-6 text-violet-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">AI-Powered Insights Available</h3>
                  <p className="text-muted-foreground">
                    Based on your recent activity, we found 3 potential connections you might have missed.
                  </p>
                </div>
              </div>
              <Button className="bg-violet-600 hover:bg-violet-700 gap-2">
                <Sparkles className="h-4 w-4" />
                View Insights
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}
