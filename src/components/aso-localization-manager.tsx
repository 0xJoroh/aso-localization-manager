"use client";

import type { ReactNode } from "react";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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

function EditorFieldCard({
  title,
  description,
  children,
  footer,
  className,
  contentClassName,
}: {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <Card className={cn("gap-0", className)}>
      <CardHeader className="gap-1.5 pb-0">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <CardDescription className="text-xs leading-5">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className={cn("space-y-3 pt-4", contentClassName)}>
        {children}
        {footer}
      </CardContent>
    </Card>
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
    <main className="min-h-screen w-full bg-background text-foreground md:h-screen md:overflow-hidden">
      <div
        className={cn(
          "relative w-full md:grid md:min-h-0 md:h-full md:transition-[grid-template-columns] md:duration-200 md:ease-out",
          sidebarCollapsed
            ? "md:grid-cols-[72px_minmax(0,1fr)]"
            : "md:grid-cols-[286px_minmax(0,1fr)]",
        )}
      >
        <input
          id="mobile-sidebar-toggle"
          type="checkbox"
          className="peer/mobile-sidebar absolute sr-only md:hidden"
          aria-hidden="true"
        />

        <label
          htmlFor="mobile-sidebar-toggle"
          className="fixed inset-0 z-30 hidden bg-black/55 backdrop-blur-[1px] peer-checked/mobile-sidebar:block md:hidden"
          aria-label="Close sidebar"
        />

        <aside className="fixed inset-y-0 left-0 z-40 w-[min(20rem,82vw)] max-w-full -translate-x-full border-r border-border/80 bg-background shadow-2xl transition-transform duration-200 ease-out peer-checked/mobile-sidebar:translate-x-0 md:sticky md:top-0 md:z-auto md:w-auto md:max-w-none md:translate-x-0 md:shadow-none">
          <div className="flex h-full min-h-full flex-col py-4 md:h-screen md:min-h-0">
            <div
              className={cn(
                "flex items-center gap-2",
                sidebarCollapsed
                  ? "px-4 md:justify-center md:px-2"
                  : "justify-between px-4",
              )}
            >
              <div
                className={cn(
                  "relative flex-1",
                  sidebarCollapsed && "md:hidden",
                )}
              >
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

              <label
                htmlFor="mobile-sidebar-toggle"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground md:hidden"
                aria-label="Close sidebar"
              >
                <X className="size-4" />
              </label>

              <button
                type="button"
                onClick={toggleSidebarCollapsed}
                className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground md:inline-flex"
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
                  sidebarCollapsed ? "pl-4 pr-1 md:px-2" : "pl-4 pr-1",
                )}
              >
                <div className="space-y-1">
                  {visibleLocalizations.length === 0 ? (
                    <div
                      className={cn(
                        "py-8 text-sm text-muted-foreground",
                        sidebarCollapsed && "md:px-2 md:text-center md:text-xs",
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
                          "relative flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors",
                          sidebarCollapsed && "md:justify-center md:px-0 md:py-2.5",
                          isActive
                            ? "bg-accent text-accent-foreground"
                            : "text-foreground hover:bg-muted",
                        )}
                        title={sidebarCollapsed ? localization.name : undefined}
                      >
                        <span
                          className={cn(
                            "flex min-w-0 items-center gap-2",
                            sidebarCollapsed && "md:justify-center",
                          )}
                        >
                          <span
                            aria-hidden="true"
                            className="shrink-0 text-base"
                          >
                            {flag}
                          </span>
                          <span
                            className={cn(
                              "truncate",
                              sidebarCollapsed && "md:hidden",
                            )}
                          >
                            {localization.name}
                          </span>
                        </span>
                        {status.isComplete ? (
                          <Check
                            className={cn(
                              "ml-3 size-4 shrink-0 text-emerald-500",
                              sidebarCollapsed && "md:hidden",
                            )}
                          />
                        ) : null}
                        {status.hasErrors ? (
                          <AlertTriangle
                            className={cn(
                              "ml-3 size-4 shrink-0 text-red-500",
                              sidebarCollapsed && "md:hidden",
                            )}
                          />
                        ) : null}
                        {status.isIncomplete ? (
                          <Clock3
                            className={cn(
                              "ml-3 size-4 shrink-0 text-amber-500",
                              sidebarCollapsed && "md:hidden",
                            )}
                          />
                        ) : null}
                        {status.isComplete ? (
                          <span
                            className={cn(
                              "absolute top-1 right-1 hidden rounded-full bg-emerald-500/15 p-0.5 text-emerald-400",
                              sidebarCollapsed && "md:block",
                            )}
                          >
                            <Check className="size-3" />
                          </span>
                        ) : null}
                        {status.hasErrors ? (
                          <span
                            className={cn(
                              "absolute top-1 right-1 hidden rounded-full bg-red-500/15 p-0.5 text-red-500",
                              sidebarCollapsed && "md:block",
                            )}
                          >
                            <AlertTriangle className="size-3" />
                          </span>
                        ) : null}
                        {status.isIncomplete ? (
                          <span
                            className={cn(
                              "absolute top-1 right-1 hidden rounded-full bg-amber-500/15 p-0.5 text-amber-500",
                              sidebarCollapsed && "md:block",
                            )}
                          >
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

        <section className="min-h-0 px-4 py-6 sm:px-6 md:min-w-0 md:overflow-y-auto md:px-6 lg:px-8">
            {selectedLocalization ? (
              <div className="mx-auto w-full max-w-7xl space-y-6">
                <div className="sticky top-0 z-20 -mx-4 -mt-6 border-b border-border/70 bg-background/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 md:hidden">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <label
                        htmlFor="mobile-sidebar-toggle"
                        className="inline-flex h-10 shrink-0 items-center gap-2 rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                      >
                        <PanelLeftOpen className="size-4" />
                        Localizations
                      </label>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {selectedLocalization.name}
                        </p>
                      </div>
                    </div>
                    <DataTransferActions
                      compact
                      importIconOnly
                      showDescription={false}
                      className="shrink-0"
                    />
                  </div>
                </div>

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

                  <DataTransferActions
                    className="hidden md:flex"
                    importIconOnly
                  />
                </div>

                {!storageNoticeDismissed ? (
                  <div className="rounded-2xl border border-orange-400/40 bg-orange-500/12 px-4 py-4 text-sm text-orange-100">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 rounded-full bg-orange-400/20 p-1.5 text-orange-300">
                        <AlertTriangle className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">Your data stays in this browser.</p>
                        <p className="mt-1 text-orange-200/85">
                          Refreshing is safe, but switching browsers or devices
                          requires using the export and import actions in the top
                          right corner.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={dismissStorageNotice}
                        className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-orange-200/75 transition-colors hover:bg-orange-400/20 hover:text-orange-100"
                        aria-label="Dismiss storage notice"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  </div>
                ) : null}

                <div className="space-y-6">
                  <div className="grid items-stretch gap-4 min-[500px]:grid-cols-2 md:gap-5 lg:gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                    <div className="space-y-5">
                      {EDITABLE_FIELDS.filter(
                        (field) => field !== "description",
                      ).map((field) => {
                        const value = selectedLocalization.fields[field];
                        const fieldError = getFieldError(field, value);

                        return (
                          <EditorFieldCard
                            key={field}
                            title={FIELD_LABELS[field]}
                            description={fieldDescriptions[field]}
                          >
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
                                <span className="block min-h-5" />
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
                          </EditorFieldCard>
                        );
                      })}
                    </div>

                    <div className="flex min-w-0">
                      <div className="flex min-h-full w-full flex-col min-[500px]:sticky min-[500px]:top-6">
                        <EditorFieldCard
                          title="Brainstorm keywords"
                          description="Draft ideas here, then move the best ones into title, subtitle, and keywords."
                          className="min-h-full"
                          contentClassName="flex min-h-0 flex-1 flex-col gap-3 pt-3"
                        >
                          <div className="flex min-h-0 flex-1">
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
                        </EditorFieldCard>
                      </div>
                    </div>
                  </div>

                  {EDITABLE_FIELDS.filter(
                    (field) => field === "description",
                  ).map((field) => {
                    const value = selectedLocalization.fields[field];
                    const fieldError = getFieldError(field, value);

                    return (
                      <EditorFieldCard
                        key={field}
                        title={FIELD_LABELS[field]}
                        description={fieldDescriptions[field]}
                      >
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
                            <span className="block min-h-5" />
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
                      </EditorFieldCard>
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
    </main>
  );
}
