import * as MediaLibrary from "expo-media-library";
import { useCallback, useEffect, useRef, useState } from "react";

const PHOTO_COUNT = 100;

// Date range filter options
export type DateRangeFilter = 
  | "all"
  | "today"
  | "thisWeek"
  | "thisMonth"
  | "thisYear"
  | "older";

export interface PhotoAsset {
  id: string;
  uri: string;
  filename: string;
  width: number;
  height: number;
  creationTime: number;
}

export interface Album {
  id: string;
  title: string;
  assetCount: number;
  coverUri?: string;
}

export function useMediaLibrary() {
  const [photos, setPhotos] = useState<PhotoAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [permissionStatus, setPermissionStatus] = useState<
    "undetermined" | "granted" | "denied"
  >("undetermined");
  const photoCountRef = useRef(PHOTO_COUNT);

  // Album and filter state
  const [albums, setAlbums] = useState<Album[]>([]);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  const [selectedDateRange, setSelectedDateRange] = useState<DateRangeFilter>("all");

  // Fetch albums from device
  const fetchAlbums = useCallback(async () => {
    try {
      const result = await MediaLibrary.getAlbumsAsync();
      const mapped: Album[] = result.map((album: any) => ({
        id: album.id,
        title: album.title,
        assetCount: album.assetCount,
        coverUri: album.cover?.uri,
      }));
      setAlbums(mapped);
    } catch (error) {
      console.error("Failed to fetch albums:", error);
    }
  }, []);

  // Get date range timestamps
  const getDateRangeTimestamps = useCallback((range: DateRangeFilter): { start: number | null; end: number | null } => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    
    switch (range) {
      case "today":
        return { start: startOfToday, end: null };
      case "thisWeek":
        const startOfWeek = startOfToday - (6 * 24 * 60 * 60 * 1000); // 7 days ago
        return { start: startOfWeek, end: null };
      case "thisMonth":
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        return { start: startOfMonth, end: null };
      case "thisYear":
        const startOfYear = new Date(now.getFullYear(), 0, 1).getTime();
        return { start: startOfYear, end: null };
      case "older":
        const startOfLastYear = new Date(now.getFullYear() - 1, 0, 1).getTime();
        return { start: null, end: startOfLastYear };
      default:
        return { start: null, end: null };
    }
  }, []);

  const requestAndFetch = useCallback(async (deletedCount?: number) => {
    setLoading(true);
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      setPermissionStatus(status === "granted" ? "granted" : "denied");

      if (status !== "granted") {
        setLoading(false);
        return;
      }

      // Fetch albums
      await fetchAlbums();

      // Auto-load more photos if many were deleted (>100)
      if (deletedCount && deletedCount > 100) {
        photoCountRef.current = Math.max(photoCountRef.current, deletedCount + PHOTO_COUNT);
      } else if (!deletedCount) {
        // Reset to default count on fresh load
        photoCountRef.current = PHOTO_COUNT;
      }

      // Build query options
      const queryOptions: MediaLibrary.AssetsOptions = {
        first: photoCountRef.current,
        mediaType: MediaLibrary.MediaType.photo,
        sortBy: [MediaLibrary.SortBy.creationTime],
      };

      // Apply album filter if selected
      if (selectedAlbumId) {
        // Get assets from specific album
        const album = await MediaLibrary.getAlbumAsync(selectedAlbumId);
        if (album) {
          const result = await MediaLibrary.getAssetsAsync({
            ...queryOptions,
            album: album,
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
          setLoading(false);
          return;
        }
      }

      const result = await MediaLibrary.getAssetsAsync(queryOptions);

      let mapped: PhotoAsset[] = result.assets.map((asset) => ({
        id: asset.id,
        uri: asset.uri,
        filename: asset.filename,
        width: asset.width,
        height: asset.height,
        creationTime: asset.creationTime,
      }));

      // Apply date range filter
      if (selectedDateRange !== "all") {
        const { start, end } = getDateRangeTimestamps(selectedDateRange);
        
        if (start !== null && end !== null) {
          // "older" - before a specific date
          mapped = mapped.filter((photo) => photo.creationTime < end);
        } else if (start !== null) {
          // Recent date ranges
          mapped = mapped.filter((photo) => photo.creationTime >= start);
        }
      }

      setPhotos(mapped);
    } catch (error) {
      console.error("Failed to load photos:", error);
    } finally {
      setLoading(false);
    }
  }, [fetchAlbums, selectedAlbumId, selectedDateRange, getDateRangeTimestamps]);

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
    // Album and filter exports
    albums,
    selectedAlbumId,
    setSelectedAlbumId,
    selectedDateRange,
    setSelectedDateRange,
  };
}
