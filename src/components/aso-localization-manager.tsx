"use client";

import { useDeferredValue, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Check,
  Clock3,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  X,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  EDITABLE_FIELDS,
  FIELD_LABELS,
  getFieldError,
  getOverflowingFieldCount,
  getRemainingCharacters,
  getSearchableLocalizationText,
  isLocalizationComplete,
  normalizeText,
  parseBrainstorm,
  type AsoFieldKey,
  type BrainstormKeyword,
} from "@/lib/aso";
import { useAsoStore } from "@/lib/aso-store";
import { cn } from "@/lib/utils";

const TRACKED_FIELDS = [
  "title",
  "subtitle",
  "keywords",
] as const satisfies readonly AsoFieldKey[];

const fieldDescriptions: Record<AsoFieldKey, string> = {
  title: "Primary 30-character App Store title.",
  subtitle: "Secondary 30-character supporting line.",
  keywords:
    "Use comma-separated keywords with no spaces around commas and no special characters.",
  description: "Long-form App Store description with a 4000-character limit.",
};

const fieldPlaceholders: Record<AsoFieldKey, string> = {
  title: "Photo editor for creators",
  subtitle: "Fast AI retouching",
  keywords: "photo editor,ai photo,collage",
  description:
    "Describe your app value, features, trust signals, and main reasons to install.",
};

const localizationFlags: Record<string, string> = {
  "English (U.S.)": "🇺🇸",
  Arabic: "🇸🇦",
  "English (Australia)": "🇦🇺",
  "English (Canada)": "🇨🇦",
  "English (U.K.)": "🇬🇧",
  French: "🇫🇷",
  German: "🇩🇪",
  Italian: "🇮🇹",
  "Portuguese (Brazil)": "🇧🇷",
  "Portuguese (Portugal)": "🇵🇹",
  "Spanish (Mexico)": "🇲🇽",
  "Spanish (Spain)": "🇪🇸",
  Turkish: "🇹🇷",
  Bangla: "🇧🇩",
  Catalan: "🏴",
  "Chinese (Simplified)": "🇨🇳",
  "Chinese (Traditional)": "🇹🇼",
  Croatian: "🇭🇷",
  Czech: "🇨🇿",
  Danish: "🇩🇰",
  Dutch: "🇳🇱",
  Finnish: "🇫🇮",
  "French (Canada)": "🇨🇦",
  Greek: "🇬🇷",
  Gujarati: "🇮🇳",
  Hebrew: "🇮🇱",
  Hindi: "🇮🇳",
  Hungarian: "🇭🇺",
  Indonesian: "🇮🇩",
  Japanese: "🇯🇵",
  Kannada: "🇮🇳",
  Korean: "🇰🇷",
  Malay: "🇲🇾",
  Malayalam: "🇮🇳",
  Marathi: "🇮🇳",
  Norwegian: "🇳🇴",
  Odia: "🇮🇳",
  Polish: "🇵🇱",
  Punjabi: "🇮🇳",
  Romanian: "🇷🇴",
  Russian: "🇷🇺",
  Slovak: "🇸🇰",
  Slovenian: "🇸🇮",
  Swedish: "🇸🇪",
  Tamil: "🇮🇳",
  Telugu: "🇮🇳",
  Thai: "🇹🇭",
  Ukrainian: "🇺🇦",
  Urdu: "🇵🇰",
  Vietnamese: "🇻🇳",
};

function formatCounter(field: AsoFieldKey, value: string) {
  const remaining = getRemainingCharacters(field, value);
  return remaining.toString();
}

function formatScore(score: number) {
  return Number.isInteger(score) ? score.toString() : score.toFixed(1);
}

function getLocalizationFlag(name: string) {
  return localizationFlags[name] ?? "🌐";
}

function serializeBrainstormEntries(entries: BrainstormKeyword[]) {
  return entries
    .map((entry) => `${entry.keyword} | ${formatScore(entry.score)}`)
    .join("\n");
}

function parseDraftBrainstormEntry(draft: string, lineNumber: number) {
  const trimmedDraft = draft.trim();

  if (!trimmedDraft) {
    return null;
  }

  const separatorMatch = trimmedDraft.match(
    /^(.*?)(?:\s*(?:\||,|:|\t)\s*(-?\d+(?:\.\d+)?))$/,
  );
  const trailingScoreMatch = trimmedDraft.match(
    /^(.*?)(?:\s+(-?\d+(?:\.\d+)?))$/,
  );
  const keyword = (
    separatorMatch?.[1] ??
    trailingScoreMatch?.[1] ??
    trimmedDraft
  ).trim();
  const parsedScore = Number(
    separatorMatch?.[2] ?? trailingScoreMatch?.[2] ?? "0",
  );

  if (!keyword) {
    return null;
  }

  return {
    keyword,
    normalizedKeyword: normalizeText(keyword),
    score: Number.isFinite(parsedScore) ? parsedScore : 0,
    raw: trimmedDraft,
    lineNumber,
  } satisfies BrainstormKeyword;
}

function countKeywordMentions(keyword: string, sourceText: string) {
  const normalizedKeyword = normalizeText(keyword);
  const normalizedSourceText = normalizeText(sourceText);

  if (!normalizedKeyword || !normalizedSourceText) {
    return 0;
  }

  let count = 0;
  let startIndex = 0;

  while (startIndex < normalizedSourceText.length) {
    const foundIndex = normalizedSourceText.indexOf(
      normalizedKeyword,
      startIndex,
    );

    if (foundIndex === -1) {
      break;
    }

    count += 1;
    startIndex = foundIndex + normalizedKeyword.length;
  }

  return count;
}

function getKeywordTrackingState(
  entry: BrainstormKeyword,
  currentFields: Record<(typeof TRACKED_FIELDS)[number], string>,
  otherTrackedTexts: string[],
) {
  const currentMentions = TRACKED_FIELDS.reduce((total, field) => {
    return total + countKeywordMentions(entry.keyword, currentFields[field]);
  }, 0);
  const otherMentions = otherTrackedTexts.reduce((total, text) => {
    return total + countKeywordMentions(entry.keyword, text);
  }, 0);
  const totalMentions = currentMentions + otherMentions;

  if (totalMentions === 0) {
    return {
      className: "border-border bg-background text-muted-foreground",
    };
  }

  if (totalMentions === 1) {
    return {
      className: "border-emerald-300 bg-emerald-50 text-emerald-900",
    };
  }

  return {
    className: "border-amber-300 bg-amber-50 text-amber-900",
  };
}

function isLocalizationTouched(
  localization: ReturnType<
    typeof useAsoStore.getState
  >["localizations"][number],
) {
  return (
    EDITABLE_FIELDS.some(
      (field) => localization.fields[field].trim().length > 0,
    ) || localization.brainstorm.trim().length > 0
  );
}

function KeywordBadge({
  entry,
  statusClassName,
  onRemove,
}: {
  entry: BrainstormKeyword;
  statusClassName: string;
  onRemove?: () => void;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.76rem] font-medium",
        statusClassName,
      )}
    >
      <span>{entry.keyword}</span>
      <span className="rounded-full bg-foreground/6 px-1.5 py-0.5 text-[0.68rem] font-semibold">
        {formatScore(entry.score)}
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

function BrainstormTagInput({
  inputId,
  brainstorm,
  onChange,
  renderTag,
}: {
  inputId: string;
  brainstorm: string;
  onChange: (value: string) => void;
  renderTag: (
    entry: BrainstormKeyword,
    index: number,
    onRemove: () => void,
  ) => React.ReactNode;
}) {
  const [draft, setDraft] = useState("");
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

  return (
    <div
      className="flex-1 min-h-[220px] rounded-xl border border-border bg-background px-3 py-3 shadow-none transition-colors focus-within:border-foreground/30 lg:min-h-full"
      onClick={() => inputRef.current?.focus()}
    >
      <div className="flex flex-wrap items-start gap-2">
        {entries.map((entry, index) => (
          <div key={`${entry.keyword}-${index}`}>
            {renderTag(entry, index, () => removeEntry(index))}
          </div>
        ))}

        <input
          id={inputId}
          ref={inputRef}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              commitDraft();
            }

            if (event.key === "Backspace" && !draft && entries.length > 0) {
              event.preventDefault();
              removeEntry(entries.length - 1);
            }
          }}
          onBlur={() => {
            commitDraft();
          }}
          onPaste={(event) => {
            const pastedText = event.clipboardData.getData("text");

            if (!pastedText.includes("\n")) {
              return;
            }

            event.preventDefault();
            const pastedEntries = parseBrainstorm(pastedText);

            if (pastedEntries.length === 0) {
              return;
            }

            onChange(
              serializeBrainstormEntries([...entries, ...pastedEntries]),
            );
            setDraft("");
          }}
          placeholder={
            entries.length === 0 ? "Type keyword score, then press Enter" : ""
          }
          className="min-w-[180px] flex-1 border-0 bg-transparent py-1 text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>
    </div>
  );
}

export function AsoLocalizationManager() {
  const localizations = useAsoStore((state) => state.localizations);
  const selectedLocalizationId = useAsoStore(
    (state) => state.selectedLocalizationId,
  );
  const selectLocalization = useAsoStore((state) => state.selectLocalization);
  const sidebarCollapsed = useAsoStore((state) => state.sidebarCollapsed);
  const toggleSidebarCollapsed = useAsoStore(
    (state) => state.toggleSidebarCollapsed,
  );
  const updateField = useAsoStore((state) => state.updateField);
  const updateBrainstorm = useAsoStore((state) => state.updateBrainstorm);

  const [isHydrated, setIsHydrated] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let frameId = 0;

    const markHydrated = () => {
      frameId = window.requestAnimationFrame(() => {
        setIsHydrated(true);
      });
    };

    if (!useAsoStore.persist || useAsoStore.persist.hasHydrated()) {
      markHydrated();

      return () => {
        window.cancelAnimationFrame(frameId);
      };
    }

    const unsubscribe = useAsoStore.persist.onFinishHydration(() => {
      markHydrated();
    });

    return () => {
      window.cancelAnimationFrame(frameId);
      unsubscribe();
    };
  }, []);

  const activeLocalizationId =
    selectedLocalizationId || localizations[0]?.id || null;
  const selectedLocalization =
    localizations.find(
      (localization) => localization.id === activeLocalizationId,
    ) ?? null;

  const deferredSearchQuery = useDeferredValue(searchQuery);
  const normalizedSearchQuery = normalizeText(deferredSearchQuery);

  const visibleLocalizations = localizations
    .filter((localization) =>
      normalizeText(localization.name).includes(normalizedSearchQuery),
    )
    .sort((left, right) => {
      const leftTouched = isLocalizationTouched(left);
      const rightTouched = isLocalizationTouched(right);

      if (leftTouched !== rightTouched) {
        return leftTouched ? -1 : 1;
      }

      const leftComplete = isLocalizationComplete(left.fields);
      const rightComplete = isLocalizationComplete(right.fields);

      if (leftComplete !== rightComplete) {
        return leftComplete ? -1 : 1;
      }

      return left.name.localeCompare(right.name);
    });
  const otherLocalizations = selectedLocalization
    ? localizations.filter(
        (localization) => localization.id !== selectedLocalization.id,
      )
    : [];
  const otherTrackedTexts = otherLocalizations.map((localization) =>
    getSearchableLocalizationText(localization.fields),
  );

  function handleSelectLocalization(localizationId: string) {
    selectLocalization(localizationId);
    setSearchQuery("");
  }

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
            <div className="flex h-full min-h-screen flex-col py-4 lg:min-h-0 lg:h-screen">
              <div
                className={cn(
                  "flex items-center gap-2",
                  sidebarCollapsed ? "px-2" : "px-4",
                  sidebarCollapsed ? "justify-center" : "justify-between",
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
                        onClick={() => setSearchQuery("")}
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
                      const isComplete = isLocalizationComplete(
                        localization.fields,
                      );
                      const isTouched = isLocalizationTouched(localization);
                      const hasErrors =
                        getOverflowingFieldCount(localization.fields) > 0;
                      const isIncomplete = isTouched && !isComplete && !hasErrors;
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
                          {!sidebarCollapsed && isComplete ? (
                            <Check className="ml-3 size-4 shrink-0 text-emerald-500" />
                          ) : null}
                          {!sidebarCollapsed && hasErrors ? (
                            <AlertTriangle className="ml-3 size-4 shrink-0 text-red-500" />
                          ) : null}
                          {!sidebarCollapsed && isIncomplete ? (
                            <Clock3 className="ml-3 size-4 shrink-0 text-amber-500" />
                          ) : null}
                          {sidebarCollapsed && isComplete ? (
                            <span className="absolute top-1 right-1 rounded-full bg-emerald-500/15 p-0.5 text-emerald-400">
                              <Check className="size-3" />
                            </span>
                          ) : null}
                          {sidebarCollapsed && hasErrors ? (
                            <span className="absolute top-1 right-1 rounded-full bg-red-500/15 p-0.5 text-red-500">
                              <AlertTriangle className="size-3" />
                            </span>
                          ) : null}
                          {sidebarCollapsed && isIncomplete ? (
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
                <div className="flex items-center gap-3">
                  <span className="text-xl">
                    {getLocalizationFlag(selectedLocalization.name)}
                  </span>
                  <h1 className="text-xl font-semibold tracking-tight">
                    {selectedLocalization.name}
                  </h1>
                  {isLocalizationComplete(selectedLocalization.fields) ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                      <Check className="size-3.5" />
                      Complete
                    </span>
                  ) : getOverflowingFieldCount(selectedLocalization.fields) >
                    0 ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
                      <AlertTriangle className="size-3.5" />
                      Has errors
                    </span>
                  ) : isLocalizationTouched(selectedLocalization) ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                      <Clock3 className="size-3.5" />
                      In progress
                    </span>
                  ) : null}
                </div>

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
                                    getRemainingCharacters(field, value) < 0
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
                              renderTag={(entry, _index, onRemove) => {
                                const trackingState = getKeywordTrackingState(
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
                                    statusClassName={trackingState.className}
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
                                getRemainingCharacters(field, value) < 0
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
