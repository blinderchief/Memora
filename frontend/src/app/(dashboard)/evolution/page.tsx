"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Calendar,
  GitBranch,
  ArrowUpRight,
  Clock,
  Layers,
  Sparkles,
  Target,
  RefreshCw,
  ChevronRight,
  History,
  Zap,
  Award,
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
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface TopicEvolution {
  topic: string;
  period: string;
  first_mention: string;
  latest_mention: string;
  total_memories: number;
  growth_rate: number;
  evolution_stages: {
    stage: string;
    date: string;
    memory_count: number;
  }[];
}

interface Milestone {
  id: string;
  title: string;
  description: string;
  date: string;
  type: "first_memory" | "topic_mastery" | "connection_hub" | "streak" | "volume";
  topic?: string;
  value?: number;
}

interface GrowthMetrics {
  total_memories: number;
  memories_this_month: number;
  topics_explored: number;
  connections_made: number;
  average_daily_memories: number;
  growth_trend: "increasing" | "stable" | "decreasing";
  top_growing_topics: { topic: string; growth: number }[];
}

const milestoneIcons = {
  first_memory: Sparkles,
  topic_mastery: Award,
  connection_hub: GitBranch,
  streak: Zap,
  volume: Layers,
};

const milestoneColors = {
  first_memory: "bg-yellow-500/10 text-yellow-500",
  topic_mastery: "bg-purple-500/10 text-purple-500",
  connection_hub: "bg-blue-500/10 text-blue-500",
  streak: "bg-orange-500/10 text-orange-500",
  volume: "bg-green-500/10 text-green-500",
};

export default function EvolutionPage() {
  const [topicEvolution, setTopicEvolution] = useState<TopicEvolution | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [growthMetrics, setGrowthMetrics] = useState<GrowthMetrics | null>(null);
  const [selectedTopic, setSelectedTopic] = useState("");
  const [timeRange, setTimeRange] = useState("90");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchEvolutionData();
  }, []);

  const fetchEvolutionData = async () => {
    setIsLoading(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      // Fetch milestones
      const milestonesRes = await fetch(`${baseUrl}/api/intelligence/evolution/insights?limit=10`);
      if (milestonesRes.ok) {
        const data = await milestonesRes.json();
        setMilestones(data.insights || []);
      } else {
        // Mock milestones
        setMilestones([
          {
            id: "1",
            title: "First Memory on AI",
            description: "You started your AI learning journey",
            date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
            type: "first_memory",
            topic: "AI",
          },
          {
            id: "2",
            title: "React Mastery",
            description: "You&apos;ve created 50+ memories on React",
            date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            type: "topic_mastery",
            topic: "React",
            value: 50,
          },
          {
            id: "3",
            title: "7-Day Streak",
            description: "Created memories 7 days in a row",
            date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            type: "streak",
            value: 7,
          },
          {
            id: "4",
            title: "Knowledge Hub",
            description: "Machine Learning now connects to 10+ topics",
            date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
            type: "connection_hub",
            topic: "Machine Learning",
            value: 10,
          },
          {
            id: "5",
            title: "100 Memories",
            description: "You&apos;ve reached 100 total memories!",
            date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
            type: "volume",
            value: 100,
          },
        ]);
      }

      // Mock growth metrics
      setGrowthMetrics({
        total_memories: 156,
        memories_this_month: 28,
        topics_explored: 12,
        connections_made: 89,
        average_daily_memories: 1.2,
        growth_trend: "increasing",
        top_growing_topics: [
          { topic: "Machine Learning", growth: 45 },
          { topic: "React", growth: 32 },
          { topic: "System Design", growth: 28 },
          { topic: "Python", growth: 22 },
          { topic: "TypeScript", growth: 18 },
        ],
      });
    } catch (error) {
      console.error("Failed to fetch evolution data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeTopicEvolution = async (topic: string) => {
    if (!topic) return;
    
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(
        `${baseUrl}/api/intelligence/evolution/thinking/${encodeURIComponent(topic)}?days=${timeRange}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setTopicEvolution({
          topic,
          period: `Last ${timeRange} days`,
          first_mention: data.distribution?.early > 0 ? "Early period" : "N/A",
          latest_mention: "Recent",
          total_memories: data.memories_found || 0,
          growth_rate: 0.25,
          evolution_stages: [],
        });
      } else {
        // Mock data
        setTopicEvolution({
          topic,
          period: `Last ${timeRange} days`,
          first_mention: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toLocaleDateString(),
          latest_mention: new Date().toLocaleDateString(),
          total_memories: 15,
          growth_rate: 0.35,
          evolution_stages: [
            { stage: "Discovery", date: "Week 1", memory_count: 3 },
            { stage: "Exploration", date: "Week 2-4", memory_count: 5 },
            { stage: "Deepening", date: "Week 5-8", memory_count: 4 },
            { stage: "Mastery", date: "Week 9+", memory_count: 3 },
          ],
        });
      }
    } catch (error) {
      console.error("Failed to analyze topic:", error);
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "increasing":
        return <ArrowUpRight className="h-4 w-4 text-green-500" />;
      case "decreasing":
        return <ArrowUpRight className="h-4 w-4 text-red-500 rotate-180" />;
      default:
        return <ArrowUpRight className="h-4 w-4 text-yellow-500 rotate-45" />;
    }
  };

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Knowledge Evolution</h1>
            <p className="text-muted-foreground">
              Track how your knowledge grows and evolves over time
            </p>
          </div>
        </div>
        <Button onClick={fetchEvolutionData} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Growth Overview */}
      {growthMetrics && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">{growthMetrics.total_memories}</p>
                    <p className="text-xs text-muted-foreground">Total Memories</p>
                  </div>
                  <Layers className="h-8 w-8 text-blue-500/20" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1">
                      <p className="text-2xl font-bold">{growthMetrics.memories_this_month}</p>
                      {getTrendIcon(growthMetrics.growth_trend)}
                    </div>
                    <p className="text-xs text-muted-foreground">This Month</p>
                  </div>
                  <Calendar className="h-8 w-8 text-green-500/20" />
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
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">{growthMetrics.topics_explored}</p>
                    <p className="text-xs text-muted-foreground">Topics</p>
                  </div>
                  <Target className="h-8 w-8 text-purple-500/20" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">{growthMetrics.connections_made}</p>
                    <p className="text-xs text-muted-foreground">Connections</p>
                  </div>
                  <GitBranch className="h-8 w-8 text-orange-500/20" />
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
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">{growthMetrics.average_daily_memories.toFixed(1)}</p>
                    <p className="text-xs text-muted-foreground">Daily Avg</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-cyan-500/20" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Main Content */}
      <Tabs defaultValue="milestones" className="space-y-6">
        <TabsList>
          <TabsTrigger value="milestones" className="gap-2">
            <Award className="h-4 w-4" />
            Milestones
          </TabsTrigger>
          <TabsTrigger value="topics" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Topic Evolution
          </TabsTrigger>
          <TabsTrigger value="growth" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Growth Trends
          </TabsTrigger>
        </TabsList>

        <TabsContent value="milestones" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {milestones.map((milestone, index) => {
              const Icon = milestoneIcons[milestone.type];
              const colorClass = milestoneColors[milestone.type];
              
              return (
                <motion.div
                  key={milestone.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-xl", colorClass)}>
                          <Icon className="h-6 w-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold">{milestone.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {milestone.description}
                          </p>
                          <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {new Date(milestone.date).toLocaleDateString()}
                            {milestone.topic && (
                              <Badge variant="secondary" className="text-xs">
                                {milestone.topic}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="topics" className="space-y-6">
          {/* Topic Analyzer */}
          <Card>
            <CardHeader>
              <CardTitle>Analyze Topic Evolution</CardTitle>
              <CardDescription>
                See how your understanding of a topic has grown over time
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Input
                  placeholder="Enter a topic (e.g., Machine Learning)"
                  value={selectedTopic}
                  onChange={(e) => setSelectedTopic(e.target.value)}
                  className="flex-1"
                />
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">Last 30 days</SelectItem>
                    <SelectItem value="90">Last 90 days</SelectItem>
                    <SelectItem value="180">Last 6 months</SelectItem>
                    <SelectItem value="365">Last year</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={() => analyzeTopicEvolution(selectedTopic)}>
                  Analyze
                </Button>
              </div>

              {topicEvolution && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">
                      &quot;{topicEvolution.topic}&quot; Evolution
                    </h3>
                    <Badge variant="secondary">{topicEvolution.period}</Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg bg-muted/50 text-center">
                      <p className="text-2xl font-bold">{topicEvolution.total_memories}</p>
                      <p className="text-xs text-muted-foreground">Total Memories</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50 text-center">
                      <p className="text-2xl font-bold text-green-500">
                        +{Math.round(topicEvolution.growth_rate * 100)}%
                      </p>
                      <p className="text-xs text-muted-foreground">Growth Rate</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50 text-center">
                      <p className="text-2xl font-bold">{topicEvolution.evolution_stages.length}</p>
                      <p className="text-xs text-muted-foreground">Stages</p>
                    </div>
                  </div>

                  {topicEvolution.evolution_stages.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-medium">Evolution Timeline</h4>
                      <div className="relative">
                        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-muted" />
                        {topicEvolution.evolution_stages.map((stage, idx) => (
                          <div key={idx} className="relative pl-10 pb-4">
                            <div className="absolute left-2.5 top-1 h-3 w-3 rounded-full bg-primary" />
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">{stage.stage}</p>
                                <p className="text-sm text-muted-foreground">{stage.date}</p>
                              </div>
                              <Badge variant="outline">{stage.memory_count} memories</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="growth" className="space-y-6">
          {growthMetrics && (
            <Card>
              <CardHeader>
                <CardTitle>Top Growing Topics</CardTitle>
                <CardDescription>
                  Topics with the most growth in memories
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {growthMetrics.top_growing_topics.map((topic, index) => {
                  const maxGrowth = Math.max(
                    ...growthMetrics.top_growing_topics.map((t) => t.growth)
                  );
                  const percentage = (topic.growth / maxGrowth) * 100;
                  
                  return (
                    <motion.div
                      key={topic.topic}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{topic.topic}</span>
                        <span className="text-sm text-green-500">+{topic.growth}%</span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </motion.div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Activity Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { day: "Today", count: 3, topics: ["React", "TypeScript"] },
                  { day: "Yesterday", count: 5, topics: ["Machine Learning", "Python"] },
                  { day: "2 days ago", count: 2, topics: ["System Design"] },
                  { day: "3 days ago", count: 4, topics: ["React", "Testing"] },
                  { day: "4 days ago", count: 1, topics: ["DevOps"] },
                ].map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      <span className="text-sm">{activity.day}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {activity.topics.slice(0, 2).map((topic) => (
                        <Badge key={topic} variant="secondary" className="text-xs">
                          {topic}
                        </Badge>
                      ))}
                      <span className="text-sm text-muted-foreground">
                        {activity.count} memories
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
