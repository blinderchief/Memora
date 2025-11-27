"use client";

import { useState, useRef, useEffect } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

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
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  created_at: Date;
}

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
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/intelligence/agent/chat`,
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

      if (!conversationId) {
        setConversationId(data.conversation_id);
      }

      const assistantMessage: Message = {
        id: data.message_id,
        role: "assistant",
        content: data.content,
        memories_used: data.memories_used,
        follow_up_questions: data.follow_up_questions,
        timestamp: new Date(),
        confidence: data.confidence,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      // Add error message
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content:
            "I apologize, but I encountered an error processing your request. Please try again.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleNewConversation = () => {
    setMessages([]);
    setConversationId(null);
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
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
            The AI uses your memories to provide personalized, contextual
            responses.
          </p>
        </div>
      </div>
    </div>
  );
}
