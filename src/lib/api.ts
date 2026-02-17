const API_BASE = "/api";

export async function healthCheck(): Promise<{ status: string }> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error("Health check failed");
  return res.json();
}

export async function uploadFile(
  file: File,
  onProgress?: (percent: number) => void
): Promise<{ status: string; filename: string; message: string }> {
  const formData = new FormData();
  formData.append("file", file);

  const xhr = new XMLHttpRequest();

  return new Promise((resolve, reject) => {
    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status === 200) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        reject(new Error(xhr.responseText || "Upload failed"));
      }
    });

    xhr.addEventListener("error", () => reject(new Error("Upload failed")));
    xhr.open("POST", `${API_BASE}/v1/upload`);
    xhr.send(formData);
  });
}

export async function triggerIndex(
  directory?: string
): Promise<{ status: string; message: string }> {
  const res = await fetch(`${API_BASE}/v1/index`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ directory: directory || null }),
  });
  if (!res.ok) throw new Error("Index request failed");
  return res.json();
}

export interface QueryParams {
  question: string;
  k?: number;
  metadata_filter?: Record<string, string> | null;
}

export function queryRAG(
  params: QueryParams,
  onToken: (token: string) => void,
  onError: (error: string) => void,
  onDone: () => void
): AbortController {
  const controller = new AbortController();

  fetch(`${API_BASE}/v1/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      question: params.question,
      k: params.k ?? 4,
      metadata_filter: params.metadata_filter ?? null,
    }),
    signal: controller.signal,
  })
    .then(async (res) => {
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Request failed" }));
        onError(typeof err.detail === "string" ? err.detail : JSON.stringify(err.detail));
        onDone();
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        onError("No response body");
        onDone();
        return;
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data.startsWith("[ERROR]")) {
              onError(data);
            } else {
              onToken(data);
            }
          }
        }
      }

      if (buffer.startsWith("data: ")) {
        const data = buffer.slice(6);
        if (data.startsWith("[ERROR]")) {
          onError(data);
        } else {
          onToken(data);
        }
      }

      onDone();
    })
    .catch((err) => {
      if (err.name !== "AbortError") {
        onError(err.message);
        onDone();
      }
    });

  return controller;
}

export interface DocumentInfo {
  filename: string;
  size_bytes: number;
  updated_at: string;
  file_type: string;
}

export interface DeleteResponse {
  status: string;
  filename: string;
  deleted_vectors: number;
  deleted_records: number;
}

export interface DocumentListResponse {
  documents: DocumentInfo[];
}

export async function fetchDocuments(): Promise<DocumentListResponse> {
  const res = await fetch(`${API_BASE}/v1/documents`);
  if (!res.ok) throw new Error(`Failed to fetch documents: ${res.status}`);
  return res.json();
}

export async function deleteDocument(filename: string): Promise<DeleteResponse> {
  const res = await fetch(`${API_BASE}/v1/documents/${encodeURIComponent(filename)}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Delete failed" }));
    throw new Error(typeof err.detail === "string" ? err.detail : JSON.stringify(err.detail));
  }
  return res.json();
}

export const ACCEPTED_FILE_TYPES: Record<string, string[]> = {
  "text/plain": [".txt"],
  "application/pdf": [".pdf"],
  "text/csv": [".csv"],
  "text/markdown": [".md"],
};

export const ACCEPTED_EXTENSIONS = [".txt", ".pdf", ".csv", ".md"];

export function getFileTypeLabel(filename: string): string {
  const ext = filename.slice(filename.lastIndexOf(".")).toLowerCase();
  const labels: Record<string, string> = {
    ".txt": "TXT",
    ".pdf": "PDF",
    ".csv": "CSV",
    ".md": "MD",
  };
  return labels[ext] || "FILE";
}

export function getFileTypeColor(filename: string): string {
  const ext = filename.slice(filename.lastIndexOf(".")).toLowerCase();
  const colors: Record<string, string> = {
    ".txt": "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    ".pdf": "bg-rose-500/15 text-rose-400 border-rose-500/20",
    ".csv": "bg-amber-500/15 text-amber-400 border-amber-500/20",
    ".md": "bg-violet-500/15 text-violet-400 border-violet-500/20",
  };
  return colors[ext] || "bg-muted text-muted-foreground";
}
