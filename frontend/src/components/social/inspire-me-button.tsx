"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, AlertCircle, Zap, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";

interface InspireMeButtonProps {
  userId: string;
  focusAreas?: string[];
  onInspired?: (sparksCount: number) => void;
}

export function InspireMeButton({
  userId,
  focusAreas = [],
  onInspired,
}: InspireMeButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleInspire = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/social/inspire`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: userId,
            focus_areas: focusAreas,
            max_results: 10,
            include_prompts: true,
            privacy_level: "blur_author",
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch network inspiration");
      }

      const data = await response.json();
      setResults(data);
      onInspired?.(data.total_found);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          size="lg"
          className="relative overflow-hidden group bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            animate={{
              x: ["-100%", "100%"],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear",
            }}
          />
          <Sparkles className="w-5 h-5 mr-2" />
          Inspire Me from Network
          <Zap className="w-4 h-4 ml-2 group-hover:animate-pulse" />
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="w-6 h-6 text-primary" />
            Network Inspiration
          </DialogTitle>
          <DialogDescription>
            Discover insights from your social graph, transformed into actionable
            knowledge sparks
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!results && !error && (
            <div className="text-center py-8">
              <Button
                onClick={handleInspire}
                disabled={isLoading}
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-blue-600"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Analyzing your network...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Discover Network Sparks
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground mt-4">
                Privacy-first: Only anonymized signals, no raw posts stored
              </p>
            </div>
          )}

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-destructive">
                  Failed to fetch inspiration
                </p>
                <p className="text-xs text-muted-foreground mt-1">{error}</p>
              </div>
            </div>
          )}

          <AnimatePresence mode="wait">
            {results && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-primary">
                        {results.total_found}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Sparks Found
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-blue-500">
                        {results.generated_prompts?.length || 0}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        PKM Prompts
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-purple-500">
                        {results.network_heuristics?.length || 0}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Patterns
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Network Heuristics */}
                {results.network_heuristics &&
                  results.network_heuristics.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold flex items-center gap-2">
                        <Zap className="w-4 h-4 text-primary" />
                        Network Patterns
                      </h4>
                      <div className="space-y-2">
                        {results.network_heuristics.map(
                          (heuristic: string, idx: number) => (
                            <motion.div
                              key={idx}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.1 }}
                              className="bg-primary/5 border border-primary/20 rounded-lg p-3"
                            >
                              <p className="text-sm">{heuristic}</p>
                            </motion.div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                {/* Generated Prompts */}
                {results.generated_prompts &&
                  results.generated_prompts.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold flex items-center gap-2">
                        <Brain className="w-4 h-4 text-primary" />
                        Reflection Prompts
                      </h4>
                      <ScrollArea className="h-[200px]">
                        <div className="space-y-2 pr-4">
                          {results.generated_prompts.map(
                            (prompt: string, idx: number) => (
                              <motion.div
                                key={idx}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3"
                              >
                                <p className="text-sm italic">💡 {prompt}</p>
                              </motion.div>
                            )
                          )}
                        </div>
                      </ScrollArea>
                    </div>
                  )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setResults(null);
                      setIsOpen(false);
                    }}
                    className="flex-1"
                  >
                    Close
                  </Button>
                  <Button
                    onClick={() => {
                      // Navigate to sparks view
                      window.location.href = "/dashboard/network-sparks";
                    }}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600"
                  >
                    View All Sparks
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
