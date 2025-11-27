"use client";

import { MemoryList } from "@/components/memory/memory-list";

export default function TimelinePage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Memory Timeline</h1>
        <p className="text-muted-foreground mt-1">
          Browse your memories chronologically and track knowledge evolution
        </p>
      </div>
      <MemoryList />
    </div>
  );
}
