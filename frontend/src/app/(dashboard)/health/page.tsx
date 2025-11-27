"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Heart,
  Brain,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Zap,
  TrendingUp,
  Calendar,
  Target,
  ChevronRight,
  Play,
  Flame,
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
import { cn } from "@/lib/utils";

interface MemoryHealth {
  memory_id: string;
  title: string;
  content_preview: string;
  retention_score: number;
  strength: string;
  next_review: string;
  review_count: number;
  created_at: string;
}

interface HealthDashboard {
  health_score: number;
  total_memories: number;
  due_today: number;
  overdue: number;
  streak: number;
  strength_distribution: {
    fresh: number;
    strong: number;
    moderate: number;
    weak: number;
    fading: number;
  };
}

const strengthColors: Record<string, string> = {
  fresh: "bg-green-500",
  strong: "bg-blue-500",
  moderate: "bg-yellow-500",
  weak: "bg-orange-500",
  fading: "bg-red-500",
};

const strengthLabels: Record<string, string> = {
  fresh: "Fresh",
  strong: "Strong",
  moderate: "Moderate",
  weak: "Weak",
  fading: "Fading",
};

export default function HealthPage() {
  const [dashboard, setDashboard] = useState<HealthDashboard | null>(null);
  const [reviewQueue, setReviewQueue] = useState<MemoryHealth[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeReview, setActiveReview] = useState<MemoryHealth | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchHealthData();
  }, []);

  const fetchHealthData = async () => {
    setIsLoading(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      // Fetch health score
      const mockDashboard: HealthDashboard = {
        health_score: 78,
        total_memories: 156,
        due_today: 12,
        overdue: 3,
        streak: 5,
        strength_distribution: {
          fresh: 45,
          strong: 38,
          moderate: 32,
          weak: 28,
          fading: 13,
        },
      };

      try {
        const scoreRes = await fetch(`${baseUrl}/api/intelligence/health/score`);
        if (scoreRes.ok) {
          const data = await scoreRes.json();
          // Ensure all required fields exist
          setDashboard({
            health_score: data.health_score ?? mockDashboard.health_score,
            total_memories: data.total_memories ?? mockDashboard.total_memories,
            due_today: data.due_today ?? mockDashboard.due_today,
            overdue: data.overdue ?? mockDashboard.overdue,
            streak: data.streak ?? mockDashboard.streak,
            strength_distribution: data.strength_distribution ?? mockDashboard.strength_distribution,
          });
        } else {
          setDashboard(mockDashboard);
        }
      } catch {
        setDashboard(mockDashboard);
      }

      // Fetch review queue
      const queueRes = await fetch(`${baseUrl}/api/intelligence/health/review-queue?limit=20`);
      if (queueRes.ok) {
        const data = await queueRes.json();
        setReviewQueue(data.memories || []);
      } else {
        // Mock data
        setReviewQueue([
          {
            memory_id: "1",
            title: "React Hooks Best Practices",
            content_preview: "useEffect should have a dependency array...",
            retention_score: 0.45,
            strength: "weak",
            next_review: new Date().toISOString(),
            review_count: 3,
            created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            memory_id: "2",
            title: "System Design Principles",
            content_preview: "CAP theorem states that distributed systems...",
            retention_score: 0.62,
            strength: "moderate",
            next_review: new Date().toISOString(),
            review_count: 5,
            created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            memory_id: "3",
            title: "Python Decorators",
            content_preview: "Decorators are functions that modify the behavior...",
            retention_score: 0.35,
            strength: "fading",
            next_review: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            review_count: 2,
            created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          },
        ]);
      }
    } catch (error) {
      console.error("Failed to fetch health data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const startReview = (memory: MemoryHealth) => {
    setActiveReview(memory);
    setShowAnswer(false);
  };

  const submitReview = async (difficulty: string) => {
    if (!activeReview) return;

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      await fetch(`${baseUrl}/api/intelligence/health/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memory_id: activeReview.memory_id,
          difficulty,
        }),
      });

      // Remove from queue and move to next
      const currentIndex = reviewQueue.findIndex(
        (m) => m.memory_id === activeReview.memory_id
      );
      const newQueue = reviewQueue.filter(
        (m) => m.memory_id !== activeReview.memory_id
      );
      setReviewQueue(newQueue);

      if (newQueue.length > 0) {
        const nextIndex = Math.min(currentIndex, newQueue.length - 1);
        setActiveReview(newQueue[nextIndex]);
        setShowAnswer(false);
      } else {
        setActiveReview(null);
      }
    } catch (error) {
      console.error("Failed to submit review:", error);
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-blue-500";
    if (score >= 40) return "text-yellow-500";
    return "text-red-500";
  };

  const getHealthGradient = (score: number) => {
    if (score >= 80) return "from-green-500 to-emerald-500";
    if (score >= 60) return "from-blue-500 to-cyan-500";
    if (score >= 40) return "from-yellow-500 to-orange-500";
    return "from-red-500 to-pink-500";
  };

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-pink-500">
            <Heart className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Memory Health</h1>
            <p className="text-muted-foreground">
              Track retention and review your memories
            </p>
          </div>
        </div>
        <Button onClick={fetchHealthData}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Health Score Card */}
      {dashboard && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:col-span-2 lg:col-span-1"
          >
            <Card className="relative overflow-hidden">
              <div className={cn(
                "absolute inset-0 bg-gradient-to-br opacity-10",
                getHealthGradient(dashboard.health_score)
              )} />
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className={cn(
                    "text-5xl font-bold mb-2",
                    getHealthColor(dashboard.health_score)
                  )}>
                    {dashboard.health_score}%
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Memory Health Score
                  </p>
                  <Progress
                    value={dashboard.health_score}
                    className="h-2 w-full"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/10">
                    <Clock className="h-6 w-6 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{dashboard.due_today}</p>
                    <p className="text-sm text-muted-foreground">Due Today</p>
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
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10">
                    <AlertTriangle className="h-6 w-6 text-red-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{dashboard.overdue}</p>
                    <p className="text-sm text-muted-foreground">Overdue</p>
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
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10">
                    <Flame className="h-6 w-6 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{dashboard.streak} days</p>
                    <p className="text-sm text-muted-foreground">Review Streak</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Strength Distribution */}
      {dashboard && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Memory Strength Distribution
            </CardTitle>
            <CardDescription>
              How well you remember your {dashboard.total_memories} memories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboard.strength_distribution && Object.keys(dashboard.strength_distribution).length > 0 && Object.entries(dashboard.strength_distribution).map(([strength, count]) => {
                const total = dashboard.total_memories || 1;
                const percentage = total > 0 ? ((count ?? 0) / total) * 100 : 0;
                return (
                  <div key={strength} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span className={cn("h-3 w-3 rounded-full", strengthColors[strength])} />
                        {strengthLabels[strength]}
                      </span>
                      <span className="text-muted-foreground">
                        {count} memories ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <Progress 
                      value={percentage} 
                      className={cn("h-2", `[&>div]:${strengthColors[strength]}`)}
                    />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Review Section - only render after mount to prevent hydration mismatch */}
      {mounted && (
      <Tabs defaultValue="queue" className="space-y-6">
        <TabsList>
          <TabsTrigger value="queue" className="gap-2">
            <Clock className="h-4 w-4" />
            Review Queue ({reviewQueue.length})
          </TabsTrigger>
          <TabsTrigger value="study" className="gap-2">
            <Brain className="h-4 w-4" />
            Study Mode
          </TabsTrigger>
        </TabsList>

        <TabsContent value="queue" className="space-y-4">
          {reviewQueue.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">All caught up!</h3>
                <p className="text-muted-foreground">
                  No memories need review right now. Great job!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {reviewQueue.map((memory, index) => (
                <motion.div
                  key={memory.memory_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card
                    className="cursor-pointer hover:shadow-md transition-shadow group"
                    onClick={() => startReview(memory)}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-3">
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-xs",
                            memory.strength === "fading" && "bg-red-500/10 text-red-500",
                            memory.strength === "weak" && "bg-orange-500/10 text-orange-500",
                            memory.strength === "moderate" && "bg-yellow-500/10 text-yellow-500"
                          )}
                        >
                          {strengthLabels[memory.strength]}
                        </Badge>
                        <Play className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <h3 className="font-semibold mb-2 line-clamp-2">
                        {memory.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {memory.content_preview}
                      </p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{memory.review_count} reviews</span>
                        <span>{Math.round(memory.retention_score * 100)}% retention</span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="study">
          {activeReview ? (
            <Card className="max-w-2xl mx-auto">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">
                    {strengthLabels[activeReview.strength]}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {reviewQueue.length} cards remaining
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="min-h-[200px] flex items-center justify-center text-center p-6 bg-muted/50 rounded-xl">
                  <div>
                    <h2 className="text-xl font-semibold mb-4">
                      {activeReview.title}
                    </h2>
                    {showAnswer ? (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-muted-foreground"
                      >
                        {activeReview.content_preview}
                      </motion.p>
                    ) : (
                      <Button onClick={() => setShowAnswer(true)}>
                        Show Answer
                      </Button>
                    )}
                  </div>
                </div>

                {showAnswer && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <p className="text-center text-sm text-muted-foreground">
                      How well did you remember this?
                    </p>
                    <div className="grid grid-cols-4 gap-2">
                      <Button
                        variant="outline"
                        className="flex-col h-auto py-4 border-red-500/20 hover:bg-red-500/10 hover:text-red-500"
                        onClick={() => submitReview("again")}
                      >
                        <RotateCcw className="h-5 w-5 mb-1" />
                        <span className="text-xs">Again</span>
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-col h-auto py-4 border-orange-500/20 hover:bg-orange-500/10 hover:text-orange-500"
                        onClick={() => submitReview("hard")}
                      >
                        <AlertTriangle className="h-5 w-5 mb-1" />
                        <span className="text-xs">Hard</span>
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-col h-auto py-4 border-blue-500/20 hover:bg-blue-500/10 hover:text-blue-500"
                        onClick={() => submitReview("medium")}
                      >
                        <Target className="h-5 w-5 mb-1" />
                        <span className="text-xs">Good</span>
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-col h-auto py-4 border-green-500/20 hover:bg-green-500/10 hover:text-green-500"
                        onClick={() => submitReview("easy")}
                      >
                        <Zap className="h-5 w-5 mb-1" />
                        <span className="text-xs">Easy</span>
                      </Button>
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="max-w-2xl mx-auto">
              <CardContent className="py-12 text-center">
                <Brain className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Ready to Study?</h3>
                <p className="text-muted-foreground mb-6">
                  Select a memory from the queue to start reviewing
                </p>
                {reviewQueue.length > 0 && (
                  <Button onClick={() => startReview(reviewQueue[0])}>
                    <Play className="h-4 w-4 mr-2" />
                    Start Review Session
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
      )}
    </div>
  );
}
