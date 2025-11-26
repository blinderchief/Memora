"use client";

import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Lightbulb, 
  CheckCircle, 
  Clipboard, 
  MessageSquare, 
  BookOpen,
  HelpCircle,
  Star,
  LinkIcon,
  X,
  Loader2
} from "lucide-react";
import { useCreateMemory } from "@/lib/hooks";

interface CreateMemoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MEMORY_TYPES = [
  { value: "insight", label: "Insight", icon: Lightbulb, color: "text-amber-500" },
  { value: "decision", label: "Decision", icon: CheckCircle, color: "text-green-500" },
  { value: "action_item", label: "Action Item", icon: Clipboard, color: "text-blue-500" },
  { value: "meeting_note", label: "Meeting Note", icon: MessageSquare, color: "text-purple-500" },
  { value: "research", label: "Research", icon: BookOpen, color: "text-cyan-500" },
  { value: "question", label: "Question", icon: HelpCircle, color: "text-orange-500" },
  { value: "feedback", label: "Feedback", icon: Star, color: "text-pink-500" },
  { value: "reference", label: "Reference", icon: LinkIcon, color: "text-indigo-500" },
];

export function CreateMemoryDialog({ open, onOpenChange }: CreateMemoryDialogProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState("insight");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [source, setSource] = useState("");

  const createMemory = useCreateMemory();

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleSubmit = async () => {
    if (!content.trim()) return;

    await createMemory.mutateAsync({
      title: title.trim() || undefined,
      content: content.trim(),
      type,
      tags: tags.length > 0 ? tags : undefined,
      source: source.trim() || undefined,
    });

    // Reset form
    setTitle("");
    setContent("");
    setType("insight");
    setTags([]);
    setSource("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Memory</DialogTitle>
          <DialogDescription>
            Store a new piece of knowledge in your memory bank.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Title */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Title (optional)</label>
            <Input
              placeholder="Give your memory a title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Content *</label>
            <textarea
              className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
              placeholder="What do you want to remember?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>

          {/* Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Type</label>
            <div className="grid grid-cols-4 gap-2">
              {MEMORY_TYPES.map((memType) => (
                <Button
                  key={memType.value}
                  type="button"
                  variant={type === memType.value ? "default" : "outline"}
                  size="sm"
                  className={`gap-2 justify-start ${
                    type === memType.value 
                      ? "bg-violet-600 hover:bg-violet-700" 
                      : ""
                  }`}
                  onClick={() => setType(memType.value)}
                >
                  <memType.icon className={`w-4 h-4 ${type === memType.value ? "" : memType.color}`} />
                  <span className="truncate text-xs">{memType.label}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Tags</label>
            <Input
              placeholder="Add tags (press Enter)"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
            />
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="gap-1 pr-1"
                  >
                    #{tag}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 hover:bg-transparent"
                      onClick={() => handleRemoveTag(tag)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Source */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Source (optional)</label>
            <Input
              placeholder="URL or reference..."
              value={source}
              onChange={(e) => setSource(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!content.trim() || createMemory.isPending}
            className="bg-violet-600 hover:bg-violet-700"
          >
            {createMemory.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Memory"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
