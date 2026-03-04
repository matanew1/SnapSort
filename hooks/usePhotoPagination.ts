import * as MediaLibrary from 'expo-media-library';
import { useCallback, useRef, useState } from 'react';
import { Album, DateRangeFilter, PhotoAsset } from './useMediaLibrary';

const PAGE_SIZE = 50;
const MAX_PHOTOS = 500;

interface UsePhotoPaginationOptions {
  selectedAlbumId: string | null;
  selectedDateRange: DateRangeFilter;
}

export function usePhotoPagination({ selectedAlbumId, selectedDateRange }: UsePhotoPaginationOptions) {
  const [photos, setPhotos] = useState<PhotoAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<'undetermined' | 'granted' | 'denied'>('undetermined');
  const [albums, setAlbums] = useState<Album[]>([]);

  const pageRef = useRef(0);
  const totalCountRef = useRef(0);
  const firstCursorRef = useRef<string | null>(null);

  // Get date range timestamps
  const getDateRangeTimestamps = useCallback((range: DateRangeFilter): { start: number | null; end: number | null } => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    
    switch (range) {
      case 'today':
        return { start: startOfToday, end: null };
      case 'thisWeek':
        const startOfWeek = startOfToday - (6 * 24 * 60 * 60 * 1000);
        return { start: startOfWeek, end: null };
      case 'thisMonth':
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        return { start: startOfMonth, end: null };
      case 'thisYear':
        const startOfYear = new Date(now.getFullYear(), 0, 1).getTime();
        return { start: startOfYear, end: null };
      case 'older':
        const startOfLastYear = new Date(now.getFullYear() - 1, 0, 1).getTime();
        return { start: null, end: startOfLastYear };
      default:
        return { start: null, end: null };
    }
  }, []);

  // Fetch albums
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
    } catch (err) {
      console.error('Failed to fetch albums:', err);
    }
  }, []);

  // Map assets to PhotoAsset
  const mapAssets = useCallback((assets: MediaLibrary.Asset[]): PhotoAsset[] => {
    return assets.map((asset) => ({
      id: asset.id,
      uri: asset.uri,
      filename: asset.filename,
      width: asset.width,
      height: asset.height,
      creationTime: asset.creationTime,
    }));
  }, []);

  // Apply date range filter
  const applyDateFilter = useCallback((photosToFilter: PhotoAsset[]): PhotoAsset[] => {
    if (selectedDateRange === 'all') {
      return photosToFilter;
    }
    
    const { start, end } = getDateRangeTimestamps(selectedDateRange);
    
    if (start !== null && end !== null) {
      // "older" - before a specific date
      return photosToFilter.filter((photo) => photo.creationTime < end);
    } else if (start !== null) {
      // Recent date ranges
      return photosToFilter.filter((photo) => photo.creationTime >= start);
    }
    
    return photosToFilter;
  }, [selectedDateRange, getDateRangeTimestamps]);

  // Initial load
  const loadPhotos = useCallback(async (deletedCount?: number) => {
    setLoading(true);
    setError(null);
    pageRef.current = 0;
    firstCursorRef.current = null;
    setHasMore(true);

    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      setPermissionStatus(status === 'granted' ? 'granted' : 'denied');

      if (status !== 'granted') {
        setLoading(false);
        return;
      }

      await fetchAlbums();

      // Adjust page size based on deleted count
      const initialCount = deletedCount && deletedCount > 100 
        ? Math.min(deletedCount + PAGE_SIZE, MAX_PHOTOS) 
        : PAGE_SIZE;

      const queryOptions: MediaLibrary.AssetsOptions = {
        first: initialCount,
        mediaType: MediaLibrary.MediaType.photo,
        sortBy: [MediaLibrary.SortBy.creationTime],
      };

      let result;
      if (selectedAlbumId) {
        const album = await MediaLibrary.getAlbumAsync(selectedAlbumId);
        if (album) {
          result = await MediaLibrary.getAssetsAsync({
            ...queryOptions,
            album,
          });
        }
      } else {
        result = await MediaLibrary.getAssetsAsync(queryOptions);
      }

      if (!result) {
        setError('Failed to load photos');
        setLoading(false);
        return;
      }

      // Store the next page cursor
      firstCursorRef.current = result.hasNextPage ? (result as any).endCursor || null : null;
      
      const mapped = mapAssets(result.assets);
      const filtered = applyDateFilter(mapped);

      totalCountRef.current = result.totalCount;
      setPhotos(filtered);
      setHasMore(filtered.length < result.totalCount && filtered.length < MAX_PHOTOS);
    } catch (err) {
      setError('Failed to load photos');
      console.error('Load photos error:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedAlbumId, fetchAlbums, mapAssets, applyDateFilter]);

  // Load more photos
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    if (!firstCursorRef.current) return;

    setLoadingMore(true);

    try {
      const queryOptions: MediaLibrary.AssetsOptions = {
        first: PAGE_SIZE,
        after: firstCursorRef.current,
        mediaType: MediaLibrary.MediaType.photo,
        sortBy: [MediaLibrary.SortBy.creationTime],
      };

      let result;
      if (selectedAlbumId) {
        const album = await MediaLibrary.getAlbumAsync(selectedAlbumId);
        if (album) {
          result = await MediaLibrary.getAssetsAsync({
            ...queryOptions,
            album,
          });
        }
      } else {
        result = await MediaLibrary.getAssetsAsync(queryOptions);
      }

      if (!result) {
        setLoadingMore(false);
        return;
      }

      // Update cursor for next load
      firstCursorRef.current = result.hasNextPage ? (result as any).endCursor || null : null;

      const newPhotos = mapAssets(result.assets);
      const filtered = applyDateFilter(newPhotos);

      setPhotos((prev) => [...prev, ...filtered]);

      const totalLoaded = photos.length + filtered.length;
      setHasMore(totalLoaded < MAX_PHOTOS && result.hasNextPage && totalLoaded < result.totalCount);
    } catch (err) {
      console.error('Load more error:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, selectedAlbumId, photos.length, mapAssets, applyDateFilter]);

  // Clear all photos
  const clearPhotos = useCallback(() => {
    setPhotos([]);
    pageRef.current = 0;
    firstCursorRef.current = null;
    setHasMore(true);
  }, []);

  // Check if more can be loaded
  const canLoadMore = useCallback(() => {
    return hasMore && !loadingMore;
  }, [hasMore, loadingMore]);

  // Refresh - reload from beginning
  const refresh = useCallback(async () => {
    await loadPhotos();
  }, [loadPhotos]);

  return {
    photos,
    loading,
    loadingMore,
    hasMore,
    error,
    permissionDenied: permissionStatus === 'denied',
    permissionUndetermined: permissionStatus === 'undetermined',
    albums,
    loadPhotos,
    loadMore,
    clearPhotos,
    canLoadMore,
    refresh,
  };
}

