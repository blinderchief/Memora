"use client";

import { IngestPanel } from "@/components/ingest/ingest-panel";

export default function UploadPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Upload Documents</h1>
        <p className="text-muted-foreground mt-1">
          Add new knowledge to your memory by uploading documents
        </p>
      </div>
      <IngestPanel />
    </div>
  );
}
