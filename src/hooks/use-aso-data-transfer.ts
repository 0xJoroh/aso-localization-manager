"use client";

import { useRef, useState, type ChangeEvent } from "react";

import {
  createAsoDataExport,
  importAsoData,
  parseImportedAsoData,
} from "@/lib/aso-store";

type TransferMessage = {
  tone: "success" | "error";
  text: string;
};

export function useAsoDataTransfer() {
  const [transferMessage, setTransferMessage] = useState<TransferMessage | null>(
    null,
  );
  const importInputRef = useRef<HTMLInputElement>(null);

  function handleExportData() {
    const exportedData = createAsoDataExport();
    const json = JSON.stringify(exportedData, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const downloadLink = document.createElement("a");
    const dateStamp = exportedData.exportedAt.slice(0, 10);

    downloadLink.href = url;
    downloadLink.download = `aso-localization-manager-${dateStamp}.json`;
    downloadLink.click();

    window.setTimeout(() => {
      window.URL.revokeObjectURL(url);
    }, 0);

    setTransferMessage({
      tone: "success",
      text: "Your workspace was exported. Import this file in the other browser to restore everything.",
    });
  }

  async function handleImportFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const raw = await file.text();
      const importedState = parseImportedAsoData(raw);

      importAsoData(importedState);
      setTransferMessage({
        tone: "success",
        text: "Your workspace was imported successfully.",
      });
    } catch (error) {
      setTransferMessage({
        tone: "error",
        text:
          error instanceof Error
            ? error.message
            : "The selected file could not be imported.",
      });
    } finally {
      event.target.value = "";
    }
  }

  function openImportPicker() {
    importInputRef.current?.click();
  }

  return {
    handleExportData,
    handleImportFile,
    importInputRef,
    openImportPicker,
    transferMessage,
  };
}
