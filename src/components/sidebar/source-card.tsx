"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { getFileTypeLabel, getFileTypeColor, deleteDocument, type DeleteResponse } from "@/lib/api";
import { FileText, FileSpreadsheet, FileType, File, Trash2, Loader2 } from "lucide-react";

export interface SourceFile {
  id: string;
  filename: string;
  uploadedAt: Date;
  size_bytes?: number;
  file_type?: string;
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
  onDelete: (id: string, filename: string) => void;
}

export function SourceCard({ source, selected, onSelect, onDelete }: SourceCardProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteResult, setDeleteResult] = useState<DeleteResponse | null>(null);

  const isReady = source.status === "ready";
  const isUploading = source.status === "uploading";
  const isIndexing = source.status === "indexing";
  const isError = source.status === "error";

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteDocument(source.filename);
      setDeleteResult(result);
      setTimeout(() => {
        setShowConfirm(false);
        setDeleteResult(null);
        onDelete(source.id, source.filename);
      }, 2000);
    } catch (err) {
      setDeleteResult(null);
      setIsDeleting(false);
      alert(err instanceof Error ? err.message : "削除に失敗しました");
    }
  };

  return (
    <>
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
            {isReady && (
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 ml-auto opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowConfirm(true);
                }}
                title="削除"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
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

      <Dialog open={showConfirm} onOpenChange={(open) => {
        if (!isDeleting) setShowConfirm(open);
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">ドキュメントの削除</DialogTitle>
            <DialogDescription>
              <span className="font-medium text-foreground">{source.filename}</span> を削除しますか？
              この操作は元に戻せません。
            </DialogDescription>
          </DialogHeader>

          {deleteResult && (
            <div className="rounded-lg border border-accent/30 bg-accent/5 p-3 text-sm">
              <p className="text-accent font-medium mb-1">削除完了</p>
              <p className="text-xs text-muted-foreground">
                ベクトル: {deleteResult.deleted_vectors} 件削除 ・ レコード: {deleteResult.deleted_records} 件削除
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirm(false)}
              disabled={isDeleting}
              className="text-sm"
            >
              キャンセル
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting || !!deleteResult}
              className="text-sm"
            >
              {isDeleting && !deleteResult && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
              {deleteResult ? "完了" : isDeleting ? "削除中..." : "削除する"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
