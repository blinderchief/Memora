"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Search, Upload, Clock, Sparkles } from "lucide-react";
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SearchPanel } from "@/components/search/search-panel";
import { MemoryList } from "@/components/memory/memory-list";
import { IngestPanel } from "@/components/ingest/ingest-panel";
import { CommandMenu } from "@/components/command-menu";
import { useCommandPalette } from "@/lib/hooks";

export default function Home() {
  const [activeTab, setActiveTab] = useState("search");
  const { isOpen, setIsOpen } = useCommandPalette();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95">
      {/* Command Palette */}
      <CommandMenu open={isOpen} onOpenChange={setIsOpen} />

      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-xl bg-background/80 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">Memora</h1>
                <p className="text-xs text-muted-foreground">Collaborative Memory OS</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                className="gap-2 text-muted-foreground hover:text-foreground"
                onClick={() => setIsOpen(true)}
              >
                <Search className="w-4 h-4" />
                <span className="hidden sm:inline">Quick Search</span>
                <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </Button>
              
              <SignedOut>
                <SignInButton mode="modal">
                  <Button variant="ghost" size="sm">Sign In</Button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <Button variant="default" size="sm">Sign Up</Button>
                </SignUpButton>
              </SignedOut>
              <SignedIn>
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: "h-9 w-9",
                    },
                  }}
                  afterSignOutUrl="/"
                />
              </SignedIn>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-sm mb-4">
            <Sparkles className="w-4 h-4" />
            AI-Powered Knowledge Management
          </div>
          <h2 className="text-4xl font-bold tracking-tight mb-4">
            Your Second Brain,{" "}
            <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
              Evolved
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Remember together, reason over time, retrieve contextually. 
            No insight is ever lost or repeated.
          </p>
        </motion.section>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 mb-8">
            <TabsTrigger value="search" className="gap-2">
              <Search className="w-4 h-4" />
              Search
            </TabsTrigger>
            <TabsTrigger value="memories" className="gap-2">
              <Clock className="w-4 h-4" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="ingest" className="gap-2">
              <Upload className="w-4 h-4" />
              Ingest
            </TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <TabsContent value="search" className="mt-0">
                <SearchPanel />
              </TabsContent>

              <TabsContent value="memories" className="mt-0">
                <MemoryList />
              </TabsContent>

              <TabsContent value="ingest" className="mt-0">
                <IngestPanel />
              </TabsContent>
            </motion.div>
          </AnimatePresence>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 mt-auto">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              Built for professional teams who need to remember everything.
            </p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Powered by Qdrant</span>
              <span>•</span>
              <span>Gemini Embeddings</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
