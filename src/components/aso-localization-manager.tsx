"use client";

import {
  AlertTriangle,
  Check,
  Clock3,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  X,
} from "lucide-react";

import { BrainstormTagInput } from "@/components/brainstorm-tag-input";
import { DataTransferActions } from "@/components/data-transfer-actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  EDITABLE_FIELDS,
  FIELD_LABELS,
  getFieldError,
  type BrainstormKeyword,
} from "@/lib/aso";
import {
  fieldDescriptions,
  fieldPlaceholders,
  formatCounter,
  getLocalizationFlag,
} from "@/lib/aso-presentation";
import {
  formatBrainstormScore,
  getKeywordTrackingClassName,
} from "@/lib/brainstorm";
import { cn } from "@/lib/utils";
import {
  getLocalizationStatusDetails,
  useAsoLocalizationManager,
} from "@/hooks/use-aso-localization-manager";

function KeywordBadge({
  entry,
  statusClassName,
  onEdit,
  onRemove,
}: {
  entry: BrainstormKeyword;
  statusClassName: string;
  onEdit?: () => void;
  onRemove?: () => void;
}) {
  return (
    <div
      onDoubleClick={onEdit}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.76rem] font-medium",
        statusClassName,
      )}
    >
      <span>{entry.keyword}</span>
      <span className="rounded-full bg-foreground/6 px-1.5 py-0.5 text-[0.68rem] font-semibold">
        {formatBrainstormScore(entry.score)}
      </span>
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          className="ml-0.5 inline-flex size-4 items-center justify-center rounded-full hover:bg-black/6"
          aria-label={`Remove ${entry.keyword}`}
        >
          <X className="size-3" />
        </button>
      ) : null}
    </div>
  );
}

export function AsoLocalizationManager() {
  const {
    activeLocalizationId,
    clearSearchQuery,
    dismissStorageNotice,
    handleSelectLocalization,
    isHydrated,
    otherTrackedTexts,
    searchQuery,
    selectedLocalization,
    setSearchQuery,
    sidebarCollapsed,
    storageNoticeDismissed,
    toggleSidebarCollapsed,
    updateBrainstorm,
    updateField,
    visibleLocalizations,
  } = useAsoLocalizationManager();

  const selectedLocalizationStatus = selectedLocalization
    ? getLocalizationStatusDetails(selectedLocalization)
    : null;

  if (!isHydrated) {
    return (
      <main className="min-h-screen bg-background">
        <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-6">
          <div className="text-sm text-muted-foreground">
            Loading your localization workspace...
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground lg:h-screen lg:overflow-hidden">
      <div className="mx-auto max-w-[1500px] lg:h-full">
        <div
          className={cn(
            "grid min-h-screen transition-[grid-template-columns] duration-200 ease-out lg:h-full lg:min-h-0",
            sidebarCollapsed
              ? "lg:grid-cols-[72px_minmax(0,1fr)]"
              : "lg:grid-cols-[286px_minmax(0,1fr)]",
          )}
        >
          <aside className="border-border/80 lg:sticky lg:top-0 lg:h-screen lg:border-r">
            <div className="flex h-full min-h-screen flex-col py-4 lg:h-screen lg:min-h-0">
              <div
                className={cn(
                  "flex items-center gap-2",
                  sidebarCollapsed ? "justify-center px-2" : "justify-between px-4",
                )}
              >
                {!sidebarCollapsed ? (
                  <div className="relative flex-1">
                    <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="localization-search"
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder="Search localizations"
                      className="h-9 rounded-md border-border bg-background pr-9 pl-9 shadow-none"
                    />
                    {searchQuery ? (
                      <button
                        type="button"
                        onClick={clearSearchQuery}
                        className="absolute top-1/2 right-2 inline-flex size-6 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                        aria-label="Clear search"
                      >
                        <X className="size-3.5" />
                      </button>
                    ) : null}
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={toggleSidebarCollapsed}
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                  aria-label={
                    sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
                  }
                >
                  {sidebarCollapsed ? (
                    <PanelLeftOpen className="size-4" />
                  ) : (
                    <PanelLeftClose className="size-4" />
                  )}
                </button>
              </div>

              <div className="mt-4 min-h-0 flex-1 overflow-hidden">
                <div
                  className={cn(
                    "h-full overflow-x-hidden overflow-y-auto",
                    sidebarCollapsed ? "px-2" : "pl-4 pr-1",
                  )}
                >
                  <div className="space-y-1">
                    {visibleLocalizations.length === 0 ? (
                      <div
                        className={cn(
                          "py-8 text-sm text-muted-foreground",
                          sidebarCollapsed && "px-2 text-center text-xs",
                        )}
                      >
                        No matches
                      </div>
                    ) : null}

                    {visibleLocalizations.map((localization) => {
                      const isActive = localization.id === activeLocalizationId;
                      const status = getLocalizationStatusDetails(localization);
                      const flag = getLocalizationFlag(localization.name);

                      return (
                        <button
                          key={localization.id}
                          type="button"
                          onClick={() => handleSelectLocalization(localization.id)}
                          className={cn(
                            "relative flex w-full items-center rounded-md text-left text-sm transition-colors",
                            sidebarCollapsed
                              ? "justify-center px-0 py-2.5"
                              : "justify-between px-3 py-2",
                            isActive
                              ? "bg-accent text-accent-foreground"
                              : "text-foreground hover:bg-muted",
                          )}
                          title={
                            sidebarCollapsed ? localization.name : undefined
                          }
                        >
                          <span
                            className={cn(
                              "flex min-w-0 items-center",
                              sidebarCollapsed ? "justify-center" : "gap-2",
                            )}
                          >
                            <span
                              aria-hidden="true"
                              className="shrink-0 text-base"
                            >
                              {flag}
                            </span>
                            {!sidebarCollapsed ? (
                              <span className="truncate">
                                {localization.name}
                              </span>
                            ) : null}
                          </span>
                          {!sidebarCollapsed && status.isComplete ? (
                            <Check className="ml-3 size-4 shrink-0 text-emerald-500" />
                          ) : null}
                          {!sidebarCollapsed && status.hasErrors ? (
                            <AlertTriangle className="ml-3 size-4 shrink-0 text-red-500" />
                          ) : null}
                          {!sidebarCollapsed && status.isIncomplete ? (
                            <Clock3 className="ml-3 size-4 shrink-0 text-amber-500" />
                          ) : null}
                          {sidebarCollapsed && status.isComplete ? (
                            <span className="absolute top-1 right-1 rounded-full bg-emerald-500/15 p-0.5 text-emerald-400">
                              <Check className="size-3" />
                            </span>
                          ) : null}
                          {sidebarCollapsed && status.hasErrors ? (
                            <span className="absolute top-1 right-1 rounded-full bg-red-500/15 p-0.5 text-red-500">
                              <AlertTriangle className="size-3" />
                            </span>
                          ) : null}
                          {sidebarCollapsed && status.isIncomplete ? (
                            <span className="absolute top-1 right-1 rounded-full bg-amber-500/15 p-0.5 text-amber-500">
                              <Clock3 className="size-3" />
                            </span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <section className="min-h-0 py-6 lg:overflow-y-auto lg:pl-8">
            {selectedLocalization ? (
              <div className="space-y-6 pr-1 lg:pr-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-xl">
                      {getLocalizationFlag(selectedLocalization.name)}
                    </span>
                    <h1 className="text-xl font-semibold tracking-tight">
                      {selectedLocalization.name}
                    </h1>
                    {selectedLocalizationStatus?.isComplete ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                        <Check className="size-3.5" />
                        Complete
                      </span>
                    ) : selectedLocalizationStatus?.hasErrors ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
                        <AlertTriangle className="size-3.5" />
                        Has errors
                      </span>
                    ) : selectedLocalizationStatus?.isIncomplete ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                        <Clock3 className="size-3.5" />
                        In progress
                      </span>
                    ) : null}
                  </div>

                  <DataTransferActions />
                </div>

                {!storageNoticeDismissed ? (
                  <div className="rounded-2xl border border-amber-300/40 bg-amber-50 px-4 py-4 text-sm text-amber-950">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 rounded-full bg-amber-100 p-1.5 text-amber-700">
                        <AlertTriangle className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">Your data stays in this browser.</p>
                        <p className="mt-1 text-amber-900/75">
                          Refreshing is safe, but switching browsers or devices
                          requires using the export and import actions in the top
                          right corner.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={dismissStorageNotice}
                        className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-amber-700/70 transition-colors hover:bg-amber-100 hover:text-amber-900"
                        aria-label="Dismiss storage notice"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  </div>
                ) : null}

                <div className="space-y-6">
                  <div className="grid items-stretch gap-8 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_360px]">
                    <div className="space-y-5">
                      {EDITABLE_FIELDS.filter(
                        (field) => field !== "description",
                      ).map((field) => {
                        const value = selectedLocalization.fields[field];
                        const fieldError = getFieldError(field, value);

                        return (
                          <div
                            key={field}
                            className="rounded-xl border border-border bg-background"
                          >
                            <div className="space-y-3 p-4 sm:p-5">
                              <div className="space-y-1">
                                <Label
                                  htmlFor={`${field}-${selectedLocalization.id}`}
                                  className="text-sm font-medium"
                                >
                                  {FIELD_LABELS[field]}
                                </Label>
                                <p className="text-xs leading-5 text-muted-foreground">
                                  {fieldDescriptions[field]}
                                </p>
                              </div>

                              {field === "keywords" ? (
                                <Textarea
                                  id={`${field}-${selectedLocalization.id}`}
                                  rows={3}
                                  placeholder={fieldPlaceholders[field]}
                                  aria-invalid={fieldError ? true : undefined}
                                  value={value}
                                  onChange={(event) =>
                                    updateField(
                                      selectedLocalization.id,
                                      field,
                                      event.target.value,
                                    )
                                  }
                                  className="rounded-md border-border bg-background shadow-none"
                                />
                              ) : (
                                <Input
                                  id={`${field}-${selectedLocalization.id}`}
                                  placeholder={fieldPlaceholders[field]}
                                  aria-invalid={fieldError ? true : undefined}
                                  value={value}
                                  onChange={(event) =>
                                    updateField(
                                      selectedLocalization.id,
                                      field,
                                      event.target.value,
                                    )
                                  }
                                  className="h-10 rounded-md border-border bg-background shadow-none"
                                />
                              )}

                              <div className="flex items-start justify-between gap-4">
                                {fieldError ? (
                                  <p className="text-sm text-red-600">
                                    {fieldError}
                                  </p>
                                ) : (
                                  <span />
                                )}
                                <div
                                  className={cn(
                                    "shrink-0 text-xs font-medium",
                                    fieldError
                                      ? "text-red-600"
                                      : "text-muted-foreground",
                                  )}
                                >
                                  {formatCounter(field, value)}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex lg:w-[340px] xl:w-[360px]">
                      <div className="flex min-h-full w-full flex-col lg:sticky lg:top-6">
                        <div className="flex min-h-full flex-col rounded-xl border border-border bg-background p-4 sm:p-5">
                          <div className="space-y-1">
                            <Label
                              htmlFor={`brainstorm-${selectedLocalization.id}`}
                              className="text-sm font-medium"
                            >
                              Brainstorm keywords
                            </Label>
                          </div>

                          <div className="mt-4 flex flex-1">
                            <BrainstormTagInput
                              key={selectedLocalization.id}
                              inputId={`brainstorm-${selectedLocalization.id}`}
                              brainstorm={selectedLocalization.brainstorm}
                              onChange={(value) =>
                                updateBrainstorm(selectedLocalization.id, value)
                              }
                              renderTag={({ entry, onEdit, onRemove }) => {
                                const trackingClassName =
                                  getKeywordTrackingClassName(
                                    entry,
                                    {
                                      title: selectedLocalization.fields.title,
                                      subtitle:
                                        selectedLocalization.fields.subtitle,
                                      keywords:
                                        selectedLocalization.fields.keywords,
                                    },
                                    otherTrackedTexts,
                                  );

                                return (
                                  <KeywordBadge
                                    entry={entry}
                                    statusClassName={trackingClassName}
                                    onEdit={onEdit}
                                    onRemove={onRemove}
                                  />
                                );
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {EDITABLE_FIELDS.filter(
                    (field) => field === "description",
                  ).map((field) => {
                    const value = selectedLocalization.fields[field];
                    const fieldError = getFieldError(field, value);

                    return (
                      <div
                        key={field}
                        className="rounded-xl border border-border bg-background"
                      >
                        <div className="space-y-3 p-4 sm:p-5">
                          <div className="space-y-1">
                            <Label
                              htmlFor={`${field}-${selectedLocalization.id}`}
                              className="text-sm font-medium"
                            >
                              {FIELD_LABELS[field]}
                            </Label>
                            <p className="text-xs leading-5 text-muted-foreground">
                              {fieldDescriptions[field]}
                            </p>
                          </div>

                          <Textarea
                            id={`${field}-${selectedLocalization.id}`}
                            rows={12}
                            placeholder={fieldPlaceholders[field]}
                            aria-invalid={fieldError ? true : undefined}
                            value={value}
                            onChange={(event) =>
                              updateField(
                                selectedLocalization.id,
                                field,
                                event.target.value,
                              )
                            }
                            className="min-h-[280px] resize-y rounded-md border-border bg-background shadow-none"
                          />

                          <div className="flex items-start justify-between gap-4">
                            {fieldError ? (
                              <p className="text-sm text-red-600">
                                {fieldError}
                              </p>
                            ) : (
                              <span />
                            )}
                            <div
                              className={cn(
                                "shrink-0 text-xs font-medium",
                                fieldError ? "text-red-600" : "text-muted-foreground",
                              )}
                            >
                              {formatCounter(field, value)}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="py-20 text-sm text-muted-foreground">
                Select a localization from the left.
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
