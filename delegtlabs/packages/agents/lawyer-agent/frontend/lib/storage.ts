/**
 * SSR-safe LocalStorage utilities for frontend app.
 */

export const STORAGE_KEY = "delegatlabs_ui_language";

export const getSelectedLanguage = (defaultValue: "en" | "hi" = "en"): "en" | "hi" => {
  if (typeof window === "undefined") {
    return defaultValue;
  }
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (value === "en" || value === "hi") {
      return value;
    }
    return defaultValue;
  } catch (error) {
    console.error("Error reading language from localStorage", error);
    return defaultValue;
  }
};

export const setSelectedLanguage = (value: "en" | "hi"): void => {
  if (typeof window === "undefined") {
    return;
  }
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch (error) {
    console.error("Error writing language to localStorage", error);
  }
};

export const getIntakeKey = (draftId: string): string => {
  return `delegatlabs_draft_intake_${draftId}`;
};

export const saveDraftIntake = (draftId: string, answers: Record<string, any>): void => {
  if (typeof window === "undefined") {
    return;
  }
  try {
    localStorage.setItem(getIntakeKey(draftId), JSON.stringify(answers));
  } catch (error) {
    console.error(`Error saving intake for ${draftId}`, error);
  }
};

export const getDraftIntake = (draftId: string): Record<string, any> => {
  if (typeof window === "undefined") {
    return {};
  }
  try {
    const data = localStorage.getItem(getIntakeKey(draftId));
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error(`Error reading intake for ${draftId}`, error);
    return {};
  }
};

export const clearDraftIntake = (draftId: string): void => {
  if (typeof window === "undefined") {
    return;
  }
  try {
    localStorage.removeItem(getIntakeKey(draftId));
  } catch (error) {
    console.error(`Error clearing intake for ${draftId}`, error);
  }
};

export const getDraftLanguage = (defaultValue: "en" | "hi" = "en"): "en" | "hi" => {
  if (typeof window === "undefined") {
    return defaultValue;
  }
  try {
    const value = localStorage.getItem("delegatlabs_draft_language");
    if (value === "en" || value === "hi") {
      return value;
    }
    return defaultValue;
  } catch (error) {
    console.error("Error reading draft language from localStorage", error);
    return defaultValue;
  }
};

export const getCustomInstructionsKey = (draftId: string): string => {
  return `delegatlabs_draft_custom_instructions_${draftId}`;
};

export const saveDraftCustomInstructions = (draftId: string, value: string): void => {
  if (typeof window === "undefined") {
    return;
  }
  try {
    localStorage.setItem(getCustomInstructionsKey(draftId), value);
  } catch (error) {
    console.error(`Error saving custom instructions for ${draftId}`, error);
  }
};

export const getDraftCustomInstructions = (draftId: string): string => {
  if (typeof window === "undefined") {
    return "";
  }
  try {
    return localStorage.getItem(getCustomInstructionsKey(draftId)) || "";
  } catch (error) {
    console.error(`Error reading custom instructions for ${draftId}`, error);
    return "";
  }
};

export const getGeneratedDraftKey = (draftId: string): string => {
  return `delegatlabs_generated_draft_${draftId}`;
};

export const saveGeneratedDraft = (draftId: string, value: Record<string, any>): void => {
  if (typeof window === "undefined") {
    return;
  }
  try {
    localStorage.setItem(getGeneratedDraftKey(draftId), JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving generated draft for ${draftId}`, error);
  }
};

export const getGeneratedDraft = (draftId: string): Record<string, any> | null => {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const data = localStorage.getItem(getGeneratedDraftKey(draftId));
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error(`Error reading generated draft for ${draftId}`, error);
    return null;
  }
};

export const clearGeneratedDraft = (draftId: string): void => {
  if (typeof window === "undefined") {
    return;
  }
  try {
    localStorage.removeItem(getGeneratedDraftKey(draftId));
  } catch (error) {
    console.error(`Error clearing generated draft for ${draftId}`, error);
  }
};
