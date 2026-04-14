import { getRemainingCharacters, type AsoFieldKey } from "@/lib/aso";

export const fieldDescriptions: Record<AsoFieldKey, string> = {
  title: "Primary 30-character App Store title.",
  subtitle: "Secondary 30-character supporting line.",
  keywords:
    "Use comma-separated keywords with no spaces around commas and no special characters.",
  description: "Long-form App Store description with a 4000-character limit.",
};

export const fieldPlaceholders: Record<AsoFieldKey, string> = {
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

export function formatCounter(field: AsoFieldKey, value: string) {
  return getRemainingCharacters(field, value).toString();
}

export function getLocalizationFlag(name: string) {
  return localizationFlags[name] ?? "🌐";
}
