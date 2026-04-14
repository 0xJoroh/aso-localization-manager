import {
  normalizeText,
  type AsoFieldKey,
  type BrainstormKeyword,
} from "@/lib/aso";

const TRACKED_FIELDS = [
  "title",
  "subtitle",
  "keywords",
] as const satisfies readonly AsoFieldKey[];

export function formatBrainstormScore(score: number) {
  return Number.isInteger(score) ? score.toString() : score.toFixed(1);
}

export function serializeBrainstormEntries(entries: BrainstormKeyword[]) {
  return entries
    .map((entry) => `${entry.keyword} | ${formatBrainstormScore(entry.score)}`)
    .join("\n");
}

export function parseDraftBrainstormEntry(draft: string, lineNumber: number) {
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

export function getKeywordTrackingClassName(
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
    return "border-border bg-background text-muted-foreground";
  }

  if (totalMentions === 1) {
    return "border-emerald-300 bg-emerald-50 text-emerald-900";
  }

  return "border-amber-300 bg-amber-50 text-amber-900";
}
