"use client";

import { useState } from "react";
import {
  FolderKanban,
  Plus,
  Search,
  MoreVertical,
  Users,
  FileText,
  Clock,
  Star,
  StarOff,
  Settings,
  Trash2,
  Archive,
  Share2,
  Grid,
  List,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  memoryCount: number;
  memberCount: number;
  lastUpdated: string;
  starred: boolean;
  status: "active" | "archived";
}

const projects: Project[] = [
  {
    id: "1",
    name: "Product Development",
    description: "All product roadmap, specs, and feature discussions",
    color: "bg-violet-500",
    memoryCount: 234,
    memberCount: 8,
    lastUpdated: "2024-06-10T14:30:00Z",
    starred: true,
    status: "active",
  },
  {
    id: "2",
    name: "Customer Research",
    description: "User interviews, surveys, and feedback analysis",
    color: "bg-blue-500",
    memoryCount: 156,
    memberCount: 5,
    lastUpdated: "2024-06-10T10:00:00Z",
    starred: true,
    status: "active",
  },
  {
    id: "3",
    name: "Engineering Docs",
    description: "Technical documentation and architecture decisions",
    color: "bg-emerald-500",
    memoryCount: 89,
    memberCount: 12,
    lastUpdated: "2024-06-09T16:00:00Z",
    starred: false,
    status: "active",
  },
  {
    id: "4",
    name: "Marketing Assets",
    description: "Campaign materials, brand guidelines, and content",
    color: "bg-orange-500",
    memoryCount: 67,
    memberCount: 4,
    lastUpdated: "2024-06-08T09:00:00Z",
    starred: false,
    status: "active",
  },
  {
    id: "5",
    name: "Sales Playbook",
    description: "Sales processes, scripts, and competitive intel",
    color: "bg-pink-500",
    memoryCount: 45,
    memberCount: 6,
    lastUpdated: "2024-06-07T14:00:00Z",
    starred: false,
    status: "active",
  },
  {
    id: "6",
    name: "Q1 Planning (Archived)",
    description: "Q1 2024 planning documents and meeting notes",
    color: "bg-slate-400",
    memoryCount: 123,
    memberCount: 10,
    lastUpdated: "2024-04-01T12:00:00Z",
    starred: false,
    status: "archived",
  },
];

const colorOptions = [
  { value: "violet", label: "Violet", class: "bg-violet-500" },
  { value: "blue", label: "Blue", class: "bg-blue-500" },
  { value: "emerald", label: "Green", class: "bg-emerald-500" },
  { value: "orange", label: "Orange", class: "bg-orange-500" },
  { value: "pink", label: "Pink", class: "bg-pink-500" },
  { value: "cyan", label: "Cyan", class: "bg-cyan-500" },
];

export default function ProjectsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [projectList, setProjectList] = useState(projects);

  const toggleStar = (id: string) => {
    setProjectList((prev) =>
      prev.map((p) => (p.id === id ? { ...p, starred: !p.starred } : p))
    );
  };

  const filteredProjects = projectList.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase());

    if (filter === "starred") return matchesSearch && project.starred;
    if (filter === "archived") return matchesSearch && project.status === "archived";
    if (filter === "active") return matchesSearch && project.status === "active";
    return matchesSearch;
  });

  const stats = {
    total: projects.filter((p) => p.status === "active").length,
    totalMemories: projects.reduce((sum, p) => sum + p.memoryCount, 0),
    starred: projects.filter((p) => p.starred).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Projects
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Organize your knowledge into focused workspaces
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-violet-600 hover:bg-violet-700">
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
              <DialogDescription>
                Projects help you organize related memories and collaborate with
                your team.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Project Name
                </label>
                <Input placeholder="e.g., Product Launch 2024" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Description
                </label>
                <Input placeholder="What is this project about?" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Color
                </label>
                <div className="flex gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color.value}
                      className={`h-8 w-8 rounded-full ${color.class} ring-2 ring-offset-2 ring-transparent hover:ring-slate-300 transition-all`}
                    />
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button
                className="bg-violet-600 hover:bg-violet-700"
                onClick={() => setIsCreateOpen(false)}
              >
                Create Project
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-violet-500/10">
                <FolderKanban className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {stats.total}
                </p>
                <p className="text-xs text-slate-500">Active Projects</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {stats.totalMemories}
                </p>
                <p className="text-xs text-slate-500">Total Memories</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <Star className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {stats.starred}
                </p>
                <p className="text-xs text-slate-500">Starred Projects</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="starred">Starred</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex border rounded-lg">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setViewMode("grid")}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Projects Grid/List */}
      {viewMode === "grid" ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => (
            <Card
              key={project.id}
              className={`group hover:shadow-md transition-shadow ${
                project.status === "archived" ? "opacity-60" : ""
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-3 w-3 rounded-full ${project.color}`} />
                    <CardTitle className="text-base">{project.name}</CardTitle>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => toggleStar(project.id)}
                    >
                      {project.starred ? (
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      ) : (
                        <StarOff className="h-4 w-4 text-slate-400" />
                      )}
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Settings className="h-4 w-4 mr-2" />
                          Settings
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Share2 className="h-4 w-4 mr-2" />
                          Share
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Archive className="h-4 w-4 mr-2" />
                          {project.status === "archived"
                            ? "Unarchive"
                            : "Archive"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="line-clamp-2 mb-4">
                  {project.description}
                </CardDescription>
                <div className="flex items-center justify-between text-sm text-slate-500">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {project.memoryCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {project.memberCount}
                    </span>
                  </div>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(project.lastUpdated).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredProjects.map((project) => (
                <div
                  key={project.id}
                  className={`flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                    project.status === "archived" ? "opacity-60" : ""
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`h-3 w-3 rounded-full ${project.color}`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-slate-900 dark:text-white">
                          {project.name}
                        </h4>
                        {project.starred && (
                          <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                        )}
                        {project.status === "archived" && (
                          <Badge variant="secondary">Archived</Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 line-clamp-1">
                        {project.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {project.memoryCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {project.memberCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(project.lastUpdated).toLocaleDateString()}
                      </span>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Settings className="h-4 w-4 mr-2" />
                          Settings
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Share2 className="h-4 w-4 mr-2" />
                          Share
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Archive className="h-4 w-4 mr-2" />
                          {project.status === "archived"
                            ? "Unarchive"
                            : "Archive"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {filteredProjects.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderKanban className="h-12 w-12 text-slate-400 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
              No projects found
            </h3>
            <p className="text-slate-500 text-center mb-4">
              {searchQuery
                ? "Try adjusting your search or filters"
                : "Create your first project to get started"}
            </p>
            {!searchQuery && (
              <Button
                className="bg-violet-600 hover:bg-violet-700"
                onClick={() => setIsCreateOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Project
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
