"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { Sparkles, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InspireMeButton } from "@/components/social/inspire-me-button";
import {
  NetworkSparksGrid,
  NetworkSparkCard,
} from "@/components/social/network-spark-card";

interface NetworkSpark {
  id: string;
  title: string;
  content: string;
  source_label: string;
  platform: string;
  relevance_score: number;
  glow_intensity: number;
  tags: string[];
  prompt?: string;
  created_at: string;
}

export default function NetworkSparksPage() {
  const { user } = useUser();
  const [sparks, setSparks] = useState<NetworkSpark[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSparks = async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/social/sparks?user_id=${user.id}&limit=20&min_relevance=0.5`
      );

      if (!response.ok) {
        throw new Error("Failed to load network sparks");
      }

      const data = await response.json();
      setSparks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadSparks();
    }
  }, [user]);

  const handleSparkView = (sparkId: string) => {
    console.log("Viewing spark:", sparkId);
    // Could open a detailed modal or navigate to detail page
  };

  const handleInspired = (count: number) => {
    // Refresh sparks after new inspiration
    setTimeout(() => {
      loadSparks();
    }, 1000);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold flex items-center gap-3 mb-2">
            <Sparkles className="w-8 h-8 text-primary animate-pulse" />
            Network Sparks
          </h1>
          <p className="text-muted-foreground">
            Discover insights from your social graph, transformed into actionable
            knowledge
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={loadSparks}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Refresh
          </Button>

          {user && (
            <InspireMeButton
              userId={user.id}
              focusAreas={["AI", "productivity", "innovation"]}
              onInspired={handleInspired}
            />
          )}
        </div>
      </div>

      {/* Privacy Notice */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-8"
      >
        <p className="text-sm text-muted-foreground">
          🔒 <strong>Privacy-First:</strong> We never store raw social posts.
          Only anonymized vectors and metadata are kept. Author handles are
          blurred and source links removed.
        </p>
      </motion.div>

      {/* Loading State */}
      {isLoading && sparks.length === 0 && (
        <div className="text-center py-12">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your network sparks...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 text-center">
          <p className="text-destructive">{error}</p>
          <Button onClick={loadSparks} className="mt-4">
            Try Again
          </Button>
        </div>
      )}

      {/* Sparks Grid */}
      {!isLoading && !error && (
        <NetworkSparksGrid
          sparks={sparks.map((spark) => ({
            id: spark.id,
            title: spark.title,
            content: spark.content,
            sourceLabel: spark.source_label,
            platform: spark.platform,
            relevanceScore: spark.relevance_score,
            glowIntensity: spark.glow_intensity,
            tags: spark.tags,
            prompt: spark.prompt,
            createdAt: spark.created_at,
          }))}
          onSparkView={handleSparkView}
        />
      )}
    </div>
  );
}
