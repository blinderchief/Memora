"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  FileText,
  Lightbulb,
  CheckCircle,
  MessageSquare,
  HelpCircle,
  Star,
  BookOpen,
  Clipboard,
  Link as LinkIcon,
  MoreHorizontal,
  Copy,
  ExternalLink,
  Trash2,
  Edit3,
  Clock,
} from "lucide-react";
import { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MemoryCardProps {
  memory: {
    id: string;
    content: string;
    title?: string;
    type?: string;
    source?: string;
    tags?: string[];
    created_at?: string;
    score?: number;
    highlights?: string[];
  };
  showScore?: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const TYPE_ICONS: Record<string, LucideIcon> = {
  insight: Lightbulb,
  decision: CheckCircle,
  action_item: Clipboard,
  meeting_note: MessageSquare,
  research: BookOpen,
  question: HelpCircle,
  feedback: Star,
  idea: Lightbulb,
  reference: LinkIcon,
  default: FileText,
};

const TYPE_COLORS: Record<string, string> = {
  insight: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  decision: "bg-green-500/10 text-green-500 border-green-500/20",
  action_item: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  meeting_note: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  research: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
  question: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  feedback: "bg-pink-500/10 text-pink-500 border-pink-500/20",
  idea: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  reference: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
  default: "bg-gray-500/10 text-gray-500 border-gray-500/20",
};

export function MemoryCard({ memory, showScore, onEdit, onDelete }: MemoryCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const Icon = TYPE_ICONS[memory.type || "default"] || TYPE_ICONS.default;
  const colorClass = TYPE_COLORS[memory.type || "default"] || TYPE_COLORS.default;

  const displayContent = isExpanded
    ? (memory.content || "")
    : (memory.content?.slice(0, 200) || "") + ((memory.content?.length || 0) > 200 ? "..." : "");

  const handleCopy = async () => {
    await navigator.clipboard.writeText(memory.content || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const scorePercentage = memory.score ? (memory.score * 100).toFixed(1) : null;

  return (
    <Card className="group hover:border-violet-500/50 transition-all duration-200 hover:shadow-lg hover:shadow-violet-500/5">
      <CardHeader className="p-4 pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className={`p-1.5 rounded-md border ${colorClass}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              {memory.title ? (
                <h3 className="font-medium text-sm truncate">{memory.title}</h3>
              ) : (
                <h3 className="font-medium text-sm truncate">
                  {memory.content?.slice(0, 50) || "Untitled"}...
                </h3>
              )}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {memory.type && (
                  <span className="capitalize">{memory.type.replace("_", " ")}</span>
                )}
                {memory.created_at && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDistanceToNow(new Date(memory.created_at), { addSuffix: true })}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {showScore && scorePercentage && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="secondary" className="text-xs font-mono">
                    {scorePercentage}%
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Relevance score</p>
                </TooltipContent>
              </Tooltip>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleCopy}>
                  <Copy className="w-4 h-4 mr-2" />
                  {copied ? "Copied!" : "Copy content"}
                </DropdownMenuItem>
                {memory.source && (
                  <DropdownMenuItem>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View source
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(memory.id)}>
                    <Edit3 className="w-4 h-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem
                    onClick={() => onDelete(memory.id)}
                    className="text-red-500 focus:text-red-500"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-0">
        <p
          className="text-sm text-muted-foreground leading-relaxed cursor-pointer"
          onClick={() => (memory.content?.length || 0) > 200 && setIsExpanded(!isExpanded)}
        >
          {memory.highlights && memory.highlights.length > 0 ? (
            <span
              dangerouslySetInnerHTML={{
                __html: memory.highlights[0],
              }}
            />
          ) : (
            displayContent
          )}
        </p>

        {(memory.content?.length || 0) > 200 && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 h-7 text-xs text-violet-400 hover:text-violet-300"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? "Show less" : "Show more"}
          </Button>
        )}

        {memory.tags && memory.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {memory.tags.slice(0, 5).map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="text-xs font-normal"
              >
                #{tag}
              </Badge>
            ))}
            {memory.tags.length > 5 && (
              <Badge variant="outline" className="text-xs font-normal">
                +{memory.tags.length - 5} more
              </Badge>
            )}
          </div>
        )}

        {memory.source && (
          <div className="flex items-center gap-1 mt-3 text-xs text-muted-foreground">
            <LinkIcon className="w-3 h-3" />
            <span className="truncate">{memory.source}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
