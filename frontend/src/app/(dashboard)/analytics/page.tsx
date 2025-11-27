"use client";

import { useState } from "react";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Search,
  FileText,
  Users,
  Clock,
  Calendar,
  Download,
  Filter,
  Brain,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const searchTrends = [
  { query: "product roadmap", count: 156, trend: "+23%" },
  { query: "customer feedback analysis", count: 134, trend: "+15%" },
  { query: "competitive research", count: 98, trend: "+8%" },
  { query: "Q2 planning docs", count: 87, trend: "-5%" },
  { query: "engineering specs", count: 76, trend: "+12%" },
];

const topContributors = [
  { name: "Sarah Chen", uploads: 45, searches: 234 },
  { name: "Mike Johnson", uploads: 38, searches: 189 },
  { name: "Emily Brown", uploads: 32, searches: 156 },
  { name: "John Doe", uploads: 28, searches: 201 },
  { name: "Alex Kim", uploads: 24, searches: 145 },
];

const weeklyActivity = [
  { day: "Mon", searches: 245, uploads: 12 },
  { day: "Tue", searches: 312, uploads: 18 },
  { day: "Wed", searches: 289, uploads: 15 },
  { day: "Thu", searches: 356, uploads: 22 },
  { day: "Fri", searches: 298, uploads: 14 },
  { day: "Sat", searches: 87, uploads: 3 },
  { day: "Sun", searches: 65, uploads: 2 },
];

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState("7d");

  const stats = [
    {
      title: "Total Searches",
      value: "12,847",
      change: "+23%",
      trend: "up",
      icon: Search,
      color: "violet",
    },
    {
      title: "Documents Indexed",
      value: "1,234",
      change: "+12%",
      trend: "up",
      icon: FileText,
      color: "blue",
    },
    {
      title: "Active Users",
      value: "89",
      change: "+8%",
      trend: "up",
      icon: Users,
      color: "emerald",
    },
    {
      title: "Avg. Response Time",
      value: "0.3s",
      change: "-15%",
      trend: "down",
      icon: Clock,
      color: "orange",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Analytics
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Track usage patterns and insights across your workspace
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-36">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24 hours</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const isUp = stat.trend === "up";
          const TrendIcon = stat.title === "Avg. Response Time" 
            ? (isUp ? TrendingDown : TrendingUp)
            : (isUp ? TrendingUp : TrendingDown);
          const trendColor = stat.title === "Avg. Response Time"
            ? "text-emerald-600"
            : isUp
              ? "text-emerald-600"
              : "text-red-600";

          return (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`p-2 rounded-lg bg-${stat.color}-500/10`}
                    style={{
                      backgroundColor:
                        stat.color === "violet"
                          ? "rgb(139 92 246 / 0.1)"
                          : stat.color === "blue"
                            ? "rgb(59 130 246 / 0.1)"
                            : stat.color === "emerald"
                              ? "rgb(16 185 129 / 0.1)"
                              : "rgb(249 115 22 / 0.1)",
                    }}
                  >
                    <Icon
                      className="h-5 w-5"
                      style={{
                        color:
                          stat.color === "violet"
                            ? "rgb(139 92 246)"
                            : stat.color === "blue"
                              ? "rgb(59 130 246)"
                              : stat.color === "emerald"
                                ? "rgb(16 185 129)"
                                : "rgb(249 115 22)",
                      }}
                    />
                  </div>
                  <div className={`flex items-center gap-1 text-sm ${trendColor}`}>
                    <TrendIcon className="h-3 w-3" />
                    {stat.change}
                  </div>
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {stat.value}
                </p>
                <p className="text-sm text-slate-500">{stat.title}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Weekly Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Weekly Activity
            </CardTitle>
            <CardDescription>
              Search and upload activity over the past week
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {weeklyActivity.map((day) => (
                <div key={day.day} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700 dark:text-slate-300 w-10">
                      {day.day}
                    </span>
                    <div className="flex gap-4 text-xs text-slate-500">
                      <span>{day.searches} searches</span>
                      <span>{day.uploads} uploads</span>
                    </div>
                  </div>
                  <div className="flex gap-1 h-2">
                    <div
                      className="bg-violet-500 rounded-full"
                      style={{ width: `${(day.searches / 400) * 100}%` }}
                    />
                    <div
                      className="bg-blue-500 rounded-full"
                      style={{ width: `${(day.uploads / 400) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
              <div className="flex gap-4 pt-2 border-t">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <div className="h-2 w-2 rounded-full bg-violet-500" />
                  Searches
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                  Uploads
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Insights */}
        <Card className="border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-purple-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-violet-600" />
              AI Insights
            </CardTitle>
            <CardDescription>
              Smart recommendations based on usage patterns
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-white dark:bg-slate-800 border">
              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded-full bg-violet-500/10">
                  <Zap className="h-4 w-4 text-violet-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    Popular topic emerging
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    &quot;AI implementation strategies&quot; searches increased 45% this
                    week. Consider creating a dedicated project.
                  </p>
                </div>
              </div>
            </div>
            <div className="p-4 rounded-lg bg-white dark:bg-slate-800 border">
              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded-full bg-emerald-500/10">
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    Knowledge gap detected
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    15 searches for &quot;onboarding documentation&quot; returned few
                    results. Consider adding more content.
                  </p>
                </div>
              </div>
            </div>
            <div className="p-4 rounded-lg bg-white dark:bg-slate-800 border">
              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded-full bg-blue-500/10">
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    Team engagement high
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    89% of team members actively searched this week. 12% above
                    average.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tables Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Searches */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Trending Searches
                </CardTitle>
                <CardDescription>
                  Most popular search queries this period
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm">
                <Filter className="h-4 w-4 mr-1" />
                Filter
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {searchTrends.map((item, index) => (
                <div
                  key={item.query}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-slate-400 w-4">
                      {index + 1}
                    </span>
                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                      {item.query}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-500">{item.count}</span>
                    <Badge
                      variant="outline"
                      className={
                        item.trend.startsWith("+")
                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                          : "bg-red-500/10 text-red-600 border-red-500/20"
                      }
                    >
                      {item.trend}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Contributors */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Top Contributors
            </CardTitle>
            <CardDescription>
              Most active team members this period
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topContributors.map((user, index) => (
                <div
                  key={user.name}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-medium">
                      {user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                      {user.name}
                    </span>
                    {index === 0 && (
                      <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                        Top
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-500">
                    <span className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {user.uploads}
                    </span>
                    <span className="flex items-center gap-1">
                      <Search className="h-3 w-3" />
                      {user.searches}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
