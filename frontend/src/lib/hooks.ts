"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  searchMemories,
  listMemories,
  createMemory,
  deleteMemory,
  ingestText,
  ingestFile,
} from "@/lib/api";

interface SearchOptions {
  query: string;
  mode?: "hybrid" | "semantic" | "keyword";
  types?: string[];
  temporal_boost?: boolean;
  limit?: number;
}

export function useSearch(options: SearchOptions) {
  const { query, mode = "hybrid", types, temporal_boost = true, limit = 20 } = options;
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["search", debouncedQuery, mode, types, temporal_boost, limit],
    queryFn: () => searchMemories(debouncedQuery, limit),
    enabled: debouncedQuery.length > 0,
    staleTime: 30000,
  });

  return {
    data,
    results: data?.results || [],
    total: data?.total || 0,
    isLoading,
    isFetching,
    error,
    refetch,
  };
}

interface MemoriesOptions {
  limit?: number;
  sort_by?: string;
}

export function useMemories(options: MemoriesOptions = {}) {
  const { limit = 100, sort_by = "-created_at" } = options;

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["memories", limit, sort_by],
    queryFn: () => listMemories(1, limit),
    staleTime: 30000,
  });

  return {
    data: {
      memories: data?.data || [],
      total: data?.total || 0,
    },
    isLoading,
    isFetching,
    error,
    refetch,
  };
}

export function useCreateMemory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createMemory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["memories"] });
    },
  });
}

export function useDeleteMemory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteMemory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["memories"] });
    },
  });
}

export function useIngestText() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ingestText,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["memories"] });
    },
  });
}

interface IngestFileOptions {
  file: File;
  title?: string;
  author?: string;
  project?: string;
  tags?: string;
  chunking_strategy?: "fixed" | "semantic" | "section";
  chunk_size?: number;
}

export function useIngestFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file, ...options }: IngestFileOptions) =>
      ingestFile(file, options),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["memories"] });
    },
  });
}

export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return { isOpen, setIsOpen };
}
