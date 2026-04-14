"use client";

import { Download, FolderUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAsoDataTransfer } from "@/hooks/use-aso-data-transfer";
import { cn } from "@/lib/utils";

export function DataTransferActions({
  className,
  compact = false,
  importIconOnly = false,
  showDescription = true,
}: {
  className?: string;
  compact?: boolean;
  importIconOnly?: boolean;
  showDescription?: boolean;
}) {
  const {
    handleExportData,
    handleImportFile,
    importInputRef,
    openImportPicker,
    transferMessage,
  } = useAsoDataTransfer();

  return (
    <div
      className={cn(
        "flex flex-col gap-2",
        compact ? "items-end" : "items-start sm:items-end",
        className,
      )}
    >
      <input
        ref={importInputRef}
        type="file"
        accept="application/json,.json"
        className="sr-only"
        onChange={handleImportFile}
      />

      <div
        className={cn(
          "flex flex-wrap items-center gap-2",
          compact ? "justify-end" : "sm:justify-end",
        )}
      >
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  size={compact ? "sm" : "lg"}
                  onClick={handleExportData}
                >
                  <Download className="size-4" />
                  Export data
                </Button>
              }
            />
            <TooltipContent>Export your data as JSON</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  variant="secondary"
                  size={
                    importIconOnly
                      ? compact
                        ? "icon-sm"
                        : "icon-lg"
                      : compact
                        ? "sm"
                        : "lg"
                  }
                  onClick={openImportPicker}
                  aria-label="Import data"
                >
                  <FolderUp className="size-4" />
                  {!importIconOnly ? "Import data" : null}
                </Button>
              }
            />
            <TooltipContent>Import data from a JSON export</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {showDescription ? (
        <p className="text-xs text-muted-foreground sm:text-right">
          Move your saved browser workspace between browsers anytime.
        </p>
      ) : null}

      {transferMessage ? (
        <p
          className={cn(
            "max-w-xs text-xs sm:text-right",
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
