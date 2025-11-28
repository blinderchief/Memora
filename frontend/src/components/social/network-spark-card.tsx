"use client";

import { motion } from "framer-motion";
import { Sparkles, ExternalLink, Tag, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface NetworkSparkCardProps {
  id: string;
  title: string;
  content: string;
  sourceLabel: string;
  platform: string;
  relevanceScore: number;
  glowIntensity: number;
  tags: string[];
  prompt?: string;
  createdAt: string;
  onView?: (id: string) => void;
}

export function NetworkSparkCard({
  id,
  title,
  content,
  sourceLabel,
  platform,
  relevanceScore,
  glowIntensity,
  tags,
  prompt,
  createdAt,
  onView,
}: NetworkSparkCardProps) {
  // Calculate glow color based on intensity
  const getGlowColor = (intensity: number) => {
    if (intensity > 0.8) return "rgba(139, 92, 246, 0.6)"; // Purple for high relevance
    if (intensity > 0.6) return "rgba(59, 130, 246, 0.5)"; // Blue for medium
    return "rgba(16, 185, 129, 0.4)"; // Green for lower
  };

  const getPlatformIcon = (platform: string) => {
    const icons: Record<string, string> = {
      twitter: "𝕏",
      linkedin: "in",
      mastodon: "🐘",
      github: "⚡",
    };
    return icons[platform.toLowerCase()] || "🌐";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -4 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        className="relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 cursor-pointer group"
        onClick={() => onView?.(id)}
        style={{
          boxShadow: `0 0 ${20 + glowIntensity * 30}px ${getGlowColor(
            glowIntensity
          )}`,
        }}
      >
        {/* Animated glow effect */}
        <motion.div
          className="absolute inset-0 opacity-20 pointer-events-none"
          animate={{
            background: [
              `radial-gradient(circle at 0% 0%, ${getGlowColor(
                glowIntensity
              )} 0%, transparent 50%)`,
              `radial-gradient(circle at 100% 100%, ${getGlowColor(
                glowIntensity
              )} 0%, transparent 50%)`,
              `radial-gradient(circle at 0% 0%, ${getGlowColor(
                glowIntensity
              )} 0%, transparent 50%)`,
            ],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "linear",
          }}
        />

        <CardContent className="p-6 relative">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary animate-pulse" />
              <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                {title}
              </h3>
            </div>
            <Badge variant="outline" className="text-xs">
              {getPlatformIcon(platform)} {platform}
            </Badge>
          </div>

          {/* Content */}
          <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
            {content}
          </p>

          {/* Tags */}
          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {tags.slice(0, 4).map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="text-xs flex items-center gap-1"
                >
                  <Tag className="w-3 h-3" />
                  {tag}
                </Badge>
              ))}
              {tags.length > 4 && (
                <Badge variant="secondary" className="text-xs">
                  +{tags.length - 4} more
                </Badge>
              )}
            </div>
          )}

          {/* PKM Prompt */}
          {prompt && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 mb-4">
              <p className="text-xs italic text-primary/90">💡 {prompt}</p>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="opacity-70">{sourceLabel}</span>
              <span className="opacity-50">•</span>
              <span className="opacity-70">
                {new Date(createdAt).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center gap-1 text-primary">
              <TrendingUp className="w-3 h-3" />
              <span className="font-medium">
                {Math.round(relevanceScore * 100)}%
              </span>
            </div>
          </div>

          {/* Hover overlay */}
          <motion.div
            className="absolute inset-0 bg-linear-to-t from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
            initial={false}
          />
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface NetworkSparksGridProps {
  sparks: NetworkSparkCardProps[];
  onSparkView?: (id: string) => void;
}

export function NetworkSparksGrid({
  sparks,
  onSparkView,
}: NetworkSparksGridProps) {
  if (sparks.length === 0) {
    return (
      <div className="text-center py-12">
        <Sparkles className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
        <p className="text-muted-foreground">
          No network sparks yet. Click "Inspire Me" to discover insights from
          your network!
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {sparks.map((spark) => (
        <NetworkSparkCard key={spark.id} {...spark} onView={onSparkView} />
      ))}
    </div>
  );
}
