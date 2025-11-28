import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: {
    "Content-Type": "application/json",
  },
});

// Set auth header with Clerk user ID
export function setAuthHeader(userId: string | null) {
  if (userId) {
    api.defaults.headers.common["X-Clerk-User-Id"] = userId;
  } else {
    delete api.defaults.headers.common["X-Clerk-User-Id"];
  }
}

// Types
export interface Memory {
  id: string;
  content: string;
  title?: string;
  memory_type: "document" | "note" | "conversation" | "image" | "audio" | "web";
  modality: "text" | "table" | "image" | "code" | "mixed";
  metadata: {
    author?: string;
    project?: string;
    tags: string[];
    source_file?: string;
    source_url?: string;
  };
  created_at: string;
  updated_at: string;
  version: number;
}

export interface SearchResult {
  id: string;
  content: string;
  title?: string;
  type?: string;
  source?: string;
  tags?: string[];
  created_at?: string;
  score: number;
  highlights?: string[];
}

export interface SearchResponse {
  success: boolean;
  query: string;
  mode: string;
  results: SearchResult[];
  total: number;
  took_ms: number;
  search_time_ms?: number;
}

export interface IngestResponse {
  success: boolean;
  document_id: string;
  filename?: string;
  chunks_created: number;
  memories_created: number;
  processing_time_ms: number;
  message?: string;
}

export interface User {
  id: string;
  clerk_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

// API Functions
export async function searchMemories(query: string, limit = 10): Promise<SearchResponse> {
  const response = await api.post("/search", {
    query,
    limit,
    mode: "hybrid",
    rerank: true,
    temporal_boost: true,
  });
  return response.data;
}

export async function quickSearch(query: string, limit = 10) {
  const response = await api.get("/search/quick", {
    params: { q: query, limit },
  });
  return response.data;
}

export async function getMemory(id: string): Promise<{ data: Memory }> {
  const response = await api.get(`/memories/${id}`);
  return response.data;
}

export async function listMemories(page = 1, pageSize = 20): Promise<{ data: Memory[]; total: number }> {
  const response = await api.get("/memories", {
    params: { page, page_size: pageSize },
  });
  return response.data;
}

export async function createMemory(data: {
  content: string;
  title?: string;
  type?: string;
  memory_type?: string;
  tags?: string[];
  source?: string;
}): Promise<{ data: Memory }> {
  const response = await api.post("/memories", data);
  return response.data;
}

export async function deleteMemory(id: string): Promise<void> {
  await api.delete(`/memories/${id}`);
}

export async function ingestText(data: {
  content: string;
  title?: string;
  author?: string;
  project?: string;
  tags?: string[];
}): Promise<IngestResponse> {
  const response = await api.post("/ingest/text", data);
  return response.data;
}

export async function ingestFile(
  file: File,
  options?: {
    title?: string;
    author?: string;
    project?: string;
    tags?: string;
    chunking_strategy?: "fixed" | "semantic" | "section";
    chunk_size?: number;
  }
): Promise<IngestResponse> {
  const formData = new FormData();
  formData.append("file", file);
  if (options?.title) formData.append("title", options.title);
  if (options?.author) formData.append("author", options.author);
  if (options?.project) formData.append("project", options.project);
  if (options?.tags) formData.append("tags", options.tags);
  if (options?.chunking_strategy) formData.append("chunking_strategy", options.chunking_strategy);
  if (options?.chunk_size) formData.append("chunk_size", options.chunk_size.toString());

  const response = await api.post("/ingest/file", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
}

export async function getHealthStatus() {
  const response = await api.get("/health/ready");
  return response.data;
}

// User API Functions
export async function getCurrentUser(): Promise<User> {
  const response = await api.get("/users/me");
  return response.data;
}

export async function getUserByClerkId(clerkId: string): Promise<User> {
  const response = await api.get(`/users/${clerkId}`);
  return response.data;
}
