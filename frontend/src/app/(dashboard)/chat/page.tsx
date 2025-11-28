"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Send,
  Sparkles,
  User,
  Bot,
  ThumbsUp,
  ThumbsDown,
  Copy,
  RotateCcw,
  Loader2,
  Brain,
  Lightbulb,
  BookOpen,
  ArrowRight,
  History,
  Trash2,
  Plus,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useUser } from "@clerk/nextjs";

interface Memory {
  id: string;
  title: string;
  content: string;
  relevance_score: number;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  memories_used?: Memory[];
  follow_up_questions?: string[];
  timestamp: Date;
  confidence?: number;
  sources?: Memory[];
}

interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  is_archived: boolean;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const suggestedPrompts = [
  {
    icon: Brain,
    text: "What have I learned about machine learning recently?",
    color: "text-purple-500",
  },
  {
    icon: Lightbulb,
    text: "Find connections between my different project ideas",
    color: "text-yellow-500",
  },
  {
    icon: BookOpen,
    text: "Summarize my notes on productivity techniques",
    color: "text-blue-500",
  },
];

export default function ChatPage() {
  const { user } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [showSidebar, setShowSidebar] = useState(true);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const sessionsEndRef = useRef<HTMLDivElement>(null);

  const userId = user?.id || "demo-user";

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const scrollSessionsToTop = () => {
    // Scroll to show most recent sessions at top
    setTimeout(() => {
      sessionsEndRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Scroll sessions list when new sessions are added
  useEffect(() => {
    if (sessions.length > 0) {
      scrollSessionsToTop();
    }
  }, [sessions]);

  // Load chat sessions from Neon
  const loadSessions = useCallback(async () => {
    try {
      setIsLoadingSessions(true);
      const response = await fetch(`${API_URL}/api/chat/sessions`, {
        headers: { "X-User-Id": userId },
      });
      if (response.ok) {
        const data = await response.json();
        setSessions(data);
        // Clear any previous connection errors since we're connected now
        setError(null);
      }
    } catch {
      // Silently fail - sessions won't load but chat can still work
    } finally {
      setIsLoadingSessions(false);
    }
  }, [userId]);

  // Load messages for a session
  const loadSessionMessages = async (sessId: string) => {
    try {
      const response = await fetch(
        `${API_URL}/api/chat/sessions/${sessId}/messages`,
        {
          headers: { "X-User-Id": userId },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setMessages(
          data.map((msg: Message & { created_at: string }) => ({
            ...msg,
            timestamp: new Date(msg.created_at),
            memories_used: msg.sources,
          }))
        );
        setSessionId(sessId);
      }
    } catch (error) {
      console.error("Failed to load messages:", error);
    }
  };

  // Create a new session
  const createSession = async (title: string = "New Chat"): Promise<string | null> => {
    try {
      const response = await fetch(`${API_URL}/api/chat/sessions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": userId,
        },
        body: JSON.stringify({ title }),
      });
      if (response.ok) {
        const data = await response.json();
        setError(null);
        await loadSessions();
        return data.id;
      } else if (response.status === 503) {
        setError("Database not configured. Chat history is disabled.");
        // Return a temporary session ID for in-memory chat
        return `temp-${Date.now()}`;
      } else {
        setError(`Server error: ${response.status}`);
        return `temp-${Date.now()}`;
      }
    } catch {
      // Network error - backend might not be running (silently handle)
      setError("Cannot connect to server. Chat works but won't be saved.");
      // Return a temporary session ID so chat can still work in-memory
      return `temp-${Date.now()}`;
    }
  };

  // Save message to Neon
  const saveMessage = async (
    sessId: string,
    role: string,
    content: string,
    sources?: Memory[],
    confidence?: number
  ) => {
    // Skip saving for temporary in-memory sessions
    if (sessId.startsWith("temp-")) {
      return;
    }
    
    try {
      await fetch(`${API_URL}/api/chat/sessions/${sessId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": userId,
        },
        body: JSON.stringify({
          role,
          content,
          sources: sources || null,
          confidence: confidence || null,
        }),
      });
    } catch (err) {
      // Silently fail - chat still works without persistence
      console.debug("Failed to save message:", err);
    }
  };

  // Delete a session
  const deleteSession = async (sessId: string) => {
    try {
      await fetch(`${API_URL}/api/chat/sessions/${sessId}`, {
        method: "DELETE",
        headers: { "X-User-Id": userId },
      });
      await loadSessions();
      if (sessionId === sessId) {
        handleNewConversation();
      }
    } catch (error) {
      console.error("Failed to delete session:", error);
    }
  };

  // Load sessions on mount
  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const handleSend = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || isLoading) return;

    // Create session if needed
    let currentSessionId = sessionId;
    if (!currentSessionId) {
      const title = text.slice(0, 50) + (text.length > 50 ? "..." : "");
      currentSessionId = await createSession(title);
      if (!currentSessionId) {
        // Use a temporary in-memory session
        currentSessionId = `temp-${Date.now()}`;
      }
      setSessionId(currentSessionId);
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Save user message to Neon
    await saveMessage(currentSessionId, "user", text);

    try {
      // Don't send temp session IDs to the backend - they expect valid UUIDs
      const conversationId = currentSessionId.startsWith("temp-") ? null : currentSessionId;
      
      const response = await fetch(
        `${API_URL}/api/intelligence/agent/chat`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            conversation_id: conversationId,
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to get response");

      const data = await response.json();

      const assistantMessage: Message = {
        id: data.message_id || Date.now().toString(),
        role: "assistant",
        content: data.content,
        memories_used: data.memories_used,
        follow_up_questions: data.follow_up_questions,
        timestamp: new Date(),
        confidence: data.confidence,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Save assistant message to Neon
      await saveMessage(
        currentSessionId,
        "assistant",
        data.content,
        data.memories_used,
        data.confidence
      );

      // Refresh sessions to update the timestamp
      await loadSessions();
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content:
          "I apologize, but I encountered an error processing your request. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      await saveMessage(currentSessionId, "assistant", errorMessage.content);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleNewConversation = () => {
    setMessages([]);
    setSessionId(null);
    inputRef.current?.focus();
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] relative">
      {/* Toggle Sidebar Button - Always visible */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "absolute top-1/2 -translate-y-1/2 z-20 h-8 w-8 rounded-full border bg-background shadow-md hover:bg-accent transition-all",
          showSidebar ? "left-[268px]" : "left-2"
        )}
        onClick={() => setShowSidebar(!showSidebar)}
      >
        {showSidebar ? (
          <ChevronLeft className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </Button>

      {/* Sessions Sidebar */}
      <AnimatePresence mode="wait">
        {showSidebar && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="border-r bg-muted/30 flex flex-col"
          >
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4" />
                <span className="font-medium">Chat History</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleNewConversation}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                <div ref={sessionsEndRef} />
                {isLoadingSessions ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    No conversations yet
                  </div>
                ) : (
                  sessions.map((session) => (
                    <div
                      key={session.id}
                      className={cn(
                        "group flex items-center gap-2 rounded-lg px-3 py-2 text-sm cursor-pointer transition-colors",
                        sessionId === session.id
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-muted"
                      )}
                      onClick={() => loadSessionMessages(session.id)}
                    >
                      <MessageSquare className="h-4 w-4 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="truncate font-medium">{session.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(session.updated_at)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSession(session.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
              <MessageSquare className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">Memory Agent</h1>
              <p className="text-sm text-muted-foreground">
                Chat with your memories using AI
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleNewConversation}>
            <RotateCcw className="h-4 w-4 mr-2" />
            New Chat
          </Button>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center justify-between">
            <p className="text-sm text-amber-600 dark:text-amber-400">
              ⚠️ {error} Chat will work but won&apos;t be saved.
            </p>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-amber-600 hover:text-amber-700"
              onClick={() => setError(null)}
            >
              Dismiss
            </Button>
          </div>
        )}

        {/* Messages Area */}
        <ScrollArea className="flex-1 px-6">
          <div className="max-w-4xl mx-auto py-6">
            {messages.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center h-full min-h-[400px] text-center"
              >
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 mb-6">
                  <Sparkles className="h-10 w-10 text-purple-500" />
                </div>
                <h2 className="text-2xl font-semibold mb-2">
                  Your AI Memory Assistant
                </h2>
                <p className="text-muted-foreground max-w-md mb-8">
                  Ask questions about your memories, find connections, get
                  insights, or explore your knowledge base through conversation.
                </p>

                <div className="grid gap-3 w-full max-w-lg">
                  {suggestedPrompts.map((prompt, index) => (
                    <motion.button
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => handleSend(prompt.text)}
                      className="flex items-center gap-3 p-4 rounded-xl border bg-card hover:bg-accent transition-colors text-left group"
                    >
                      <prompt.icon className={cn("h-5 w-5", prompt.color)} />
                      <span className="flex-1 text-sm">{prompt.text}</span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            ) : (
              <div className="space-y-6">
                <AnimatePresence mode="popLayout">
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className={cn(
                        "flex gap-4",
                        message.role === "user" ? "justify-end" : "justify-start"
                      )}
                    >
                      {message.role === "assistant" && (
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500">
                          <Bot className="h-4 w-4 text-white" />
                        </div>
                      )}

                      <div
                        className={cn(
                          "flex flex-col max-w-[80%] space-y-2",
                          message.role === "user" ? "items-end" : "items-start"
                        )}
                      >
                        <div
                          className={cn(
                            "rounded-2xl px-4 py-3",
                            message.role === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          )}
                        >
                          <p className="whitespace-pre-wrap text-sm">
                            {message.content}
                          </p>
                        </div>

                        {/* Sources/Memories Used */}
                        {message.memories_used &&
                          message.memories_used.length > 0 && (
                            <div className="space-y-2 w-full">
                              <p className="text-xs text-muted-foreground">
                                Sources used ({message.memories_used.length})
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {message.memories_used
                                  .slice(0, 3)
                                  .map((memory, idx) => (
                                    <Badge
                                      key={idx}
                                      variant="secondary"
                                      className="text-xs cursor-pointer hover:bg-accent"
                                      title={memory.content}
                                    >
                                      {memory.title || `Memory ${idx + 1}`}
                                    </Badge>
                                  ))}
                                {message.memories_used.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{message.memories_used.length - 3} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}

                        {/* Follow-up Questions */}
                        {message.follow_up_questions &&
                          message.follow_up_questions.length > 0 && (
                            <div className="space-y-2 w-full">
                              <p className="text-xs text-muted-foreground">
                                Follow-up questions
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {message.follow_up_questions.map((q, idx) => (
                                  <Button
                                    key={idx}
                                    variant="outline"
                                    size="sm"
                                    className="text-xs h-auto py-1.5"
                                    onClick={() => handleSend(q)}
                                  >
                                    {q}
                                  </Button>
                                ))}
                              </div>
                            </div>
                          )}

                        {/* Message Actions */}
                        {message.role === "assistant" && (
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => handleCopy(message.content)}
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                            >
                              <ThumbsUp className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                            >
                              <ThumbsDown className="h-3.5 w-3.5" />
                            </Button>
                            {message.confidence && (
                              <span className="text-xs text-muted-foreground ml-2">
                                {Math.round(message.confidence * 100)}% confidence
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {message.role === "user" && (
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary">
                          <User className="h-4 w-4 text-primary-foreground" />
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Loading indicator */}
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-4"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex items-center gap-2 rounded-2xl bg-muted px-4 py-3">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">
                        Thinking...
                      </span>
                    </div>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t px-6 py-4">
          <div className="max-w-4xl mx-auto">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex gap-3"
            >
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your memories..."
                className="flex-1 h-12 px-4 text-base"
                disabled={isLoading}
              />
              <Button
                type="submit"
                size="lg"
                disabled={!input.trim() || isLoading}
                className="h-12 px-6"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </form>
            <p className="text-xs text-center text-muted-foreground mt-3">
              Your chat history is saved automatically to Neon database.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
