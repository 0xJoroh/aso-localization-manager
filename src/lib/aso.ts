import { z } from "zod";

export const FIELD_LIMITS = {
  title: 30,
  subtitle: 30,
  keywords: 100,
  description: 4000,
} as const;

export const FIELD_LABELS = {
  title: "Title",
  subtitle: "Subtitle",
  keywords: "Keywords",
  description: "Description",
} as const;

export type AsoFieldKey = keyof typeof FIELD_LIMITS;

export const EDITABLE_FIELDS = [
  "title",
  "subtitle",
  "keywords",
  "description",
] as const satisfies readonly AsoFieldKey[];

export type LocalizationFields = {
  [Key in AsoFieldKey]: string;
};

export type AppleLocalizationDefinition = {
  id: string;
  name: string;
};

export type BrainstormKeyword = {
  keyword: string;
  normalizedKeyword: string;
  score: number;
  raw: string;
  lineNumber: number;
};

export const EMPTY_LOCALIZATION_FIELDS: LocalizationFields = {
  title: "",
  subtitle: "",
  keywords: "",
  description: "",
};

const APPLE_APP_STORE_LOCALIZATION_NAMES = [
  "English (U.S.)",
  "Arabic",
  "English (Australia)",
  "English (Canada)",
  "English (U.K.)",
  "French",
  "German",
  "Italian",
  "Portuguese (Brazil)",
  "Portuguese (Portugal)",
  "Spanish (Mexico)",
  "Spanish (Spain)",
  "Turkish",
  "Bangla",
  "Catalan",
  "Chinese (Simplified)",
  "Chinese (Traditional)",
  "Croatian",
  "Czech",
  "Danish",
  "Dutch",
  "Finnish",
  "French (Canada)",
  "Greek",
  "Gujarati",
  "Hebrew",
  "Hindi",
  "Hungarian",
  "Indonesian",
  "Japanese",
  "Kannada",
  "Korean",
  "Malay",
  "Malayalam",
  "Marathi",
  "Norwegian",
  "Odia",
  "Polish",
  "Punjabi",
  "Romanian",
  "Russian",
  "Slovak",
  "Slovenian",
  "Swedish",
  "Tamil",
  "Telugu",
  "Thai",
  "Ukrainian",
  "Urdu",
  "Vietnamese",
] as const;

function slugifyLocalizationName(name: string) {
  return name
    .toLowerCase()
    .replace(/\./g, "")
    .replace(/[()]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export const APPLE_APP_STORE_LOCALIZATIONS =
  APPLE_APP_STORE_LOCALIZATION_NAMES.map((name) => ({
    id: slugifyLocalizationName(name),
    name,
  })) satisfies AppleLocalizationDefinition[];

export function countCharacters(value: string) {
  return Array.from(value).length;
}

function createCharacterSchema(fieldLabel: string, limit: number) {
  return z.string().superRefine((value, context) => {
    if (countCharacters(value) > limit) {
      context.addIssue({
        code: "custom",
        message: `${fieldLabel} must be ${limit} characters or fewer.`,
      });
    }
  });
}

export const localizationSchema = z.object({
  title: createCharacterSchema("Title", FIELD_LIMITS.title),
  subtitle: createCharacterSchema("Subtitle", FIELD_LIMITS.subtitle),
  keywords: createCharacterSchema("Keywords", FIELD_LIMITS.keywords),
  description: createCharacterSchema("Description", FIELD_LIMITS.description),
});

const fieldSchemas: Record<
  AsoFieldKey,
  ReturnType<typeof createCharacterSchema>
> = {
  title: createCharacterSchema("Title", FIELD_LIMITS.title),
  subtitle: createCharacterSchema("Subtitle", FIELD_LIMITS.subtitle),
  keywords: createCharacterSchema("Keywords", FIELD_LIMITS.keywords),
  description: createCharacterSchema("Description", FIELD_LIMITS.description),
};

export function createEmptyLocalizationRecord(
  localization: AppleLocalizationDefinition
) {
  return {
    ...localization,
    fields: { ...EMPTY_LOCALIZATION_FIELDS },
    brainstorm: "",
  };
}

export function getRemainingCharacters(field: AsoFieldKey, value: string) {
  return FIELD_LIMITS[field] - countCharacters(value);
}

export function getFieldError(field: AsoFieldKey, value: string) {
  const result = fieldSchemas[field].safeParse(value);

  if (result.success) {
    return null;
  }

  return result.error.issues[0]?.message ?? null;
}

export function getFilledFieldCount(fields: LocalizationFields) {
  return EDITABLE_FIELDS.filter((field) => Boolean(fields[field].trim())).length;
}

export function getOverflowingFieldCount(fields: LocalizationFields) {
  return EDITABLE_FIELDS.filter((field) =>
    Boolean(getFieldError(field, fields[field]))
  ).length;
}

export function isLocalizationComplete(fields: LocalizationFields) {
  return (
    getFilledFieldCount(fields) === EDITABLE_FIELDS.length &&
    getOverflowingFieldCount(fields) === 0
  );
}

export function normalizeText(value: string) {
  return value.normalize("NFKC").toLowerCase().replace(/\s+/g, " ").trim();
}

export function keywordAppearsInText(keyword: string, sourceText: string) {
  const normalizedKeyword = normalizeText(keyword);
  const normalizedSourceText = normalizeText(sourceText);

  if (!normalizedKeyword || !normalizedSourceText) {
    return false;
  }

  return normalizedSourceText.includes(normalizedKeyword);
}

export function parseBrainstorm(raw: string) {
  return raw
    .split(/\r?\n/)
    .map((line, index) => {
      const rawLine = line.trim();

      if (!rawLine) {
        return null;
      }

      const match = rawLine.match(
        /^(.*?)(?:\s*(?:\||,|:|\t)\s*(-?\d+(?:\.\d+)?))?$/
      );

      const keyword = match?.[1]?.trim() || rawLine;
      const parsedScore = match?.[2] ? Number(match[2]) : 0;

      if (!keyword) {
        return null;
      }

      return {
        keyword,
        normalizedKeyword: normalizeText(keyword),
        score: Number.isFinite(parsedScore) ? parsedScore : 0,
        raw: rawLine,
        lineNumber: index + 1,
      } satisfies BrainstormKeyword;
    })
    .filter((entry): entry is BrainstormKeyword => Boolean(entry));
}

export function sortBrainstormKeywords(entries: BrainstormKeyword[]) {
  return [...entries].sort((left, right) => {
    if (left.score !== right.score) {
      return right.score - left.score;
    }

    return left.keyword.localeCompare(right.keyword);
  });
}

export function getSearchableLocalizationText(
  fields: Pick<LocalizationFields, "title" | "subtitle" | "keywords">
) {
  return [fields.title, fields.subtitle, fields.keywords].join(" ");
}
