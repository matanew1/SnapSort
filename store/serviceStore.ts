import * as MediaLibrary from "expo-media-library";
import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface DeleteOperation {
  id: string;
  count: number;
  timestamp: number;
  success: boolean;
}

interface ServiceState {
  isDeleting: boolean;
  isFetching: boolean;
  error: string | null;
  deleteHistory: DeleteOperation[];

  // Actions
  setIsDeleting: (deleting: boolean) => void;
  setIsFetching: (fetching: boolean) => void;
  setError: (error: string | null) => void;
  addDeleteOperation: (operation: DeleteOperation) => void;
  clearError: () => void;
  clearDeleteHistory: () => void;

  // Service Operations
  deletePhotos: (assetIds: string[]) => Promise<boolean>;
}

export const useServiceStore = create<ServiceState>()(
  devtools(
    (set: any, get: any) => ({
      isDeleting: false as boolean,
      isFetching: false as boolean,
      error: null as string | null,
      deleteHistory: [] as DeleteOperation[],

      setIsDeleting: (deleting: boolean) => set({ isDeleting: deleting }),

      setIsFetching: (fetching: boolean) => set({ isFetching: fetching }),

      setError: (error: string | null) => set({ error }),

      addDeleteOperation: (operation: DeleteOperation) =>
        set((state: any) => ({
          deleteHistory: [...state.deleteHistory, operation],
        })),

      clearError: () => set({ error: null }),

      clearDeleteHistory: () => set({ deleteHistory: [] }),

      deletePhotos: async (assetIds: string[]) => {
        if (assetIds.length === 0) {
          set({ error: "No photos to delete" });
          return false;
        }

        set({ isDeleting: true, error: null });

        try {
          const operationId = `delete_${Date.now()}`;
          const result = await MediaLibrary.deleteAssetsAsync(assetIds);

          const operation: DeleteOperation = {
            id: operationId,
            count: assetIds.length,
            timestamp: Date.now(),
            success: !!result,
          };

          get().addDeleteOperation(operation);
          set({ isDeleting: false });

          return !!result;
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Failed to delete photos";
          set({
            error: errorMessage,
            isDeleting: false,
          });
          return false;
        }
      },
    }),
    { name: "service-store" }
  )
);
