"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useDropzone } from "react-dropzone";
import {
  Upload,
  FileText,
  FileSpreadsheet,
  FileImage,
  File,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
  Settings2,
} from "lucide-react";
import { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useIngestFile } from "@/lib/hooks";

interface FileUpload {
  file: File;
  status: "pending" | "uploading" | "success" | "error";
  progress: number;
  error?: string;
  memoryCount?: number;
}

const FILE_TYPE_ICONS: Record<string, LucideIcon> = {
  "application/pdf": FileText,
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": FileText,
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": FileSpreadsheet,
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": FileImage,
  "text/plain": FileText,
  "text/markdown": FileText,
  "text/html": FileText,
  "application/json": FileText,
  "text/csv": FileSpreadsheet,
};

const CHUNKING_STRATEGIES = [
  { value: "semantic", label: "Semantic", description: "AI-powered chunks" },
  { value: "fixed", label: "Fixed Size", description: "Consistent chunks" },
  { value: "section", label: "Section-based", description: "By document structure" },
];

export function IngestPanel() {
  const [uploads, setUploads] = useState<FileUpload[]>([]);
  const [chunkingStrategy, setChunkingStrategy] = useState("semantic");
  const [chunkSize, setChunkSize] = useState(512);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const ingestFile = useIngestFile();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newUploads = acceptedFiles.map((file) => ({
      file,
      status: "pending" as const,
      progress: 0,
    }));
    setUploads((prev) => [...prev, ...newUploads]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],
      "text/plain": [".txt"],
      "text/markdown": [".md"],
      "text/html": [".html"],
      "application/json": [".json"],
      "text/csv": [".csv"],
    },
    maxSize: 50 * 1024 * 1024, // 50MB
  });

  const processFile = async (index: number) => {
    const upload = uploads[index];
    if (!upload || upload.status !== "pending") return;

    setUploads((prev) =>
      prev.map((u, i) =>
        i === index ? { ...u, status: "uploading" as const, progress: 30 } : u
      )
    );

    try {
      const result = await ingestFile.mutateAsync({
        file: upload.file,
        chunking_strategy: chunkingStrategy as "fixed" | "semantic" | "section",
        chunk_size: chunkSize,
      });

      setUploads((prev) =>
        prev.map((u, i) =>
          i === index
            ? {
                ...u,
                status: "success" as const,
                progress: 100,
                memoryCount: result.chunks_created,
              }
            : u
        )
      );
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Upload failed");
      setUploads((prev) =>
        prev.map((u, i) =>
          i === index
            ? {
                ...u,
                status: "error" as const,
                progress: 0,
                error: error.message || "Upload failed",
              }
            : u
        )
      );
    }
  };

  const processAllFiles = async () => {
    for (let i = 0; i < uploads.length; i++) {
      if (uploads[i].status === "pending") {
        await processFile(i);
      }
    }
  };

  const removeUpload = (index: number) => {
    setUploads((prev) => prev.filter((_, i) => i !== index));
  };

  const clearCompleted = () => {
    setUploads((prev) => prev.filter((u) => u.status !== "success"));
  };

  const pendingCount = uploads.filter((u) => u.status === "pending").length;
  const successCount = uploads.filter((u) => u.status === "success").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-violet-500/10 border border-violet-500/20">
            <Upload className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h3 className="font-semibold">Document Ingestion</h3>
            <p className="text-sm text-muted-foreground">
              Upload and process documents into memories
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="gap-2"
        >
          <Settings2 className="w-4 h-4" />
          Advanced
        </Button>
      </div>

      {/* Advanced Settings */}
      {showAdvanced && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Chunking Strategy</label>
                  <Select value={chunkingStrategy} onValueChange={setChunkingStrategy}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CHUNKING_STRATEGIES.map((strategy) => (
                        <SelectItem key={strategy.value} value={strategy.value}>
                          <div>
                            <div className="font-medium">{strategy.label}</div>
                            <div className="text-xs text-muted-foreground">
                              {strategy.description}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Chunk Size: {chunkSize} tokens
                  </label>
                  <input
                    type="range"
                    min={128}
                    max={2048}
                    step={64}
                    value={chunkSize}
                    onChange={(e) => setChunkSize(parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>128</span>
                    <span>2048</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Dropzone */}
      <Card
        {...getRootProps()}
        className={`border-2 border-dashed transition-colors cursor-pointer ${
          isDragActive
            ? "border-violet-500 bg-violet-500/5"
            : "border-border hover:border-violet-500/50"
        }`}
      >
        <CardContent className="p-8 text-center">
          <input {...getInputProps()} />
          <div className="flex flex-col items-center">
            <div className="p-4 rounded-full bg-violet-500/10 mb-4">
              <Upload className="w-8 h-8 text-violet-400" />
            </div>
            <h3 className="text-lg font-medium mb-2">
              {isDragActive ? "Drop files here" : "Upload Documents"}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Drag and drop files, or click to select
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {["PDF", "DOCX", "XLSX", "PPTX", "TXT", "MD", "HTML", "JSON", "CSV"].map(
                (ext) => (
                  <Badge key={ext} variant="outline" className="text-xs">
                    {ext}
                  </Badge>
                )
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload Queue */}
      {uploads.length > 0 && (
        <Card>
          <CardHeader className="p-4 pb-0">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">
                Upload Queue ({uploads.length})
              </CardTitle>
              <div className="flex gap-2">
                {successCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearCompleted}>
                    Clear completed
                  </Button>
                )}
                {pendingCount > 0 && (
                  <Button
                    size="sm"
                    className="bg-violet-600 hover:bg-violet-700"
                    onClick={processAllFiles}
                    disabled={ingestFile.isPending}
                  >
                    {ingestFile.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      `Process ${pendingCount} file${pendingCount > 1 ? "s" : ""}`
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-3">
              {uploads.map((upload, index) => {
                const FileIcon =
                  FILE_TYPE_ICONS[upload.file.type] || File;
                return (
                  <div
                    key={`${upload.file.name}-${index}`}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                  >
                    <div className="p-2 rounded-md bg-background">
                      <FileIcon className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {upload.file.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {(upload.file.size / 1024).toFixed(1)} KB
                        </span>
                        {upload.status === "success" && upload.memoryCount && (
                          <Badge variant="secondary" className="text-xs">
                            {upload.memoryCount} memories created
                          </Badge>
                        )}
                        {upload.status === "error" && (
                          <span className="text-xs text-red-500">
                            {upload.error}
                          </span>
                        )}
                      </div>
                      {upload.status === "uploading" && (
                        <Progress value={upload.progress} className="h-1 mt-2" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {upload.status === "pending" && (
                        <Badge variant="outline" className="text-xs">
                          Pending
                        </Badge>
                      )}
                      {upload.status === "uploading" && (
                        <Loader2 className="w-5 h-5 animate-spin text-violet-500" />
                      )}
                      {upload.status === "success" && (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      )}
                      {upload.status === "error" && (
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => removeUpload(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Supported Formats Info */}
      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <h4 className="text-sm font-medium mb-2">Supported Formats</h4>
          <div className="grid gap-2 md:grid-cols-3 text-sm text-muted-foreground">
            <div>
              <strong className="text-foreground">Documents:</strong> PDF, DOCX, TXT, MD
            </div>
            <div>
              <strong className="text-foreground">Spreadsheets:</strong> XLSX, CSV
            </div>
            <div>
              <strong className="text-foreground">Other:</strong> PPTX, HTML, JSON
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
