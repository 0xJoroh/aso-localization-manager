"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import {
  APPLE_APP_STORE_LOCALIZATIONS,
  createEmptyLocalizationRecord,
  normalizeText,
  type AppleLocalizationDefinition,
  type AsoFieldKey,
  type LocalizationFields,
} from "@/lib/aso";

export type AppLocalization = AppleLocalizationDefinition & {
  fields: LocalizationFields;
  brainstorm: string;
};

type PersistedAsoLocalizationState = {
  localizations: AppLocalization[];
  selectedLocalizationId: string;
  sidebarCollapsed: boolean;
};

type LegacyCountry = {
  id?: string;
  code?: string;
  name?: string;
  fields?: Partial<LocalizationFields>;
  brainstorm?: string;
};

type LegacyPersistedAsoLocalizationState = {
  countries?: LegacyCountry[];
  selectedCountryId?: string | null;
};

type AsoLocalizationStore = PersistedAsoLocalizationState & {
  selectLocalization: (localizationId: string) => void;
  setSidebarCollapsed: (sidebarCollapsed: boolean) => void;
  toggleSidebarCollapsed: () => void;
  updateField: (
    localizationId: string,
    field: AsoFieldKey,
    value: string
  ) => void;
  updateBrainstorm: (localizationId: string, value: string) => void;
};

function createDefaultLocalizations() {
  return APPLE_APP_STORE_LOCALIZATIONS.map(createEmptyLocalizationRecord);
}

function sanitizeFields(
  fields?: Partial<LocalizationFields>
): LocalizationFields {
  return {
    title: typeof fields?.title === "string" ? fields.title : "",
    subtitle: typeof fields?.subtitle === "string" ? fields.subtitle : "",
    keywords: typeof fields?.keywords === "string" ? fields.keywords : "",
    description:
      typeof fields?.description === "string" ? fields.description : "",
  };
}

function mergePersistedLocalizations(
  persistedLocalizations?: Partial<AppLocalization>[]
) {
  const savedLocalizations = Array.isArray(persistedLocalizations)
    ? persistedLocalizations
    : [];

  return APPLE_APP_STORE_LOCALIZATIONS.map((localization) => {
    const match = savedLocalizations.find((savedLocalization) => {
      if (savedLocalization.id === localization.id) {
        return true;
      }

      if (typeof savedLocalization.name !== "string") {
        return false;
      }

      return (
        normalizeText(savedLocalization.name) === normalizeText(localization.name)
      );
    });

    return {
      ...createEmptyLocalizationRecord(localization),
      fields: sanitizeFields(match?.fields),
      brainstorm: typeof match?.brainstorm === "string" ? match.brainstorm : "",
    };
  });
}

function migrateLegacyCountries(countries?: LegacyCountry[]) {
  const legacyLocalizations = Array.isArray(countries)
    ? countries.map((country) => ({
        id: typeof country.id === "string" ? country.id : "",
        name: typeof country.name === "string" ? country.name : "",
        fields: sanitizeFields(country.fields),
        brainstorm:
          typeof country.brainstorm === "string" ? country.brainstorm : "",
      }))
    : [];

  return mergePersistedLocalizations(legacyLocalizations);
}

function resolveSelectedLocalizationId(
  selectedLocalizationId: string | null | undefined,
  localizations: AppLocalization[]
) {
  if (
    selectedLocalizationId &&
    localizations.some(
      (localization) => localization.id === selectedLocalizationId
    )
  ) {
    return selectedLocalizationId;
  }

  return localizations[0]?.id ?? "";
}

function resolveLegacySelectedLocalizationId(
  selectedCountryId: string | null | undefined,
  countries: LegacyCountry[] | undefined,
  localizations: AppLocalization[]
) {
  const selectedCountry = Array.isArray(countries)
    ? countries.find((country) => country.id === selectedCountryId)
    : undefined;
  const selectedCountryName = selectedCountry?.name;

  if (typeof selectedCountryName !== "string") {
    return localizations[0]?.id ?? "";
  }

  const matchedLocalization = localizations.find(
    (localization) =>
      normalizeText(localization.name) === normalizeText(selectedCountryName)
  );

  return matchedLocalization?.id ?? localizations[0]?.id ?? "";
}

const defaultLocalizations = createDefaultLocalizations();
const defaultSelectedLocalizationId = defaultLocalizations[0]?.id ?? "";
const defaultSidebarCollapsed = false;

export const useAsoStore = create<AsoLocalizationStore>()(
  persist(
    (set) => ({
      localizations: defaultLocalizations,
      selectedLocalizationId: defaultSelectedLocalizationId,
      sidebarCollapsed: defaultSidebarCollapsed,
      selectLocalization: (selectedLocalizationId) => {
        set({ selectedLocalizationId });
      },
      setSidebarCollapsed: (sidebarCollapsed) => {
        set({ sidebarCollapsed });
      },
      toggleSidebarCollapsed: () => {
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }));
      },
      updateField: (localizationId, field, value) => {
        set((state) => ({
          localizations: state.localizations.map((localization) => {
            if (localization.id !== localizationId) {
              return localization;
            }

            return {
              ...localization,
              fields: {
                ...localization.fields,
                [field]: value,
              },
            };
          }),
        }));
      },
      updateBrainstorm: (localizationId, value) => {
        set((state) => ({
          localizations: state.localizations.map((localization) => {
            if (localization.id !== localizationId) {
              return localization;
            }

            return {
              ...localization,
              brainstorm: value,
            };
          }),
        }));
      },
    }),
    {
      name: "aso-localization-manager-storage",
      version: 3,
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState, version) => {
        const state = (persistedState ?? {}) as Partial<
          PersistedAsoLocalizationState & LegacyPersistedAsoLocalizationState
        >;

        if (version < 2) {
          const localizations = migrateLegacyCountries(state.countries);

          return {
            localizations,
            selectedLocalizationId: resolveLegacySelectedLocalizationId(
              state.selectedCountryId,
              state.countries,
              localizations
            ),
            sidebarCollapsed: defaultSidebarCollapsed,
          } satisfies Partial<PersistedAsoLocalizationState>;
        }

        if (version < 3) {
          return {
            ...state,
            sidebarCollapsed:
              typeof state.sidebarCollapsed === "boolean"
                ? state.sidebarCollapsed
                : defaultSidebarCollapsed,
          } satisfies Partial<PersistedAsoLocalizationState>;
        }

        return state as Partial<PersistedAsoLocalizationState>;
      },
      merge: (persistedState, currentState) => {
        const state = (persistedState ?? {}) as Partial<
          PersistedAsoLocalizationState
        >;
        const localizations = mergePersistedLocalizations(state.localizations);

        return {
          ...currentState,
          ...state,
          localizations,
          selectedLocalizationId: resolveSelectedLocalizationId(
            state.selectedLocalizationId,
            localizations
          ),
          sidebarCollapsed:
            typeof state.sidebarCollapsed === "boolean"
              ? state.sidebarCollapsed
              : currentState.sidebarCollapsed,
        };
      },
    }
  )
);
