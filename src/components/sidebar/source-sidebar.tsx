"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SourceCard, type SourceFile } from "./source-card";
import { uploadFile, triggerIndex, fetchDocuments, ACCEPTED_EXTENSIONS } from "@/lib/api";
import {
  Upload,
  Plus,
  FolderOpen,
  CheckSquare,
  Square,
  RefreshCw,
  Sparkles,
} from "lucide-react";

const CATEGORIES = [
  { value: "all", label: "全て" },
  { value: "regulation", label: "規程" },
  { value: "manual", label: "マニュアル" },
  { value: "report", label: "レポート" },
  { value: "other", label: "その他" },
];

interface SourceSidebarProps {
  sources: SourceFile[];
  setSources: React.Dispatch<React.SetStateAction<SourceFile[]>>;
  selectedIds: Set<string>;
  setSelectedIds: React.Dispatch<React.SetStateAction<Set<string>>>;
}

export function SourceSidebar({
  sources,
  setSources,
  selectedIds,
  setSelectedIds,
}: SourceSidebarProps) {
  const [activeCategory, setActiveCategory] = useState("all");
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadDocuments = useCallback(async () => {
    try {
      const data = await fetchDocuments();
      const existingFilenames = new Set(sources.map((s) => s.filename));
      const serverDocs: SourceFile[] = data.documents
        .filter((doc) => !existingFilenames.has(doc.filename))
        .map((doc) => ({
          id: crypto.randomUUID(),
          filename: doc.filename,
          uploadedAt: new Date(doc.updated_at),
          size_bytes: doc.size_bytes,
          status: "ready" as const,
          category: "other",
        }));

      if (serverDocs.length > 0) {
        setSources((prev) => {
          const prevFilenames = new Set(prev.map((s) => s.filename));
          const newDocs = serverDocs.filter((d) => !prevFilenames.has(d.filename));
          return [...prev, ...newDocs];
        });
      }
    } catch {
      // silently fail - API may not be available
    }
  }, [sources, setSources]);

  useEffect(() => {
    loadDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files).filter((f) => {
        const ext = f.name.slice(f.name.lastIndexOf(".")).toLowerCase();
        return ACCEPTED_EXTENSIONS.includes(ext);
      });

      for (const file of fileArray) {
        const id = crypto.randomUUID();
        const newSource: SourceFile = {
          id,
          filename: file.name,
          uploadedAt: new Date(),
          status: "uploading",
          progress: 0,
          category: "other",
        };

        setSources((prev) => [newSource, ...prev]);

        try {
          await uploadFile(file, (percent) => {
            setSources((prev) =>
              prev.map((s) =>
                s.id === id ? { ...s, progress: percent } : s
              )
            );
          });

          setSources((prev) =>
            prev.map((s) =>
              s.id === id ? { ...s, status: "indexing", progress: undefined } : s
            )
          );

          // Auto-mark as ready after a delay (fire-and-forget indexing)
          setTimeout(async () => {
            // Fetch latest doc info from server to get size_bytes
            try {
              const data = await fetchDocuments();
              const docInfo = data.documents.find((d) => d.filename === file.name);
              setSources((prev) =>
                prev.map((s) =>
                  s.id === id
                    ? {
                        ...s,
                        status: "ready",
                        size_bytes: docInfo?.size_bytes,
                        uploadedAt: docInfo ? new Date(docInfo.updated_at) : s.uploadedAt,
                      }
                    : s
                )
              );
            } catch {
              setSources((prev) =>
                prev.map((s) =>
                  s.id === id ? { ...s, status: "ready" } : s
                )
              );
            }
            setSelectedIds((prev) => {
              const next = new Set(Array.from(prev));
              next.add(id);
              return next;
            });
          }, 3000);
        } catch {
          setSources((prev) =>
            prev.map((s) =>
              s.id === id ? { ...s, status: "error" } : s
            )
          );
        }
      }
    },
    [setSources, setSelectedIds]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  const handleSelect = useCallback(
    (id: string, checked: boolean) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (checked) next.add(id);
        else next.delete(id);
        return next;
      });
    },
    [setSelectedIds]
  );

  const handleReindex = useCallback(async () => {
    try {
      await triggerIndex();
    } catch {
      // silently fail
    }
  }, []);

  const filteredSources =
    activeCategory === "all"
      ? sources
      : sources.filter((s) => s.category === activeCategory);

  const readySources = filteredSources.filter((s) => s.status === "ready");
  const allReadySelected = readySources.length > 0 && readySources.every((s) => selectedIds.has(s.id));

  const handleSelectAll = () => {
    const readyIds = readySources.map((s) => s.id);
    if (allReadySelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        readyIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(Array.from(prev));
        readyIds.forEach((id) => next.add(id));
        return next;
      });
    }
  };

  return (
    <div className="flex flex-col h-full bg-[hsl(var(--sidebar))]">
      {/* Header */}
      <div className="p-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-primary/10">
              <FolderOpen className="h-4 w-4 text-primary" />
            </div>
            <h2 className="text-sm font-semibold tracking-tight">ソース</h2>
            {sources.length > 0 && (
              <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full font-mono">
                {sources.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={handleReindex}
              title="再インデックス"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Category Tabs */}
        <Tabs value={activeCategory} onValueChange={setActiveCategory}>
          <TabsList className="h-7 w-full bg-muted/50 p-0.5">
            {CATEGORIES.map((cat) => (
              <TabsTrigger
                key={cat.value}
                value={cat.value}
                className="text-[10px] h-6 px-2 data-[state=active]:bg-card data-[state=active]:text-foreground"
              >
                {cat.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <Separator className="opacity-50" />

      {/* Upload Drop Zone */}
      <div className="px-3 pt-3">
        <div
          className={`
            relative rounded-lg border-2 border-dashed p-4 text-center cursor-pointer
            transition-all duration-200
            ${
              isDragOver
                ? "drag-over border-primary bg-primary/5"
                : "border-border/40 hover:border-border hover:bg-card/30"
            }
          `}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.pdf,.csv,.md"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) handleFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <div className="flex flex-col items-center gap-1.5">
            <div className="p-2 rounded-full bg-muted/50">
              {isDragOver ? (
                <Sparkles className="h-4 w-4 text-primary animate-pulse" />
              ) : (
                <Upload className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {isDragOver
                ? "ドロップしてアップロード"
                : "ファイルをドラッグ＆ドロップ"}
            </p>
            <p className="text-[10px] text-muted-foreground/60">
              PDF, TXT, CSV, MD
            </p>
          </div>
        </div>
      </div>

      {/* Select All / Source list header */}
      {filteredSources.length > 0 && (
        <div className="flex items-center justify-between px-4 pt-3 pb-1">
          <button
            onClick={handleSelectAll}
            className="flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
          >
            {allReadySelected ? (
              <CheckSquare className="h-3 w-3" />
            ) : (
              <Square className="h-3 w-3" />
            )}
            全て選択
          </button>
          <span className="text-[10px] text-muted-foreground">
            {selectedIds.size} 選択中
          </span>
        </div>
      )}

      {/* Source List */}
      <ScrollArea className="flex-1 px-3 pb-3">
        <div className="space-y-2 pt-1">
          {filteredSources.map((source) => (
            <SourceCard
              key={source.id}
              source={source}
              selected={selectedIds.has(source.id)}
              onSelect={handleSelect}
            />
          ))}

          {filteredSources.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="p-3 rounded-full bg-muted/30 mb-3">
                <Plus className="h-5 w-5 text-muted-foreground/40" />
              </div>
              <p className="text-xs text-muted-foreground/60">
                ソースがありません
              </p>
              <p className="text-[10px] text-muted-foreground/40 mt-1">
                ファイルをアップロードして開始
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
