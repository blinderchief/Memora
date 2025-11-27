"use client";

import { SearchPanel } from "@/components/search/search-panel";

export default function SearchPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Search Memories</h1>
        <p className="text-muted-foreground mt-1">
          Find insights from your knowledge base using AI-powered hybrid search
        </p>
      </div>
      <SearchPanel />
    </div>
  );
}
