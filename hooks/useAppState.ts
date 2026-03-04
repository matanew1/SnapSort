import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, devtools, persist } from 'zustand/middleware';

interface AppPreferencesState {
  // Tutorial state
  hasSeenTutorial: boolean;
  lastTutorialVersion: string;
  
  // Preferences
  defaultPhotoCount: number;
  enableHaptics: boolean;
  enableAutoAdvance: boolean;
  
  // Actions
  setHasSeenTutorial: (seen: boolean) => void;
  setTutorialVersion: (version: string) => void;
  setDefaultPhotoCount: (count: number) => void;
  setEnableHaptics: (enabled: boolean) => void;
  setEnableAutoAdvance: (enabled: boolean) => void;
  resetPreferences: () => void;
}

const INITIAL_STATE = {
  hasSeenTutorial: false,
  lastTutorialVersion: '1.0.0',
  defaultPhotoCount: 100,
  enableHaptics: true,
  enableAutoAdvance: false,
};

export const useAppPreferences = create<AppPreferencesState>()(
  devtools(
    persist(
      (set) => ({
        ...INITIAL_STATE,

        setHasSeenTutorial: (seen: boolean) =>
          set({ hasSeenTutorial: seen }),

        setTutorialVersion: (version: string) =>
          set({ lastTutorialVersion: version }),

        setDefaultPhotoCount: (count: number) =>
          set({ defaultPhotoCount: count }),

        setEnableHaptics: (enabled: boolean) =>
          set({ enableHaptics: enabled }),

        setEnableAutoAdvance: (enabled: boolean) =>
          set({ enableAutoAdvance: enabled }),

        resetPreferences: () =>
          set(INITIAL_STATE),
      }),
      {
        name: 'app-preferences',
        storage: createJSONStorage(() => AsyncStorage),
      }
    ),
    { name: 'app-preferences' }
  )
);

