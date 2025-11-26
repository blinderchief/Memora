"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { 
  Search, 
  FileText, 
  Clock, 
  Upload, 
  Plus, 
  Settings,
  Brain
} from "lucide-react";
import { quickSearch } from "@/lib/api";

interface SearchResultItem {
  id: string;
  title?: string;
  content: string;
  score: number;
  type?: string;
}

interface CommandMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandMenu({ open, onOpenChange }: CommandMenuProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const data = await quickSearch(query, 5);
        setResults(data.results || []);
      } catch (error) {
        console.error("Search failed:", error);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (callback: () => void) => {
    onOpenChange(false);
    callback();
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search memories, documents, or type a command..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>
          {isSearching ? "Searching..." : "No results found. Start typing to search."}
        </CommandEmpty>

        {results.length > 0 && (
          <CommandGroup heading="Search Results">
            {results.map((result) => (
              <CommandItem
                key={result.id}
                onSelect={() => handleSelect(() => {
                  // Navigate to memory detail or expand
                  console.log("Selected:", result.id);
                })}
              >
                <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                <div className="flex flex-col">
                  <span className="font-medium">
                    {result.title || result.content.slice(0, 50) + "..."}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Score: {(result.score * 100).toFixed(1)}% • {result.type}
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandSeparator />

        <CommandGroup heading="Quick Actions">
          <CommandItem onSelect={() => handleSelect(() => router.push("/?tab=search"))}>
            <Search className="mr-2 h-4 w-4" />
            <span>Advanced Search</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect(() => router.push("/?tab=memories"))}>
            <Clock className="mr-2 h-4 w-4" />
            <span>View Timeline</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect(() => router.push("/?tab=ingest"))}>
            <Upload className="mr-2 h-4 w-4" />
            <span>Upload Document</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect(() => {})}>
            <Plus className="mr-2 h-4 w-4" />
            <span>Create New Memory</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => handleSelect(() => {})}>
            <Brain className="mr-2 h-4 w-4" />
            <span>Knowledge Graph</span>
            <span className="ml-auto text-xs text-muted-foreground">Coming Soon</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect(() => {})}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
