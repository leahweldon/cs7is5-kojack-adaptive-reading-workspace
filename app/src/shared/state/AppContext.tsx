/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useRef, useState } from "react";

export type ReadingGoal = "skim" | "understand" | "study";
export type SupportLevel = "low" | "medium" | "high";
export type ThemeMode = "light" | "dark" | "high-contrast";
export type SessionMode = "study" | "revise" | "skim";
export type PromptFrequency = "low" | "medium" | "high";

export type Preferences = {
  readingGoal: ReadingGoal;
  supportLevel: SupportLevel;

  bionicReading: boolean;
  chunking: boolean;
  glossary: boolean;
  adaptivePrompts: boolean;
  progressIndicators: boolean;

  promptFrequency: PromptFrequency;

  encouragementNudges: boolean;
  distractionPrompts: boolean;

  fontSize: number;
  lineSpacing: number;
  maxLineWidth: number;

  theme: ThemeMode;
};

export type UserModel = {
  supportLevel: SupportLevel;
  glossaryPreference: boolean;
  bionicPreference: boolean;
  detectedDifficultySections: string[];
};

export type ChangeType = "info" | "suggestion" | "auto";

export type ChangeLogEntry = {
  id: string;
  type: ChangeType;
  message: string;
  timestamp: Date;
};

export type SessionState = {
  startTime: Date | null;
  readingTimeSec: number;
  scrollBackCount: number;
  longPauseCount: number;

  sessionMode: SessionMode;

  toggleUsage: Record<string, number>;
};

type AppState = {
  userName: string;
  setUserName: (v: string) => void;

  preferences: Preferences;
  setPreferences: (patch: Partial<Preferences>) => void;

  userModel: UserModel;
  setUserModel: (patch: Partial<UserModel>) => void;

  documentText: string;
  setDocumentText: (v: string) => void;

  changeLog: ChangeLogEntry[];
  addChange: (message: string, type: ChangeType) => void;
  clearChangeLog: () => void;

  session: SessionState;
  setSession: React.Dispatch<React.SetStateAction<SessionState>>;

  bumpToggle: (key: string) => void;
  bumpScrollBack: () => void;
  bumpLongPause: () => void;

  layoutLocked: boolean;
  setLayoutLocked: (v: boolean) => void;

  promptsDisabled: boolean;
  setPromptsDisabled: (v: boolean) => void;

  resetSession: () => void;
};

const STORAGE_USER = "claritylayer:userName:v1";
const STORAGE_PREFS = "claritylayer:preferences:v1";

const defaultPreferences: Preferences = {
  readingGoal: "understand",
  supportLevel: "medium",

  bionicReading: false,
  chunking: false,
  glossary: true,
  adaptivePrompts: true,
  progressIndicators: true,

  promptFrequency: "medium",

  encouragementNudges: true,
  distractionPrompts: true,

  fontSize: 16,
  lineSpacing: 1.6,
  maxLineWidth: 720,

  theme: "light",
};

const defaultUserModel: UserModel = {
  supportLevel: "medium",
  glossaryPreference: true,
  bionicPreference: false,
  detectedDifficultySections: [],
};

const defaultSession: SessionState = {
  startTime: null,
  readingTimeSec: 0,
  scrollBackCount: 0,
  longPauseCount: 0,
  sessionMode: "study",
  toggleUsage: {},
};

function safeLoad<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function safeSave(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // fine for POC atm
  }
}

const Ctx = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [userName, setUserNameState] = useState(() => safeLoad<string>(STORAGE_USER) ?? "");

  const [preferences, setPreferencesState] = useState<Preferences>(() => {
    const stored = safeLoad<Partial<Preferences>>(STORAGE_PREFS);

    // merge stored prefs with defaults so adding new fields doesn't break old storage
    return stored ? { ...defaultPreferences, ...stored } : defaultPreferences;
  });

  const [userModel, setUserModelState] = useState<UserModel>(() => ({
    ...defaultUserModel,
    supportLevel: preferences.supportLevel,
    glossaryPreference: preferences.glossary,
    bionicPreference: preferences.bionicReading,
  }));

  const [documentText, setDocumentText] = useState("");
  const [changeLog, setChangeLog] = useState<ChangeLogEntry[]>([]);
  const [session, setSession] = useState<SessionState>(defaultSession);

  const [layoutLocked, setLayoutLocked] = useState(false);
  const [promptsDisabled, setPromptsDisabled] = useState(false);

  const idRef = useRef(0);

  useEffect(() => {
    safeSave(STORAGE_USER, userName);
  }, [userName]);

  useEffect(() => {
    safeSave(STORAGE_PREFS, preferences);
  }, [preferences]);

  const setUserName = (v: string) => setUserNameState(v);

  const setPreferences = (patch: Partial<Preferences>) => {
    setPreferencesState((prev) => ({ ...prev, ...patch }));
  };

  const setUserModel = (patch: Partial<UserModel>) => {
    setUserModelState((prev) => ({ ...prev, ...patch }));
  };

  const addChange = (message: string, type: ChangeType) => {
    idRef.current += 1;
    setChangeLog((prev) => [
      { id: String(idRef.current), type, message, timestamp: new Date() },
      ...prev,
    ]);
  };

  const clearChangeLog = () => setChangeLog([]);

  const bumpToggle = (key: string) => {
    setSession((prev) => ({
      ...prev,
      toggleUsage: {
        ...prev.toggleUsage,
        [key]: (prev.toggleUsage[key] || 0) + 1,
      },
    }));
  };

  const bumpScrollBack = () => {
    setSession((prev) => ({ ...prev, scrollBackCount: prev.scrollBackCount + 1 }));
  };

  const bumpLongPause = () => {
    setSession((prev) => ({ ...prev, longPauseCount: prev.longPauseCount + 1 }));
  };

  const resetSession = () => {
    setSession({ ...defaultSession, startTime: new Date() });
    setChangeLog([]);
    setPromptsDisabled(false);

    setUserModelState({
      ...defaultUserModel,
      supportLevel: preferences.supportLevel,
      glossaryPreference: preferences.glossary,
      bionicPreference: preferences.bionicReading,
    });
  };

  const value: AppState = {
    userName,
    setUserName,

    preferences,
    setPreferences,

    userModel,
    setUserModel,

    documentText,
    setDocumentText,

    changeLog,
    addChange,
    clearChangeLog,

    session,
    setSession,

    bumpToggle,
    bumpScrollBack,
    bumpLongPause,

    layoutLocked,
    setLayoutLocked,

    promptsDisabled,
    setPromptsDisabled,

    resetSession,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}