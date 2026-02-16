"use client";

import { useState, useRef, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { type ChatMessage } from "@/hooks/use-chat";
import {
  Send,
  StopCircle,
  Trash2,
  ChevronDown,
  BookOpen,
  Zap,
  MessageSquare,
} from "lucide-react";

interface ChatPanelProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSend: (message: string) => void;
  onStop: () => void;
  onClear: () => void;
  selectedSourceCount: number;
}

export function ChatPanel({
  messages,
  isLoading,
  onSend,
  onStop,
  onClear,
  selectedSourceCount,
}: ChatPanelProps) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    onSend(trimmed);
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      // Enterのみでは送信せず改行する
    }
  };

  const handleTextareaInput = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 160) + "px";
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20">
                <Zap className="h-4 w-4 text-primary" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-accent border-2 border-background" />
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-tight">RAG Studio</h1>
              <p className="text-[10px] text-muted-foreground">
                {selectedSourceCount > 0
                  ? `${selectedSourceCount} ソース選択中`
                  : "ソースを選択してください"}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={onClear}
              title="チャット履歴をクリア"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="max-w-3xl mx-auto px-6 py-4">
          {messages.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-1">
              {messages.map((msg, i) => (
                <MessageBubble key={msg.id} message={msg} index={i} />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <div className="relative flex items-end gap-2">
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onInput={handleTextareaInput}
                placeholder="ドキュメントについて質問..."
                className="min-h-[44px] max-h-[160px] resize-none pr-4 bg-card/80 border-border/50 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all text-sm placeholder:text-muted-foreground/50"
                rows={1}
              />
            </div>
            {isLoading ? (
              <Button
                onClick={onStop}
                size="icon"
                variant="outline"
                className="h-[44px] w-[44px] shrink-0 border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
              >
                <StopCircle className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                size="icon"
                disabled={!input.trim()}
                className="h-[44px] w-[44px] shrink-0 bg-primary hover:bg-primary/90 disabled:opacity-30"
              >
                <Send className="h-4 w-4" />
              </Button>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground/40 mt-2 text-center">
            Enterで改行 ・ ボタンで送信
          </p>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center">
      <div className="relative mb-6">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/10 via-accent/5 to-transparent glow-effect">
          <MessageSquare className="h-8 w-8 text-primary/60" />
        </div>
      </div>
      <h2 className="text-lg font-semibold mb-2 tracking-tight">
        RAG Studio
      </h2>
      <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
        ドキュメントをアップロードして、
        <br />
        AIに質問しましょう。
      </p>
      <div className="flex flex-wrap justify-center gap-2 mt-6">
        {[
          "この文書の要約を教えて",
          "主な結論は何ですか？",
          "キーワードを抽出して",
        ].map((suggestion) => (
          <button
            key={suggestion}
            className="px-3 py-1.5 text-xs rounded-full border border-border/50 text-muted-foreground hover:text-foreground hover:border-border hover:bg-card/50 transition-all duration-200"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}

function MessageBubble({
  message,
  index,
}: {
  message: ChatMessage;
  index: number;
}) {
  const isUser = message.role === "user";

  return (
    <div
      className="animate-fade-in-up py-3"
      style={{ animationDelay: `${Math.min(index * 30, 150)}ms` }}
    >
      <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
        {/* Content */}
        <div
          className={`flex-1 max-w-[85%] ${isUser ? "text-right" : ""}`}
        >
          <div
            className={`inline-block text-left rounded-xl px-4 py-2.5 text-sm leading-relaxed ${
              isUser
                ? "bg-primary/10 text-foreground border border-primary/10"
                : message.error
                ? "bg-destructive/10 text-destructive border border-destructive/10"
                : "bg-card text-foreground/90 border border-border/30"
            } ${message.isStreaming ? "streaming-cursor" : ""}`}
          >
            <MessageContent content={message.content} />
          </div>

          {!isUser && !message.isStreaming && message.content && !message.error && (
            <SourceGuide />
          )}
        </div>
      </div>
    </div>
  );
}

function MessageContent({ content }: { content: string }) {
  if (!content) return <span className="text-muted-foreground/50">...</span>;
  return <>{content}</>;
}

function SourceGuide() {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="mt-2">
      <CollapsibleTrigger asChild>
        <button className="flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors">
          <BookOpen className="h-3 w-3" />
          参考ソース
          <ChevronDown
            className={`h-2.5 w-2.5 transition-transform duration-200 ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-1.5">
        <div className="rounded-lg border border-border/30 bg-card/50 p-3">
          <p className="text-[10px] text-muted-foreground/60 italic">
            ソース情報はAPI応答に含まれる場合にここに表示されます。
          </p>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
