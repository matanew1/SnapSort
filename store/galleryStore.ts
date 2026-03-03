import { create } from "zustand";
import { devtools, subscribeWithSelector } from "zustand/middleware";

export interface PhotoAsset {
  id: string;
  uri: string;
  filename: string;
  width: number;
  height: number;
  creationTime: number;
}

interface GalleryState {
  photos: PhotoAsset[];
  loading: boolean;
  permissionStatus: "undetermined" | "granted" | "denied";
  totalPhotos: number;
  photoCountLimit: number;

  // Actions
  setPhotos: (photos: PhotoAsset[]) => void;
  addPhotos: (photos: PhotoAsset[]) => void;
  removePhotos: (ids: string[]) => void;
  setLoading: (loading: boolean) => void;
  setPermissionStatus: (
    status: "undetermined" | "granted" | "denied"
  ) => void;
  setTotalPhotos: (count: number) => void;
  setPhotoCountLimit: (count: number) => void;
  resetGallery: () => void;
  getPhotoById: (id: string) => PhotoAsset | undefined;
  getPhotosByIds: (ids: string[]) => PhotoAsset[];
}

export const useGalleryStore = create<GalleryState>()(
  devtools(
    subscribeWithSelector((set: any, get: any) => ({
      photos: [] as PhotoAsset[],
      loading: true as boolean,
      permissionStatus: "undetermined" as "undetermined" | "granted" | "denied",
      totalPhotos: 0,
      photoCountLimit: 100,

      setPhotos: (photos: PhotoAsset[]) => set({ photos }),

      addPhotos: (photos: PhotoAsset[]) =>
        set((state: any) => {
          const ids = new Set(state.photos.map((p: PhotoAsset) => p.id));
          const newPhotos = photos.filter((p: PhotoAsset) => !ids.has(p.id));
          return { photos: [...state.photos, ...newPhotos] };
        }),

      removePhotos: (ids: string[]) =>
        set((state: any) => {
          const idSet = new Set(ids);
          return { photos: state.photos.filter((p: PhotoAsset) => !idSet.has(p.id)) };
        }),

      setLoading: (loading: boolean) => set({ loading }),

      setPermissionStatus: (status: "undetermined" | "granted" | "denied") => set({ permissionStatus: status }),

      setTotalPhotos: (count: number) => set({ totalPhotos: count }),

      setPhotoCountLimit: (count: number) => set({ photoCountLimit: count }),

      resetGallery: () =>
        set({
          photos: [],
          loading: true,
          permissionStatus: "undetermined",
          totalPhotos: 0,
          photoCountLimit: 100,
        }),

      getPhotoById: (id: string) => {
        const state = get();
        return state.photos.find((p: PhotoAsset) => p.id === id);
      },

      getPhotosByIds: (ids: string[]) => {
        const state = get();
        const idSet = new Set(ids);
        return state.photos.filter((p: PhotoAsset) => idSet.has(p.id));
      },
    })),
    { name: "gallery-store" }
  )
);
