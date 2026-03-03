import * as MediaLibrary from "expo-media-library";
import { useCallback, useEffect, useRef, useState } from "react";

const PHOTO_COUNT = 100;

export interface PhotoAsset {
  id: string;
  uri: string;
  filename: string;
  width: number;
  height: number;
  creationTime: number;
}

export function useMediaLibrary() {
  const [photos, setPhotos] = useState<PhotoAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [permissionStatus, setPermissionStatus] = useState<
    "undetermined" | "granted" | "denied"
  >("undetermined");
  const photoCountRef = useRef(PHOTO_COUNT);

  const requestAndFetch = useCallback(async (deletedCount?: number) => {
    setLoading(true);
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      setPermissionStatus(status === "granted" ? "granted" : "denied");

      if (status !== "granted") {
        setLoading(false);
        return;
      }

      // Auto-load more photos if many were deleted (>100)
      if (deletedCount && deletedCount > 100) {
        photoCountRef.current = Math.max(photoCountRef.current, deletedCount + PHOTO_COUNT);
      } else if (!deletedCount) {
        // Reset to default count on fresh load
        photoCountRef.current = PHOTO_COUNT;
      }

      const result = await MediaLibrary.getAssetsAsync({
        first: photoCountRef.current,
        mediaType: MediaLibrary.MediaType.photo,
        sortBy: [MediaLibrary.SortBy.creationTime],
      });

      const mapped: PhotoAsset[] = result.assets.map((asset) => ({
        id: asset.id,
        uri: asset.uri,
        filename: asset.filename,
        width: asset.width,
        height: asset.height,
        creationTime: asset.creationTime,
      }));

      setPhotos(mapped);
    } catch (error) {
      console.error("Failed to load photos:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    requestAndFetch();
  }, [requestAndFetch]);

  const deleteAssets = useCallback(async (assetIds: string[]) => {
    if (assetIds.length === 0) return false;
    try {
      const result = await MediaLibrary.deleteAssetsAsync(assetIds);
      return result;
    } catch (error) {
      console.error("Failed to delete assets:", error);
      return false;
    }
  }, []);

  return {
    photos,
    loading,
    permissionDenied: permissionStatus === "denied",
    permissionUndetermined: permissionStatus === "undetermined",
    deleteAssets,
    refetch: requestAndFetch,
  };
}
