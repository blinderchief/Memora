"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Network,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RefreshCw,
  Filter,
  Search,
  User,
  Building2,
  Tag,
  Lightbulb,
  ChevronRight,
  X,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface Entity {
  id: string;
  name: string;
  type: "person" | "organization" | "topic" | "concept";
  memory_count: number;
  connections: number;
}

interface Connection {
  source: string;
  target: string;
  relationship: string;
  strength: number;
}

interface GraphData {
  entities: Entity[];
  connections: Connection[];
}

const entityTypeIcons = {
  person: User,
  organization: Building2,
  topic: Tag,
  concept: Lightbulb,
};

const entityTypeColors = {
  person: { bg: "bg-blue-500", text: "text-blue-500", light: "bg-blue-500/10" },
  organization: { bg: "bg-green-500", text: "text-green-500", light: "bg-green-500/10" },
  topic: { bg: "bg-purple-500", text: "text-purple-500", light: "bg-purple-500/10" },
  concept: { bg: "bg-orange-500", text: "text-orange-500", light: "bg-orange-500/10" },
};

export default function GraphPage() {
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [zoom, setZoom] = useState(1);
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchGraphData();
  }, []);

  const fetchGraphData = async () => {
    setIsLoading(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${baseUrl}/api/intelligence/connections/graph`);
      
      if (response.ok) {
        const data = await response.json();
        setGraphData(data.graph);
      } else {
        // Mock data for demo
        setGraphData({
          entities: [
            { id: "1", name: "Machine Learning", type: "topic", memory_count: 15, connections: 8 },
            { id: "2", name: "React", type: "topic", memory_count: 12, connections: 6 },
            { id: "3", name: "System Design", type: "topic", memory_count: 10, connections: 5 },
            { id: "4", name: "Neural Networks", type: "concept", memory_count: 8, connections: 4 },
            { id: "5", name: "State Management", type: "concept", memory_count: 7, connections: 3 },
            { id: "6", name: "Microservices", type: "concept", memory_count: 6, connections: 4 },
            { id: "7", name: "OpenAI", type: "organization", memory_count: 5, connections: 3 },
            { id: "8", name: "Google", type: "organization", memory_count: 4, connections: 2 },
            { id: "9", name: "John Doe", type: "person", memory_count: 3, connections: 2 },
            { id: "10", name: "Python", type: "topic", memory_count: 14, connections: 7 },
            { id: "11", name: "TypeScript", type: "topic", memory_count: 11, connections: 5 },
            { id: "12", name: "Deep Learning", type: "concept", memory_count: 9, connections: 5 },
          ],
          connections: [
            { source: "1", target: "4", relationship: "includes", strength: 0.9 },
            { source: "1", target: "12", relationship: "includes", strength: 0.85 },
            { source: "1", target: "10", relationship: "uses", strength: 0.8 },
            { source: "2", target: "5", relationship: "requires", strength: 0.75 },
            { source: "2", target: "11", relationship: "uses", strength: 0.9 },
            { source: "3", target: "6", relationship: "includes", strength: 0.7 },
            { source: "4", target: "12", relationship: "related", strength: 0.95 },
            { source: "7", target: "1", relationship: "develops", strength: 0.6 },
            { source: "8", target: "1", relationship: "develops", strength: 0.55 },
            { source: "10", target: "1", relationship: "used_for", strength: 0.85 },
          ],
        });
      }
    } catch (error) {
      console.error("Failed to fetch graph data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredEntities = graphData?.entities.filter((entity) => {
    if (filter !== "all" && entity.type !== filter) return false;
    if (searchQuery && !entity.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  }) || [];

  const getEntityPosition = (index: number, total: number) => {
    const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
    const radius = Math.min(250, 150 + total * 5);
    return {
      x: 300 + radius * Math.cos(angle),
      y: 250 + radius * Math.sin(angle),
    };
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.2, 2));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.2, 0.5));
  const handleResetZoom = () => setZoom(1);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500">
            <Network className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Knowledge Graph</h1>
            <p className="text-muted-foreground">
              Visualize connections in your memory network
            </p>
          </div>
        </div>
        <Button onClick={fetchGraphData} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search entities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="person">People</SelectItem>
            <SelectItem value="organization">Organizations</SelectItem>
            <SelectItem value="topic">Topics</SelectItem>
            <SelectItem value="concept">Concepts</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1 border rounded-lg p-1">
          <Button variant="ghost" size="icon" onClick={handleZoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm px-2 min-w-[3rem] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <Button variant="ghost" size="icon" onClick={handleZoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleResetZoom}>
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 flex-wrap">
        {Object.entries(entityTypeColors).map(([type, colors]) => {
          const Icon = entityTypeIcons[type as keyof typeof entityTypeIcons];
          return (
            <div key={type} className="flex items-center gap-2">
              <div className={cn("h-3 w-3 rounded-full", colors.bg)} />
              <span className="text-sm capitalize text-muted-foreground">
                {type}s
              </span>
            </div>
          );
        })}
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-4">
        {/* Graph Visualization */}
        <div className="lg:col-span-3">
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div
                ref={canvasRef}
                className="relative h-[500px] bg-muted/30 overflow-hidden"
                style={{ transform: `scale(${zoom})`, transformOrigin: "center" }}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredEntities.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <Network className="h-16 w-16 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No entities found</p>
                  </div>
                ) : (
                  <>
                    {/* Draw connections */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none">
                      {graphData?.connections.map((conn, idx) => {
                        const sourceEntity = filteredEntities.find((e) => e.id === conn.source);
                        const targetEntity = filteredEntities.find((e) => e.id === conn.target);
                        
                        if (!sourceEntity || !targetEntity) return null;
                        
                        const sourceIdx = filteredEntities.indexOf(sourceEntity);
                        const targetIdx = filteredEntities.indexOf(targetEntity);
                        const sourcePos = getEntityPosition(sourceIdx, filteredEntities.length);
                        const targetPos = getEntityPosition(targetIdx, filteredEntities.length);
                        
                        return (
                          <line
                            key={idx}
                            x1={sourcePos.x}
                            y1={sourcePos.y}
                            x2={targetPos.x}
                            y2={targetPos.y}
                            stroke="currentColor"
                            strokeOpacity={conn.strength * 0.3}
                            strokeWidth={Math.max(1, conn.strength * 3)}
                            className="text-muted-foreground"
                          />
                        );
                      })}
                    </svg>

                    {/* Draw entities */}
                    {filteredEntities.map((entity, index) => {
                      const pos = getEntityPosition(index, filteredEntities.length);
                      const colors = entityTypeColors[entity.type];
                      const Icon = entityTypeIcons[entity.type];
                      const size = Math.max(40, Math.min(80, 30 + entity.memory_count * 3));
                      
                      return (
                        <motion.div
                          key={entity.id}
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.05 }}
                          className={cn(
                            "absolute cursor-pointer transition-all hover:z-10",
                            selectedEntity?.id === entity.id && "z-10"
                          )}
                          style={{
                            left: pos.x - size / 2,
                            top: pos.y - size / 2,
                            width: size,
                            height: size,
                          }}
                          onClick={() => setSelectedEntity(entity)}
                        >
                          <div
                            className={cn(
                              "w-full h-full rounded-full flex items-center justify-center transition-all",
                              colors.light,
                              "hover:ring-4 ring-offset-2",
                              selectedEntity?.id === entity.id && "ring-4 ring-primary"
                            )}
                          >
                            <Icon className={cn("h-1/2 w-1/2", colors.text)} />
                          </div>
                          <div
                            className="absolute left-1/2 -translate-x-1/2 mt-1 whitespace-nowrap text-xs font-medium text-center max-w-[80px] truncate"
                            title={entity.name}
                          >
                            {entity.name}
                          </div>
                        </motion.div>
                      );
                    })}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Entity Details */}
          {selectedEntity ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Badge
                      variant="secondary"
                      className={cn(
                        entityTypeColors[selectedEntity.type].light,
                        entityTypeColors[selectedEntity.type].text
                      )}
                    >
                      {selectedEntity.type}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => setSelectedEntity(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardTitle className="text-lg">{selectedEntity.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-2xl font-bold">{selectedEntity.memory_count}</p>
                      <p className="text-xs text-muted-foreground">Memories</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-2xl font-bold">{selectedEntity.connections}</p>
                      <p className="text-xs text-muted-foreground">Connections</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Connected To:</p>
                    <div className="space-y-1">
                      {graphData?.connections
                        .filter(
                          (c) =>
                            c.source === selectedEntity.id ||
                            c.target === selectedEntity.id
                        )
                        .slice(0, 5)
                        .map((conn, idx) => {
                          const otherId =
                            conn.source === selectedEntity.id
                              ? conn.target
                              : conn.source;
                          const otherEntity = graphData.entities.find(
                            (e) => e.id === otherId
                          );
                          if (!otherEntity) return null;
                          
                          return (
                            <button
                              key={idx}
                              className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-muted/50 text-sm"
                              onClick={() => setSelectedEntity(otherEntity)}
                            >
                              <span className="flex items-center gap-2">
                                {(() => {
                                  const Icon = entityTypeIcons[otherEntity.type];
                                  return (
                                    <Icon
                                      className={cn(
                                        "h-4 w-4",
                                        entityTypeColors[otherEntity.type].text
                                      )}
                                    />
                                  );
                                })()}
                                {otherEntity.name}
                              </span>
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            </button>
                          );
                        })}
                    </div>
                  </div>

                  <Button className="w-full" variant="outline" asChild>
                    <a href={`/search?q=${encodeURIComponent(selectedEntity.name)}`}>
                      View Related Memories
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <Info className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  Click on an entity to see details
                </p>
              </CardContent>
            </Card>
          )}

          {/* Entity List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Top Entities</CardTitle>
              <CardDescription>
                Entities with most connections
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {filteredEntities
                .sort((a, b) => b.connections - a.connections)
                .slice(0, 8)
                .map((entity) => {
                  const Icon = entityTypeIcons[entity.type];
                  const colors = entityTypeColors[entity.type];
                  
                  return (
                    <button
                      key={entity.id}
                      className={cn(
                        "flex items-center justify-between w-full p-2 rounded-lg hover:bg-muted/50 text-sm transition-colors",
                        selectedEntity?.id === entity.id && "bg-muted"
                      )}
                      onClick={() => setSelectedEntity(entity)}
                    >
                      <span className="flex items-center gap-2">
                        <Icon className={cn("h-4 w-4", colors.text)} />
                        <span className="truncate max-w-[120px]">{entity.name}</span>
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {entity.connections}
                      </Badge>
                    </button>
                  );
                })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
