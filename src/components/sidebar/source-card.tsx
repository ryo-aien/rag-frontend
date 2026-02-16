"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { getFileTypeLabel, getFileTypeColor } from "@/lib/api";
import { FileText, FileSpreadsheet, FileType, File } from "lucide-react";

export interface SourceFile {
  id: string;
  filename: string;
  uploadedAt: Date;
  size_bytes?: number;
  status: "uploading" | "indexing" | "ready" | "error";
  progress?: number;
  category?: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(filename: string) {
  const ext = filename.slice(filename.lastIndexOf(".")).toLowerCase();
  const iconClass = "h-4 w-4";
  switch (ext) {
    case ".pdf":
      return <FileText className={`${iconClass} text-rose-400`} />;
    case ".csv":
      return <FileSpreadsheet className={`${iconClass} text-amber-400`} />;
    case ".md":
      return <FileType className={`${iconClass} text-violet-400`} />;
    case ".txt":
      return <File className={`${iconClass} text-emerald-400`} />;
    default:
      return <File className={`${iconClass} text-muted-foreground`} />;
  }
}

interface SourceCardProps {
  source: SourceFile;
  selected: boolean;
  onSelect: (id: string, checked: boolean) => void;
}

export function SourceCard({ source, selected, onSelect }: SourceCardProps) {
  const isReady = source.status === "ready";
  const isUploading = source.status === "uploading";
  const isIndexing = source.status === "indexing";
  const isError = source.status === "error";

  return (
    <div
      className={`
        group relative flex items-start gap-3 p-3 rounded-lg border transition-all duration-200
        ${
          selected
            ? "border-primary/40 bg-primary/5"
            : "border-border/50 bg-card/50 hover:border-border hover:bg-card"
        }
        ${isError ? "border-destructive/30 bg-destructive/5" : ""}
        ${!isReady && !isError ? "opacity-70" : ""}
      `}
    >
      <Checkbox
        checked={selected}
        onCheckedChange={(checked) => onSelect(source.id, !!checked)}
        disabled={!isReady}
        className="mt-0.5 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {getFileIcon(source.filename)}
          <span className="text-sm font-medium truncate text-foreground/90">
            {source.filename}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={`text-[10px] px-1.5 py-0 font-mono ${getFileTypeColor(source.filename)}`}
          >
            {getFileTypeLabel(source.filename)}
          </Badge>

          {isReady && (
            <span className="text-[10px] text-muted-foreground">
              {source.size_bytes != null && (
                <>{formatFileSize(source.size_bytes)} · </>
              )}
              {source.uploadedAt.toLocaleDateString("ja-JP", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}

          {isUploading && (
            <span className="text-[10px] text-primary animate-pulse">
              アップロード中... {source.progress ?? 0}%
            </span>
          )}

          {isIndexing && (
            <span className="text-[10px] text-accent animate-pulse">
              インデックス中...
            </span>
          )}

          {isError && (
            <span className="text-[10px] text-destructive">
              エラー
            </span>
          )}
        </div>

        {(isUploading || isIndexing) && (
          <div className="mt-2 h-1 w-full rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isUploading ? "bg-primary" : "bg-accent"
              }`}
              style={{
                width: isUploading ? `${source.progress ?? 0}%` : "100%",
                animation: isIndexing ? "pulse 1.5s ease-in-out infinite" : undefined,
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
