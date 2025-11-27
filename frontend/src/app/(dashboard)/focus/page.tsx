"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Timer,
  Play,
  Pause,
  Square,
  RotateCcw,
  Brain,
  Coffee,
  Flame,
  Target,
  Clock,
  CheckCircle2,
  Zap,
  BookOpen,
  Lightbulb,
  Sparkles,
  Volume2,
  VolumeX,
  Settings2,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface FocusSession {
  id: string;
  session_type: string;
  state: string;
  duration_minutes: number;
  break_minutes: number;
  topic: string | null;
  elapsed_seconds: number;
  remaining_seconds: number;
  current_pomodoro: number;
  is_break: boolean;
  stats: {
    memories_reviewed: number;
    memories_created: number;
    connections_found: number;
  };
}

interface FocusStats {
  period_days: number;
  total_focus_minutes: number;
  total_pomodoros: number;
  total_reviews: number;
  average_daily_minutes: number;
  streak: number;
}

const sessionTypes = [
  {
    value: "review",
    label: "Review Memories",
    icon: Brain,
    description: "Review and strengthen existing memories",
    color: "from-blue-500 to-cyan-500",
  },
  {
    value: "learn",
    label: "Learn New",
    icon: BookOpen,
    description: "Focus on learning from selected content",
    color: "from-green-500 to-emerald-500",
  },
  {
    value: "create",
    label: "Create Content",
    icon: Lightbulb,
    description: "Capture new ideas and knowledge",
    color: "from-purple-500 to-pink-500",
  },
  {
    value: "explore",
    label: "Explore Connections",
    icon: Sparkles,
    description: "Discover links between memories",
    color: "from-orange-500 to-amber-500",
  },
];

const durations = [15, 25, 30, 45, 50, 60];

export default function FocusPage() {
  const [activeSession, setActiveSession] = useState<FocusSession | null>(null);
  const [stats, setStats] = useState<FocusStats | null>(null);
  const [selectedType, setSelectedType] = useState("review");
  const [duration, setDuration] = useState(25);
  const [topic, setTopic] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);

  // Countdown timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (activeSession && activeSession.state === "active") {
      interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            // Timer complete - play sound
            if (!isMuted) {
              // Play notification sound
              const audio = new Audio("/notification.mp3");
              audio.play().catch(() => {});
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [activeSession, isMuted]);

  useEffect(() => {
    fetchActiveSession();
    fetchStats();
  }, []);

  const fetchActiveSession = async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${baseUrl}/api/intelligence/focus/active`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.active) {
          setActiveSession(data.session);
          setTimeRemaining(data.remaining_seconds);
        }
      }
    } catch (error) {
      console.error("Failed to fetch active session:", error);
    }
  };

  const fetchStats = async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${baseUrl}/api/intelligence/focus/stats?days=7`);
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        // Mock data
        setStats({
          period_days: 7,
          total_focus_minutes: 180,
          total_pomodoros: 8,
          total_reviews: 45,
          average_daily_minutes: 25.7,
          streak: 3,
        });
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  const createSession = async () => {
    setIsLoading(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      
      // First create the session
      const createRes = await fetch(`${baseUrl}/api/intelligence/focus/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_type: selectedType,
          duration_minutes: duration,
          break_minutes: 5,
          topic: topic || null,
          auto_select_memories: true,
        }),
      });

      if (!createRes.ok) throw new Error("Failed to create session");
      const createData = await createRes.json();

      // Then start it
      const startRes = await fetch(
        `${baseUrl}/api/intelligence/focus/start/${createData.session.id}`,
        { method: "POST" }
      );

      if (startRes.ok) {
        const startData = await startRes.json();
        setActiveSession(startData.session);
        setTimeRemaining(startData.session.remaining_seconds);
      }
    } catch (error) {
      console.error("Failed to create session:", error);
      // Create mock session for demo
      const mockSession: FocusSession = {
        id: Date.now().toString(),
        session_type: selectedType,
        state: "active",
        duration_minutes: duration,
        break_minutes: 5,
        topic: topic || null,
        elapsed_seconds: 0,
        remaining_seconds: duration * 60,
        current_pomodoro: 1,
        is_break: false,
        stats: {
          memories_reviewed: 0,
          memories_created: 0,
          connections_found: 0,
        },
      };
      setActiveSession(mockSession);
      setTimeRemaining(duration * 60);
    } finally {
      setIsLoading(false);
    }
  };

  const pauseSession = async () => {
    if (!activeSession) return;
    
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(
        `${baseUrl}/api/intelligence/focus/pause/${activeSession.id}`,
        { method: "POST" }
      );

      if (response.ok) {
        const data = await response.json();
        setActiveSession(data.session);
      } else {
        // Mock pause - use functional update to avoid stale closure
        setActiveSession((prev) => prev ? { ...prev, state: "paused" } : null);
      }
    } catch (error) {
      console.error("Failed to pause session:", error);
      // Mock pause - use functional update to avoid stale closure
      setActiveSession((prev) => prev ? { ...prev, state: "paused" } : null);
    }
  };

  const resumeSession = async () => {
    if (!activeSession) return;
    
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(
        `${baseUrl}/api/intelligence/focus/resume/${activeSession.id}`,
        { method: "POST" }
      );

      if (response.ok) {
        const data = await response.json();
        setActiveSession(data.session);
      } else {
        // Mock resume - use functional update
        setActiveSession((prev) => prev ? { ...prev, state: "active" } : null);
      }
    } catch (error) {
      console.error("Failed to resume session:", error);
      // Mock resume - use functional update
      setActiveSession((prev) => prev ? { ...prev, state: "active" } : null);
    }
  };

  const completeSession = async () => {
    if (!activeSession) return;
    
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      await fetch(
        `${baseUrl}/api/intelligence/focus/complete/${activeSession.id}`,
        { method: "POST" }
      );
    } catch (error) {
      console.error("Failed to complete session:", error);
    } finally {
      // Always clear the session on end, regardless of API success
      setActiveSession(null);
      setTimeRemaining(0);
      fetchStats();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getProgress = () => {
    if (!activeSession) return 0;
    const total = activeSession.duration_minutes * 60;
    const elapsed = total - timeRemaining;
    return (elapsed / total) * 100;
  };

  const selectedTypeInfo = sessionTypes.find((t) => t.value === selectedType);

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500">
            <Timer className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Focus Mode</h1>
            <p className="text-muted-foreground">
              Pomodoro-style study sessions with memory reinforcement
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsMuted(!isMuted)}>
          {isMuted ? (
            <VolumeX className="h-5 w-5" />
          ) : (
            <Volume2 className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                  <Clock className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total_focus_minutes}m</p>
                  <p className="text-xs text-muted-foreground">This Week</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                  <Target className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total_pomodoros}</p>
                  <p className="text-xs text-muted-foreground">Pomodoros</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                  <Brain className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total_reviews}</p>
                  <p className="text-xs text-muted-foreground">Reviews</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
                  <Flame className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.streak} days</p>
                  <p className="text-xs text-muted-foreground">Streak</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Focus Area */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Timer Card */}
        <div className="lg:col-span-2">
          <Card className="relative overflow-hidden">
            {activeSession && selectedTypeInfo && (
              <div
                className={cn(
                  "absolute inset-0 bg-gradient-to-br opacity-5 pointer-events-none",
                  selectedTypeInfo.color
                )}
              />
            )}
            <CardContent className="pt-8 pb-8">
              {activeSession ? (
                <div className="flex flex-col items-center">
                  {/* Session Info */}
                  <div className="flex items-center gap-2 mb-4">
                    <Badge variant="secondary" className="gap-1">
                      {activeSession.is_break ? (
                        <>
                          <Coffee className="h-3 w-3" />
                          Break Time
                        </>
                      ) : (
                        <>
                          {selectedTypeInfo && <selectedTypeInfo.icon className="h-3 w-3" />}
                          {selectedTypeInfo?.label || activeSession.session_type}
                        </>
                      )}
                    </Badge>
                    {activeSession.topic && (
                      <Badge variant="outline">{activeSession.topic}</Badge>
                    )}
                  </div>

                  {/* Timer Display */}
                  <motion.div
                    key={timeRemaining}
                    initial={{ scale: 1 }}
                    animate={{ scale: [1, 1.02, 1] }}
                    transition={{ duration: 0.3 }}
                    className={cn(
                      "text-8xl font-mono font-bold mb-6",
                      activeSession.state === "paused" && "text-muted-foreground"
                    )}
                  >
                    {formatTime(timeRemaining)}
                  </motion.div>

                  {/* Progress Bar */}
                  <div className="w-full max-w-md mb-6">
                    <Progress value={getProgress()} className="h-3" />
                    <div className="flex justify-between text-sm text-muted-foreground mt-2">
                      <span>Pomodoro {activeSession.current_pomodoro}</span>
                      <span>{Math.round(getProgress())}% complete</span>
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center gap-4">
                    {activeSession.state === "active" ? (
                      <Button 
                        type="button"
                        size="lg" 
                        variant="outline" 
                        onClick={pauseSession}
                      >
                        <Pause className="h-5 w-5 mr-2" />
                        Pause
                      </Button>
                    ) : (
                      <Button 
                        type="button"
                        size="lg" 
                        onClick={resumeSession}
                      >
                        <Play className="h-5 w-5 mr-2" />
                        Resume
                      </Button>
                    )}
                    <Button 
                      type="button"
                      size="lg" 
                      variant="destructive" 
                      onClick={completeSession}
                    >
                      <Square className="h-5 w-5 mr-2" />
                      End Session
                    </Button>
                  </div>

                  {/* Session Stats */}
                  <div className="flex items-center gap-6 mt-8 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Brain className="h-4 w-4" />
                      {activeSession.stats.memories_reviewed} reviewed
                    </span>
                    <span className="flex items-center gap-1">
                      <Lightbulb className="h-4 w-4" />
                      {activeSession.stats.memories_created} created
                    </span>
                    <span className="flex items-center gap-1">
                      <Sparkles className="h-4 w-4" />
                      {activeSession.stats.connections_found} connections
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  {/* Session Type Selection */}
                  <div className="grid grid-cols-2 gap-3 w-full max-w-lg mb-6">
                    {sessionTypes.map((type) => (
                      <motion.button
                        key={type.value}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedType(type.value)}
                        className={cn(
                          "flex items-center gap-3 p-4 rounded-xl border text-left transition-all",
                          selectedType === type.value
                            ? `bg-gradient-to-br ${type.color} text-white border-transparent`
                            : "hover:bg-accent"
                        )}
                      >
                        <type.icon className="h-5 w-5" />
                        <div>
                          <p className="font-medium text-sm">{type.label}</p>
                          <p
                            className={cn(
                              "text-xs",
                              selectedType === type.value
                                ? "text-white/80"
                                : "text-muted-foreground"
                            )}
                          >
                            {type.description}
                          </p>
                        </div>
                      </motion.button>
                    ))}
                  </div>

                  {/* Duration Selection */}
                  <div className="flex items-center gap-3 mb-6">
                    <span className="text-sm text-muted-foreground">Duration:</span>
                    <div className="flex gap-2">
                      {durations.map((d) => (
                        <Button
                          key={d}
                          variant={duration === d ? "default" : "outline"}
                          size="sm"
                          onClick={() => setDuration(d)}
                        >
                          {d}m
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Topic Input */}
                  <div className="w-full max-w-md mb-8">
                    <Input
                      placeholder="What are you focusing on? (optional)"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      className="text-center"
                    />
                  </div>

                  {/* Start Button */}
                  <Button
                    size="lg"
                    className={cn(
                      "text-lg px-12 py-6 bg-gradient-to-r",
                      selectedTypeInfo?.color || "from-blue-500 to-purple-500"
                    )}
                    onClick={createSession}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <RotateCcw className="h-5 w-5 mr-2 animate-spin" />
                    ) : (
                      <Play className="h-5 w-5 mr-2" />
                    )}
                    Start Focus Session
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Tips Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                Focus Tips
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  Remove distractions before starting your session
                </p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  Take short breaks between pomodoros to recharge
                </p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  Review memories during breaks for better retention
                </p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  Stay hydrated and maintain good posture
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" asChild>
                <a href="/health">
                  <Brain className="h-4 w-4 mr-2" />
                  Review Memories
                </a>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <a href="/insights">
                  <Sparkles className="h-4 w-4 mr-2" />
                  View Insights
                </a>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <a href="/upload">
                  <Lightbulb className="h-4 w-4 mr-2" />
                  Add New Memory
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
