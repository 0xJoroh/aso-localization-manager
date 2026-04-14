"use client";

import { useDeferredValue, useEffect, useState } from "react";

import {
  EDITABLE_FIELDS,
  getOverflowingFieldCount,
  getSearchableLocalizationText,
  isLocalizationComplete,
  normalizeText,
} from "@/lib/aso";
import { type AppLocalization, useAsoStore } from "@/lib/aso-store";

export function isLocalizationTouched(localization: AppLocalization) {
  return (
    EDITABLE_FIELDS.some(
      (field) => localization.fields[field].trim().length > 0,
    ) || localization.brainstorm.trim().length > 0
  );
}

export function getLocalizationStatusDetails(localization: AppLocalization) {
  const isComplete = isLocalizationComplete(localization.fields);
  const hasErrors = getOverflowingFieldCount(localization.fields) > 0;
  const isTouched = isLocalizationTouched(localization);

  return {
    hasErrors,
    isComplete,
    isIncomplete: isTouched && !isComplete && !hasErrors,
    isTouched,
  };
}

export function useAsoLocalizationManager() {
  const localizations = useAsoStore((state) => state.localizations);
  const selectedLocalizationId = useAsoStore(
    (state) => state.selectedLocalizationId,
  );
  const selectLocalization = useAsoStore((state) => state.selectLocalization);
  const sidebarCollapsed = useAsoStore((state) => state.sidebarCollapsed);
  const toggleSidebarCollapsed = useAsoStore(
    (state) => state.toggleSidebarCollapsed,
  );
  const storageNoticeDismissed = useAsoStore(
    (state) => state.storageNoticeDismissed,
  );
  const dismissStorageNotice = useAsoStore(
    (state) => state.dismissStorageNotice,
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
  const otherTrackedTexts = selectedLocalization
    ? localizations
        .filter((localization) => localization.id !== selectedLocalization.id)
        .map((localization) =>
          getSearchableLocalizationText(localization.fields),
        )
    : [];

  function handleSelectLocalization(localizationId: string) {
    selectLocalization(localizationId);
    setSearchQuery("");
  }

  function clearSearchQuery() {
    setSearchQuery("");
  }

  return {
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
  };
}
