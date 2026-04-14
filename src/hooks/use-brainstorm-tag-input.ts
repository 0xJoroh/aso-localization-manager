"use client";

import {
  useRef,
  useState,
  type ClipboardEvent,
  type KeyboardEvent,
} from "react";

import { parseBrainstorm } from "@/lib/aso";
import {
  formatBrainstormScore,
  parseDraftBrainstormEntry,
  serializeBrainstormEntries,
} from "@/lib/brainstorm";

export function useBrainstormTagInput({
  brainstorm,
  onChange,
}: {
  brainstorm: string;
  onChange: (value: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingKeyword, setEditingKeyword] = useState("");
  const [editingScore, setEditingScore] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const entries = parseBrainstorm(brainstorm);

  function commitDraft() {
    const nextEntry = parseDraftBrainstormEntry(draft, entries.length + 1);

    if (!nextEntry) {
      return false;
    }

    onChange(serializeBrainstormEntries([...entries, nextEntry]));
    setDraft("");
    return true;
  }

  function removeEntry(indexToRemove: number) {
    onChange(
      serializeBrainstormEntries(
        entries.filter((_, index) => index !== indexToRemove),
      ),
    );
  }

  function startEditingEntry(indexToEdit: number) {
    const entry = entries[indexToEdit];

    if (!entry) {
      return;
    }

    setEditingIndex(indexToEdit);
    setEditingKeyword(entry.keyword);
    setEditingScore(formatBrainstormScore(entry.score));
  }

  function stopEditingEntry() {
    setEditingIndex(null);
    setEditingKeyword("");
    setEditingScore("");
  }

  function saveEditedEntry() {
    if (editingIndex === null) {
      return false;
    }

    const editedEntry = parseDraftBrainstormEntry(
      `${editingKeyword} | ${editingScore || "0"}`,
      editingIndex + 1,
    );

    if (!editedEntry) {
      return false;
    }

    onChange(
      serializeBrainstormEntries(
        entries.map((entry, index) =>
          index === editingIndex ? editedEntry : entry,
        ),
      ),
    );
    stopEditingEntry();
    return true;
  }

  function handleContainerClick() {
    if (editingIndex === null) {
      inputRef.current?.focus();
    }
  }

  function handleDraftKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      commitDraft();
    }

    if (event.key === "Backspace" && !draft && entries.length > 0) {
      event.preventDefault();
      removeEntry(entries.length - 1);
    }
  }

  function handleEditInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      saveEditedEntry();
    }

    if (event.key === "Escape") {
      event.preventDefault();
      stopEditingEntry();
    }
  }

  function handleDraftPaste(event: ClipboardEvent<HTMLInputElement>) {
    const pastedText = event.clipboardData.getData("text");

    if (!pastedText.includes("\n")) {
      return;
    }

    event.preventDefault();
    const pastedEntries = parseBrainstorm(pastedText);

    if (pastedEntries.length === 0) {
      return;
    }

    onChange(serializeBrainstormEntries([...entries, ...pastedEntries]));
    setDraft("");
  }

  return {
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
  };
}
