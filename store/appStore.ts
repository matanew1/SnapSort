import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";

interface DeleteEntry {
  index: number;
  action: "keep" | "delete";
  timestamp: number;
}

interface AppState {
  // Sorting state
  currentPhotoIndex: number;
  selectedPhotosForDelete: string[];
  sortingHistory: DeleteEntry[];

  // UI state
  isReviewingPhotos: boolean;
  isSortingComplete: boolean;
  isDarkMode: boolean;

  // Statistics
  totalPhotosSorted: number;
  totalPhotosMarkedForDelete: number;
  totalPhotosDeleted: number;

  // Actions
  setCurrentPhotoIndex: (index: number) => void;
  addPhotoToDelete: (photoId: string) => void;
  removePhotoFromDelete: (photoId: string) => void;
  clearPhotosToDelete: () => void;
  addToHistory: (entry: DeleteEntry) => void;
  undoLastAction: () => DeleteEntry | null;
  undoAllActions: () => DeleteEntry[];
  getLastNactions: (count: number) => DeleteEntry[];
  clearHistory: () => void;
  setIsReviewingPhotos: (reviewing: boolean) => void;
  setIsSortingComplete: (complete: boolean) => void;
  toggleDarkMode: () => void;
  incrementPhotosSorted: (count: number) => void;
  incrementPhotosDeleted: (count: number) => void;
  resetAppState: () => void;
  getStats: () => {
    sorted: number;
    markedForDelete: number;
    deleted: number;
  };
}

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set: any, get: any) => ({
        currentPhotoIndex: 0,
        selectedPhotosForDelete: [] as string[],
        sortingHistory: [] as DeleteEntry[],
        isReviewingPhotos: false as boolean,
        isSortingComplete: false as boolean,
        isDarkMode: true as boolean,
        totalPhotosSorted: 0,
        totalPhotosMarkedForDelete: 0,
        totalPhotosDeleted: 0,

        setCurrentPhotoIndex: (index: number) =>
          set({ currentPhotoIndex: index }),

        addPhotoToDelete: (photoId: string) =>
          set((state: any) => {
            if (state.selectedPhotosForDelete.includes(photoId)) {
              return state;
            }
            return {
              selectedPhotosForDelete: [
                ...state.selectedPhotosForDelete,
                photoId,
              ],
              totalPhotosMarkedForDelete:
                state.totalPhotosMarkedForDelete + 1,
            };
          }),

        removePhotoFromDelete: (photoId: string) =>
          set((state: any) => ({
            selectedPhotosForDelete: state.selectedPhotosForDelete.filter(
              (id: string) => id !== photoId
            ),
            totalPhotosMarkedForDelete:
              state.totalPhotosMarkedForDelete > 0
                ? state.totalPhotosMarkedForDelete - 1
                : 0,
          })),

        clearPhotosToDelete: () =>
          set({
            selectedPhotosForDelete: [],
            totalPhotosMarkedForDelete: 0,
          }),

        addToHistory: (entry: DeleteEntry) =>
          set((state: any) => ({
            sortingHistory: [...state.sortingHistory, entry],
          })),

        undoLastAction: () => {
          const state = get();
          if (state.sortingHistory.length === 0) return null;

          const lastEntry = state.sortingHistory[
            state.sortingHistory.length - 1
          ];
          set((state: any) => ({
            sortingHistory: state.sortingHistory.slice(0, -1),
            currentPhotoIndex: lastEntry.index,
          }));

          return lastEntry;
        },

        undoAllActions: () => {
          const state = get();
          if (state.sortingHistory.length === 0) return [];

          // Get all entries to restore
          const allEntries = [...state.sortingHistory];
          
          // Clear history and reset to beginning
          set({
            sortingHistory: [],
            currentPhotoIndex: 0,
            // Remove all photos from delete list
            selectedPhotosForDelete: [],
            totalPhotosMarkedForDelete: 0,
          });

          return allEntries;
        },

        getLastNactions: (count: number) => {
          const state = get();
          return state.sortingHistory.slice(-count);
        },

        clearHistory: () =>
          set({
            sortingHistory: [],
            currentPhotoIndex: 0,
          }),

        setIsReviewingPhotos: (reviewing: boolean) =>
          set({ isReviewingPhotos: reviewing }),

        setIsSortingComplete: (complete: boolean) =>
          set({ isSortingComplete: complete }),

        toggleDarkMode: () =>
          set((state: any) => ({ isDarkMode: !state.isDarkMode })),

        incrementPhotosSorted: (count: number) =>
          set((state: any) => ({
            totalPhotosSorted: state.totalPhotosSorted + count,
          })),

        incrementPhotosDeleted: (count: number) =>
          set((state: any) => ({
            totalPhotosDeleted: state.totalPhotosDeleted + count,
          })),

        resetAppState: () =>
          set({
            currentPhotoIndex: 0,
            selectedPhotosForDelete: [],
            sortingHistory: [],
            isReviewingPhotos: false,
            isSortingComplete: false,
          }),

        getStats: () => {
          const state = get();
          return {
            sorted: state.totalPhotosSorted,
            markedForDelete: state.totalPhotosMarkedForDelete,
            deleted: state.totalPhotosDeleted,
          };
        },
      }),
      {
        name: "app-store",
        storage: createJSONStorage(() => AsyncStorage),
      }
    ),
    { name: "app-store" }
  )
);

