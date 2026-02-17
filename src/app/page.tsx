"use client";

import { useState, useCallback } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { SourceSidebar } from "@/components/sidebar/source-sidebar";
import { ChatPanel, type MetadataFilter } from "@/components/chat/chat-panel";
import { type SourceFile } from "@/components/sidebar/source-card";
import { useChat } from "@/hooks/use-chat";

export default function Home() {
  const [sources, setSources] = useState<SourceFile[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const { messages, isLoading, sendMessage, stopGeneration, clearMessages } =
    useChat();

  const handleSend = useCallback(
    (question: string, chatFilter?: MetadataFilter) => {
      const selectedSources = sources.filter((s) => selectedIds.has(s.id));
      const metadataFilter: Record<string, string> = {};

      // ソース選択が1つの場合はsourceフィルターを追加
      if (selectedSources.length === 1) {
        metadataFilter.source = selectedSources[0].filename;
      }

      // チャットパネルのフィルターをマージ
      if (chatFilter?.category) metadataFilter.category = chatFilter.category;
      if (chatFilter?.department) metadataFilter.department = chatFilter.department;
      if (chatFilter?.file_type) metadataFilter.file_type = chatFilter.file_type;

      sendMessage(
        question,
        Object.keys(metadataFilter).length > 0 ? metadataFilter : null
      );
    },
    [sources, selectedIds, sendMessage]
  );

  return (
    <div className="h-screen w-screen overflow-hidden">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        {/* Sidebar */}
        <ResizablePanel
          defaultSize={28}
          minSize={22}
          maxSize={40}
          className="border-r border-border/30"
        >
          <SourceSidebar
            sources={sources}
            setSources={setSources}
            selectedIds={selectedIds}
            setSelectedIds={setSelectedIds}
          />
        </ResizablePanel>

        <ResizableHandle className="w-[1px] bg-border/20 hover:bg-primary/40 transition-colors" />

        {/* Main Chat */}
        <ResizablePanel defaultSize={72} minSize={50}>
          <ChatPanel
            messages={messages}
            isLoading={isLoading}
            onSend={handleSend}
            onStop={stopGeneration}
            onClear={clearMessages}
            selectedSourceCount={selectedIds.size}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
