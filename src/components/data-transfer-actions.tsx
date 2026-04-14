"use client";

import { Download, FolderUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAsoDataTransfer } from "@/hooks/use-aso-data-transfer";
import { cn } from "@/lib/utils";

export function DataTransferActions() {
  const {
    handleExportData,
    handleImportFile,
    importInputRef,
    openImportPicker,
    transferMessage,
  } = useAsoDataTransfer();

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <input
        ref={importInputRef}
        type="file"
        accept="application/json,.json"
        className="sr-only"
        onChange={handleImportFile}
      />

      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        <Button type="button" size="lg" onClick={handleExportData}>
          <Download className="size-4" />
          Export data
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="lg"
          onClick={openImportPicker}
        >
          <FolderUp className="size-4" />
          Import data
        </Button>
      </div>

      <p className="text-xs text-muted-foreground sm:text-right">
        Move your saved browser workspace between browsers anytime.
      </p>

      {transferMessage ? (
        <p
          className={cn(
            "text-xs sm:text-right",
            transferMessage.tone === "error"
              ? "text-red-600"
              : "text-emerald-600",
          )}
        >
          {transferMessage.text}
        </p>
      ) : null}
    </div>
  );
}
