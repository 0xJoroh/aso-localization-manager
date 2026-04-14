"use client";

import type { ReactNode } from "react";
import { Check, X } from "lucide-react";

import { useBrainstormTagInput } from "@/hooks/use-brainstorm-tag-input";
import type { BrainstormKeyword } from "@/lib/aso";

export function BrainstormTagInput({
  inputId,
  brainstorm,
  onChange,
  renderTag,
}: {
  inputId: string;
  brainstorm: string;
  onChange: (value: string) => void;
  renderTag: (args: {
    entry: BrainstormKeyword;
    index: number;
    onEdit: () => void;
    onRemove: () => void;
  }) => ReactNode;
}) {
  const {
    commitDraft,
    draft,
    editingIndex,
    editingKeyword,
    editingScore,
    entries,
    handleContainerClick,
    handleDraftKeyDown,
    handleDraftPaste,
    handleEditInputKeyDown,
    inputRef,
    removeEntry,
    saveEditedEntry,
    setDraft,
    setEditingKeyword,
    setEditingScore,
    startEditingEntry,
    stopEditingEntry,
  } = useBrainstormTagInput({
    brainstorm,
    onChange,
  });

  return (
    <div
      className="flex h-full min-h-[220px] w-full min-w-0 flex-1 rounded-lg border border-border/80 bg-muted/20 px-3 py-3 transition-colors focus-within:border-foreground/30 min-[500px]:min-h-full"
      onClick={handleContainerClick}
    >
      <div className="flex h-full w-full flex-wrap content-start items-start gap-2 overflow-y-auto">
        {entries.map((entry, index) => {
          if (editingIndex === index) {
            return (
              <div
                key={`${entry.keyword}-${index}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-foreground/20 bg-background px-2 py-1"
                onClick={(event) => event.stopPropagation()}
              >
                <input
                  autoFocus
                  value={editingKeyword}
                  onChange={(event) => setEditingKeyword(event.target.value)}
                  onKeyDown={handleEditInputKeyDown}
                  placeholder="Keyword"
                  className="w-28 border-0 bg-transparent text-[0.76rem] font-medium outline-none"
                />
                <span className="text-muted-foreground">|</span>
                <input
                  value={editingScore}
                  onChange={(event) => setEditingScore(event.target.value)}
                  onKeyDown={handleEditInputKeyDown}
                  placeholder="0"
                  inputMode="decimal"
                  className="w-12 border-0 bg-transparent text-[0.76rem] font-semibold outline-none"
                  aria-label={`Edit score for ${entry.keyword}`}
                />
                <button
                  type="button"
                  onClick={saveEditedEntry}
                  className="inline-flex size-4 items-center justify-center rounded-full hover:bg-black/6"
                  aria-label={`Save ${entry.keyword}`}
                >
                  <Check className="size-3" />
                </button>
                <button
                  type="button"
                  onClick={stopEditingEntry}
                  className="inline-flex size-4 items-center justify-center rounded-full hover:bg-black/6"
                  aria-label={`Cancel editing ${entry.keyword}`}
                >
                  <X className="size-3" />
                </button>
              </div>
            );
          }

          return (
            <div key={`${entry.keyword}-${index}`}>
              {renderTag({
                entry,
                index,
                onEdit: () => startEditingEntry(index),
                onRemove: () => removeEntry(index),
              })}
            </div>
          );
        })}

        <input
          id={inputId}
          ref={inputRef}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleDraftKeyDown}
          onBlur={commitDraft}
          onPaste={handleDraftPaste}
          placeholder={
            entries.length === 0 ? "Type a keyword and score, then press Enter" : ""
          }
          className="min-w-[180px] flex-1 border-0 bg-transparent py-1 text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>
    </div>
  );
}
