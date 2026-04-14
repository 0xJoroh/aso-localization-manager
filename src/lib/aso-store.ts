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
  storageNoticeDismissed: boolean;
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
  dismissStorageNotice: () => void;
  updateField: (
    localizationId: string,
    field: AsoFieldKey,
    value: string
  ) => void;
  updateBrainstorm: (localizationId: string, value: string) => void;
};

export type ExportedAsoData = {
  app: "aso-localization-manager";
  exportedAt: string;
  version: number;
  state: PersistedAsoLocalizationState;
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

function normalizePersistedState(
  state?: Partial<PersistedAsoLocalizationState>
): PersistedAsoLocalizationState {
  const localizations = mergePersistedLocalizations(state?.localizations);

  return {
    localizations,
    selectedLocalizationId: resolveSelectedLocalizationId(
      state?.selectedLocalizationId,
      localizations
    ),
    sidebarCollapsed:
      typeof state?.sidebarCollapsed === "boolean"
        ? state.sidebarCollapsed
        : defaultSidebarCollapsed,
    storageNoticeDismissed:
      typeof state?.storageNoticeDismissed === "boolean"
        ? state.storageNoticeDismissed
        : defaultStorageNoticeDismissed,
  };
}

const defaultLocalizations = createDefaultLocalizations();
const defaultSelectedLocalizationId = defaultLocalizations[0]?.id ?? "";
const defaultSidebarCollapsed = false;
const defaultStorageNoticeDismissed = false;
const STORAGE_KEY = "aso-localization-manager-storage";
const STORAGE_VERSION = 4;

export function createAsoDataExport(): ExportedAsoData {
  const state = useAsoStore.getState();

  return {
    app: "aso-localization-manager",
    exportedAt: new Date().toISOString(),
    version: STORAGE_VERSION,
    state: normalizePersistedState({
      localizations: state.localizations,
      selectedLocalizationId: state.selectedLocalizationId,
      sidebarCollapsed: state.sidebarCollapsed,
      storageNoticeDismissed: state.storageNoticeDismissed,
    }),
  };
}

export function parseImportedAsoData(raw: string): PersistedAsoLocalizationState {
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("This file is not valid JSON.");
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error("This file does not contain ASO localization data.");
  }

  const exportedData = parsed as Partial<ExportedAsoData>;

  if (exportedData.app !== "aso-localization-manager") {
    throw new Error("This file was not exported from ASO Localization Manager.");
  }

  if (!exportedData.state || typeof exportedData.state !== "object") {
    throw new Error("This export is missing the saved workspace data.");
  }

  return normalizePersistedState(
    exportedData.state as Partial<PersistedAsoLocalizationState>
  );
}

export function importAsoData(state: PersistedAsoLocalizationState) {
  const normalizedState = normalizePersistedState(state);

  useAsoStore.setState(normalizedState);

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      state: normalizedState,
      version: STORAGE_VERSION,
    })
  );
}

export const useAsoStore = create<AsoLocalizationStore>()(
  persist(
    (set) => ({
      localizations: defaultLocalizations,
      selectedLocalizationId: defaultSelectedLocalizationId,
      sidebarCollapsed: defaultSidebarCollapsed,
      storageNoticeDismissed: defaultStorageNoticeDismissed,
      selectLocalization: (selectedLocalizationId) => {
        set({ selectedLocalizationId });
      },
      setSidebarCollapsed: (sidebarCollapsed) => {
        set({ sidebarCollapsed });
      },
      toggleSidebarCollapsed: () => {
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }));
      },
      dismissStorageNotice: () => {
        set({ storageNoticeDismissed: true });
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
      name: STORAGE_KEY,
      version: STORAGE_VERSION,
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
            storageNoticeDismissed: defaultStorageNoticeDismissed,
          } satisfies Partial<PersistedAsoLocalizationState>;
        }

        if (version < 3) {
          return {
            ...state,
            sidebarCollapsed:
              typeof state.sidebarCollapsed === "boolean"
                ? state.sidebarCollapsed
                : defaultSidebarCollapsed,
            storageNoticeDismissed: defaultStorageNoticeDismissed,
          } satisfies Partial<PersistedAsoLocalizationState>;
        }

        if (version < 4) {
          return {
            ...state,
            storageNoticeDismissed:
              typeof state.storageNoticeDismissed === "boolean"
                ? state.storageNoticeDismissed
                : defaultStorageNoticeDismissed,
          } satisfies Partial<PersistedAsoLocalizationState>;
        }

        return state as Partial<PersistedAsoLocalizationState>;
      },
      merge: (persistedState, currentState) => {
        return {
          ...currentState,
          ...normalizePersistedState(
            (persistedState ?? {}) as Partial<PersistedAsoLocalizationState>
          ),
        };
      },
    }
  )
);
