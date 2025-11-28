"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { isToday, isYesterday, isThisWeek, isThisMonth } from "date-fns";
import { Calendar, ChevronDown, Plus, RefreshCw, SortAsc } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMemories, useDeleteMemory } from "@/lib/hooks";
import { logMemoryAction } from "@/lib/activity";
import { MemoryCard } from "./memory-card";
import { CreateMemoryDialog } from "./create-memory-dialog";

type SortOrder = "newest" | "oldest" | "relevance";

interface MemoryItem {
  id: string;
  content: string;
  title?: string;
  type?: string;
  source?: string;
  tags?: string[];
  created_at: string;
  score?: number;
}

interface GroupedMemories {
  today: MemoryItem[];
  yesterday: MemoryItem[];
  thisWeek: MemoryItem[];
  thisMonth: MemoryItem[];
  older: MemoryItem[];
}

function groupMemoriesByDate(memories: MemoryItem[]): GroupedMemories {
  return memories.reduce(
    (groups, memory) => {
      const date = new Date(memory.created_at);
      if (isToday(date)) {
        groups.today.push(memory);
      } else if (isYesterday(date)) {
        groups.yesterday.push(memory);
      } else if (isThisWeek(date)) {
        groups.thisWeek.push(memory);
      } else if (isThisMonth(date)) {
        groups.thisMonth.push(memory);
      } else {
        groups.older.push(memory);
      }
      return groups;
    },
    { today: [], yesterday: [], thisWeek: [], thisMonth: [], older: [] } as GroupedMemories
  );
}

export function MemoryList() {
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const { data, isLoading, refetch, isFetching } = useMemories({
    limit: 100,
    sort_by: sortOrder === "oldest" ? "created_at" : "-created_at",
  });

  const deleteMemory = useDeleteMemory();

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this memory?")) {
      await deleteMemory.mutateAsync(id);
      // Log memory deletion to database
      logMemoryAction("delete", id);
    }
  };

  const memories = (data?.memories || []) as MemoryItem[];
  const groupedMemories = groupMemoriesByDate(memories);

  const sortedGroups = [
    { label: "Today", memories: groupedMemories.today },
    { label: "Yesterday", memories: groupedMemories.yesterday },
    { label: "This Week", memories: groupedMemories.thisWeek },
    { label: "This Month", memories: groupedMemories.thisMonth },
    { label: "Older", memories: groupedMemories.older },
  ].filter((group) => group.memories.length > 0);

  if (sortOrder === "oldest") {
    sortedGroups.reverse();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-violet-500/10 border border-violet-500/20">
            <Calendar className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h3 className="font-semibold">Memory Timeline</h3>
            <p className="text-sm text-muted-foreground">
              {memories.length} memories stored
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <SortAsc className="w-4 h-4" />
                {sortOrder === "newest" ? "Newest First" : "Oldest First"}
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSortOrder("newest")}>
                Newest First
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortOrder("oldest")}>
                Oldest First
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            size="sm"
            className="bg-violet-600 hover:bg-violet-700 gap-2"
            onClick={() => setShowCreateDialog(true)}
          >
            <Plus className="w-4 h-4" />
            New Memory
          </Button>
        </div>
      </div>

      {/* Timeline */}
      <ScrollArea className="h-[calc(100vh-400px)]">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Skeleton className="h-8 w-8 rounded-md" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : memories.length > 0 ? (
          <div className="space-y-8">
            {sortedGroups.map((group) => (
              <motion.div
                key={group.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-sm font-medium text-muted-foreground px-3 py-1 rounded-full bg-muted">
                    {group.label}
                  </span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {group.memories.map((memory) => (
                    <MemoryCard
                      key={memory.id}
                      memory={memory}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="p-12 text-center">
              <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No memories yet</h3>
              <p className="text-muted-foreground mb-4">
                Start by creating your first memory or uploading a document
              </p>
              <Button
                className="bg-violet-600 hover:bg-violet-700"
                onClick={() => setShowCreateDialog(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Memory
              </Button>
            </CardContent>
          </Card>
        )}
      </ScrollArea>

      {/* Create Memory Dialog */}
      <CreateMemoryDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </div>
  );
}
