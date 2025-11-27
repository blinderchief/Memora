"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  TrendingUp,
  Lightbulb,
  AlertCircle,
  Calendar,
  Brain,
  Target,
  Zap,
  RefreshCw,
  ChevronRight,
  Clock,
  BookOpen,
  Network,
  ArrowUpRight,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

interface Insight {
  id: string;
  insight_type: string;
  title: string;
  description: string;
  confidence: number;
  memory_ids: string[];
  is_actionable: boolean;
  created_at: string;
}

interface Pattern {
  pattern_type: string;
  description: string;
  strength: number;
  memory_count: number;
  examples: string[];
}

interface LearningSummary {
  period: string;
  key_topics: string[];
  new_concepts: number;
  connections_made: number;
  growth_areas: string[];
}

const insightTypeIcons: Record<string, typeof Sparkles> = {
  pattern: TrendingUp,
  connection: Network,
  gap: AlertCircle,
  opportunity: Lightbulb,
  trend: BarChart3,
};

const insightTypeColors: Record<string, string> = {
  pattern: "bg-blue-500/10 text-blue-500",
  connection: "bg-purple-500/10 text-purple-500",
  gap: "bg-orange-500/10 text-orange-500",
  opportunity: "bg-green-500/10 text-green-500",
  trend: "bg-pink-500/10 text-pink-500",
};

export default function InsightsPage() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [summary, setSummary] = useState<LearningSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    setIsLoading(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      
      // Fetch patterns
      const patternsRes = await fetch(`${baseUrl}/api/intelligence/insights/patterns?days=30`);
      if (patternsRes.ok) {
        const data = await patternsRes.json();
        setPatterns(data.patterns || []);
      }

      // For demo, create some mock insights
      setInsights([
        {
          id: "1",
          insight_type: "pattern",
          title: "Learning Pattern Detected",
          description: "You tend to create more memories about technical topics on weekday mornings. Consider scheduling deep learning sessions during this time.",
          confidence: 0.85,
          memory_ids: [],
          is_actionable: true,
          created_at: new Date().toISOString(),
        },
        {
          id: "2",
          insight_type: "connection",
          title: "Hidden Connection Found",
          description: "Your notes on productivity techniques share concepts with your project management memories. Consider creating a unified system.",
          confidence: 0.78,
          memory_ids: [],
          is_actionable: true,
          created_at: new Date().toISOString(),
        },
        {
          id: "3",
          insight_type: "gap",
          title: "Knowledge Gap Identified",
          description: "You've been learning React but have no memories about testing. Consider adding notes on React Testing Library.",
          confidence: 0.72,
          memory_ids: [],
          is_actionable: true,
          created_at: new Date().toISOString(),
        },
      ]);

      setSummary({
        period: "Last 7 days",
        key_topics: ["Machine Learning", "React", "System Design", "Leadership"],
        new_concepts: 12,
        connections_made: 8,
        growth_areas: ["AI/ML", "Frontend Development"],
      });
    } catch (error) {
      console.error("Failed to fetch insights:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateNewInsights = async () => {
    setIsGenerating(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      
      const response = await fetch(`${baseUrl}/api/intelligence/insights/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days: 30, limit: 10 }),
      });

      if (response.ok) {
        await fetchInsights();
      }
    } catch (error) {
      console.error("Failed to generate insights:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">AI Insights</h1>
            <p className="text-muted-foreground">
              Discover patterns and connections in your knowledge
            </p>
          </div>
        </div>
        <Button onClick={generateNewInsights} disabled={isGenerating}>
          {isGenerating ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Zap className="h-4 w-4 mr-2" />
          )}
          Generate Insights
        </Button>
      </div>

      {/* Quick Stats */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10">
                    <Brain className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{summary.new_concepts}</p>
                    <p className="text-sm text-muted-foreground">New Concepts</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10">
                    <Network className="h-6 w-6 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{summary.connections_made}</p>
                    <p className="text-sm text-muted-foreground">Connections</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/10">
                    <Target className="h-6 w-6 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{summary.key_topics.length}</p>
                    <p className="text-sm text-muted-foreground">Key Topics</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/10">
                    <TrendingUp className="h-6 w-6 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{summary.growth_areas.length}</p>
                    <p className="text-sm text-muted-foreground">Growth Areas</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Main Content */}
      <Tabs defaultValue="insights" className="space-y-6">
        <TabsList>
          <TabsTrigger value="insights" className="gap-2">
            <Lightbulb className="h-4 w-4" />
            Insights
          </TabsTrigger>
          <TabsTrigger value="patterns" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Patterns
          </TabsTrigger>
          <TabsTrigger value="summary" className="gap-2">
            <BookOpen className="h-4 w-4" />
            Learning Summary
          </TabsTrigger>
        </TabsList>

        <TabsContent value="insights" className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <Skeleton className="h-4 w-1/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : insights.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">No insights yet</h3>
                <p className="text-muted-foreground mb-4">
                  Click &quot;Generate Insights&quot; to analyze your memories
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {insights.map((insight, index) => {
                const Icon = insightTypeIcons[insight.insight_type] || Sparkles;
                const colorClass = insightTypeColors[insight.insight_type] || "bg-gray-500/10 text-gray-500";
                
                return (
                  <motion.div
                    key={insight.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="hover:shadow-md transition-shadow cursor-pointer group">
                      <CardContent className="pt-6">
                        <div className="flex gap-4">
                          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${colorClass}`}>
                            <Icon className="h-6 w-6" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold">{insight.title}</h3>
                                  {insight.is_actionable && (
                                    <Badge variant="secondary" className="text-xs">
                                      Actionable
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {insight.description}
                                </p>
                                <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    Just now
                                  </span>
                                  <span>
                                    {Math.round(insight.confidence * 100)}% confidence
                                  </span>
                                </div>
                              </div>
                              <ChevronRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="patterns" className="space-y-4">
          {patterns.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">No patterns detected yet</h3>
                <p className="text-muted-foreground">
                  Add more memories to discover patterns in your knowledge
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {patterns.map((pattern, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg capitalize">
                        {pattern.pattern_type} Pattern
                      </CardTitle>
                      <CardDescription>{pattern.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Pattern Strength</span>
                            <span>{Math.round(pattern.strength * 100)}%</span>
                          </div>
                          <Progress value={pattern.strength * 100} />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Found in {pattern.memory_count} memories
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="summary">
          {summary ? (
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Key Topics
                  </CardTitle>
                  <CardDescription>Topics you&apos;re focusing on</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {summary.key_topics.map((topic, idx) => (
                      <Badge key={idx} variant="secondary">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ArrowUpRight className="h-5 w-5" />
                    Growth Areas
                  </CardTitle>
                  <CardDescription>Areas showing rapid growth</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {summary.growth_areas.map((area, idx) => (
                      <Badge key={idx} variant="outline" className="bg-green-500/10 text-green-600">
                        {area}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    {summary.period}
                  </CardTitle>
                  <CardDescription>Your learning activity summary</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div className="p-4 rounded-xl bg-muted/50">
                      <p className="text-3xl font-bold text-blue-500">{summary.new_concepts}</p>
                      <p className="text-sm text-muted-foreground">New Concepts</p>
                    </div>
                    <div className="p-4 rounded-xl bg-muted/50">
                      <p className="text-3xl font-bold text-purple-500">{summary.connections_made}</p>
                      <p className="text-sm text-muted-foreground">Connections</p>
                    </div>
                    <div className="p-4 rounded-xl bg-muted/50">
                      <p className="text-3xl font-bold text-green-500">{summary.key_topics.length}</p>
                      <p className="text-sm text-muted-foreground">Active Topics</p>
                    </div>
                    <div className="p-4 rounded-xl bg-muted/50">
                      <p className="text-3xl font-bold text-orange-500">{summary.growth_areas.length}</p>
                      <p className="text-sm text-muted-foreground">Growth Areas</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">No summary available</h3>
                <p className="text-muted-foreground">
                  Generate insights to see your learning summary
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
