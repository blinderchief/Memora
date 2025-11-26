"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Search, 
  Sparkles, 
  Clock, 
  Zap,
  SlidersHorizontal,
  X
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSearch } from "@/lib/hooks";
import { MemoryCard } from "@/components/memory/memory-card";

const MEMORY_TYPES = [
  "insight",
  "decision", 
  "action_item",
  "meeting_note",
  "research",
  "question",
  "feedback",
  "idea",
  "reference",
];

const SEARCH_MODES = [
  { value: "hybrid", label: "Hybrid", icon: Zap, description: "Best of both worlds" },
  { value: "semantic", label: "Semantic", icon: Sparkles, description: "AI-powered similarity" },
  { value: "keyword", label: "Keyword", icon: Search, description: "Exact match" },
];

export function SearchPanel() {
  const [query, setQuery] = useState("");
  const [searchMode, setSearchMode] = useState<"hybrid" | "semantic" | "keyword">("hybrid");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [temporalBoost, setTemporalBoost] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading, refetch } = useSearch({
    query,
    mode: searchMode,
    types: selectedTypes.length > 0 ? selectedTypes : undefined,
    temporal_boost: temporalBoost,
    limit: 20,
  });

  const handleSearch = () => {
    if (query.trim()) {
      refetch();
    }
  };

  const toggleType = (type: string) => {
    setSelectedTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const clearFilters = () => {
    setSelectedTypes([]);
    setTemporalBoost(true);
  };

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardContent className="p-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search your memories... Ask anything about your knowledge base"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-10 pr-4 h-12 text-base bg-background/50"
              />
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-12 gap-2">
                  {SEARCH_MODES.find(m => m.value === searchMode)?.icon && (
                    <Zap className="w-4 h-4" />
                  )}
                  {searchMode.charAt(0).toUpperCase() + searchMode.slice(1)}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Search Mode</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {SEARCH_MODES.map((mode) => (
                  <DropdownMenuItem
                    key={mode.value}
                    onClick={() => setSearchMode(mode.value as "hybrid" | "semantic" | "keyword")}
                    className="gap-2"
                  >
                    <mode.icon className="w-4 h-4" />
                    <div>
                      <div className="font-medium">{mode.label}</div>
                      <div className="text-xs text-muted-foreground">{mode.description}</div>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button 
              variant="outline" 
              size="icon" 
              className="h-12 w-12"
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal className="w-5 h-5" />
            </Button>

            <Button 
              onClick={handleSearch} 
              className="h-12 px-6 bg-violet-600 hover:bg-violet-700"
              disabled={isLoading || !query.trim()}
            >
              {isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles className="w-5 h-5" />
                </motion.div>
              ) : (
                "Search"
              )}
            </Button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t border-border/50"
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium">Filter by Type</h4>
                {selectedTypes.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="h-7 text-xs gap-1"
                  >
                    <X className="w-3 h-3" />
                    Clear filters
                  </Button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {MEMORY_TYPES.map((type) => (
                  <Badge
                    key={type}
                    variant={selectedTypes.includes(type) ? "default" : "outline"}
                    className={`cursor-pointer capitalize transition-colors ${
                      selectedTypes.includes(type)
                        ? "bg-violet-600 hover:bg-violet-700"
                        : "hover:bg-violet-600/10"
                    }`}
                    onClick={() => toggleType(type)}
                  >
                    {type.replace("_", " ")}
                  </Badge>
                ))}
              </div>

              <div className="flex items-center gap-4 mt-4">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={temporalBoost}
                    onChange={(e) => setTemporalBoost(e.target.checked)}
                    className="rounded border-border"
                  />
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  Boost recent memories
                </label>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      <div className="space-y-4">
        {data?.results && data.results.length > 0 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Found <span className="font-medium text-foreground">{data.results.length}</span> memories
              {data.search_time_ms && (
                <span> in {data.search_time_ms.toFixed(0)}ms</span>
              )}
            </p>
          </div>
        )}

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-3 bg-muted rounded w-full mb-1" />
                  <div className="h-3 bg-muted rounded w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : data?.results && data.results.length > 0 ? (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              visible: {
                transition: {
                  staggerChildren: 0.05,
                },
              },
            }}
            className="grid gap-4 md:grid-cols-2"
          >
            {data.results.map((result, index) => (
              <motion.div
                key={`${result.id}-${index}`}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
              >
                <MemoryCard memory={result} showScore />
              </motion.div>
            ))}
          </motion.div>
        ) : query && !isLoading ? (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center">
              <Search className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No memories found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search or filters
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center">
              <Sparkles className="w-12 h-12 mx-auto text-violet-500 mb-4" />
              <h3 className="text-lg font-medium mb-2">Start exploring your memories</h3>
              <p className="text-muted-foreground">
                Type a question or topic to search your knowledge base
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
