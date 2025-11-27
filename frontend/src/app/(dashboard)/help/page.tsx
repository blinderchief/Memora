"use client";

import { useState } from "react";
import {
  HelpCircle,
  Book,
  MessageCircle,
  Mail,
  ExternalLink,
  Search,
  ChevronRight,
  FileText,
  Video,
  Code,
  Zap,
  Users,
  Shield,
  Lightbulb,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const helpCategories = [
  {
    icon: Book,
    title: "Getting Started",
    description: "Learn the basics of Memora",
    articles: 12,
    color: "violet",
  },
  {
    icon: Search,
    title: "Search & Discovery",
    description: "Master the search features",
    articles: 8,
    color: "blue",
  },
  {
    icon: FileText,
    title: "Document Management",
    description: "Upload and organize content",
    articles: 15,
    color: "emerald",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description: "Work together effectively",
    articles: 10,
    color: "orange",
  },
  {
    icon: Code,
    title: "API & Integrations",
    description: "Connect your tools",
    articles: 20,
    color: "pink",
  },
  {
    icon: Shield,
    title: "Security & Privacy",
    description: "Protect your data",
    articles: 7,
    color: "cyan",
  },
];

const popularArticles = [
  {
    title: "How to upload your first document",
    category: "Getting Started",
    readTime: "3 min",
  },
  {
    title: "Understanding hybrid search",
    category: "Search & Discovery",
    readTime: "5 min",
  },
  {
    title: "Setting up team permissions",
    category: "Team Collaboration",
    readTime: "4 min",
  },
  {
    title: "Connecting Slack to Memora",
    category: "Integrations",
    readTime: "3 min",
  },
  {
    title: "Using API keys for automation",
    category: "API & Integrations",
    readTime: "6 min",
  },
];

const videoTutorials = [
  {
    title: "Memora Quick Start",
    duration: "5:23",
    thumbnail: "🎬",
  },
  {
    title: "Advanced Search Tips",
    duration: "8:45",
    thumbnail: "🔍",
  },
  {
    title: "Team Onboarding Guide",
    duration: "12:10",
    thumbnail: "👥",
  },
];

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="space-y-8">
      {/* Header with Search */}
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          How can we help you?
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mb-6">
          Search our knowledge base or browse categories below
        </p>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input
            placeholder="Search for articles, tutorials, or topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-12 text-lg"
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow cursor-pointer border-violet-500/20 bg-violet-500/5">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-violet-500/10">
              <MessageCircle className="h-6 w-6 text-violet-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">
                Live Chat
              </h3>
              <p className="text-sm text-slate-500">
                Chat with our support team
              </p>
            </div>
            <Badge className="ml-auto bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
              Online
            </Badge>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-500/10">
              <Mail className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">
                Email Support
              </h3>
              <p className="text-sm text-slate-500">support@memora.ai</p>
            </div>
            <ChevronRight className="h-5 w-5 text-slate-400 ml-auto" />
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-500/10">
              <Users className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">
                Community
              </h3>
              <p className="text-sm text-slate-500">Join our Discord</p>
            </div>
            <ExternalLink className="h-5 w-5 text-slate-400 ml-auto" />
          </CardContent>
        </Card>
      </div>

      {/* Help Categories */}
      <div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
          Browse by Category
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {helpCategories.map((category) => {
            const Icon = category.icon;
            return (
              <Card
                key={category.title}
                className="hover:shadow-md transition-shadow cursor-pointer group"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className="p-2 rounded-lg"
                      style={{
                        backgroundColor:
                          category.color === "violet"
                            ? "rgb(139 92 246 / 0.1)"
                            : category.color === "blue"
                              ? "rgb(59 130 246 / 0.1)"
                              : category.color === "emerald"
                                ? "rgb(16 185 129 / 0.1)"
                                : category.color === "orange"
                                  ? "rgb(249 115 22 / 0.1)"
                                  : category.color === "pink"
                                    ? "rgb(236 72 153 / 0.1)"
                                    : "rgb(6 182 212 / 0.1)",
                      }}
                    >
                      <Icon
                        className="h-5 w-5"
                        style={{
                          color:
                            category.color === "violet"
                              ? "rgb(139 92 246)"
                              : category.color === "blue"
                                ? "rgb(59 130 246)"
                                : category.color === "emerald"
                                  ? "rgb(16 185 129)"
                                  : category.color === "orange"
                                    ? "rgb(249 115 22)"
                                    : category.color === "pink"
                                      ? "rgb(236 72 153)"
                                      : "rgb(6 182 212)",
                        }}
                      />
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-slate-500 transition-colors" />
                  </div>
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                    {category.title}
                  </h3>
                  <p className="text-sm text-slate-500 mb-2">
                    {category.description}
                  </p>
                  <p className="text-xs text-slate-400">
                    {category.articles} articles
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Popular Articles & Video Tutorials */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Popular Articles */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              Popular Articles
            </CardTitle>
            <CardDescription>
              Most read articles this week
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {popularArticles.map((article) => (
                <div
                  key={article.title}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-slate-400" />
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white group-hover:text-violet-600 transition-colors">
                        {article.title}
                      </p>
                      <p className="text-xs text-slate-500">
                        {article.category}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400">
                    {article.readTime}
                  </span>
                </div>
              ))}
            </div>
            <Button variant="ghost" className="w-full mt-4">
              View all articles
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </CardContent>
        </Card>

        {/* Video Tutorials */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5 text-violet-500" />
              Video Tutorials
            </CardTitle>
            <CardDescription>
              Learn visually with our video guides
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {videoTutorials.map((video) => (
                <div
                  key={video.title}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group"
                >
                  <div className="w-16 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-2xl">
                    {video.thumbnail}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900 dark:text-white group-hover:text-violet-600 transition-colors">
                      {video.title}
                    </p>
                    <p className="text-xs text-slate-500">{video.duration}</p>
                  </div>
                  <div className="p-2 rounded-full bg-violet-500/10 group-hover:bg-violet-500 transition-colors">
                    <svg
                      className="h-4 w-4 text-violet-600 group-hover:text-white transition-colors"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="ghost" className="w-full mt-4">
              View all videos
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Status & Updates */}
      <Card className="border-dashed">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-emerald-500/10">
                <Zap className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  All Systems Operational
                </h3>
                <p className="text-sm text-slate-500">
                  Last updated: 2 minutes ago
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline">
                <ExternalLink className="h-4 w-4 mr-2" />
                Status Page
              </Button>
              <Button variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Release Notes
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Still Need Help? */}
      <Card className="bg-gradient-to-r from-violet-500/10 to-purple-500/10 border-violet-500/20">
        <CardContent className="p-8 text-center">
          <HelpCircle className="h-12 w-12 text-violet-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
            Still need help?
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md mx-auto">
            Our support team is available 24/7 to assist you with any questions
            or issues.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button className="bg-violet-600 hover:bg-violet-700">
              <MessageCircle className="h-4 w-4 mr-2" />
              Start Live Chat
            </Button>
            <Button variant="outline">
              <Mail className="h-4 w-4 mr-2" />
              Send Email
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
