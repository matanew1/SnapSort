import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  analyzePhotoQuality,
  batchAnalyzePhotos,
  detectSimilarPhotos,
  generateCleanupSuggestions,
  PhotoAnalysis,
  SimilarityGroup,
  type PhotoAsset,
} from "@/services/aiPhotoAnalyzer";

const CACHE_KEY = "snapsort_ai_analysis_cache";
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

interface CachedAnalysis {
  photoId: string;
  analysis: PhotoAnalysis;
  timestamp: number;
}

export interface AIAnalysisResult {
  analyses: PhotoAnalysis[];
  similarityGroups: SimilarityGroup[];
  suggestions: { suggestion: string; photoIds: string[]; priority: "high" | "medium" | "low" }[];
  loading: boolean;
  error?: string;
}

export function useAIAnalysis(photos: PhotoAsset[]) {
  const [result, setResult] = useState<AIAnalysisResult>({
    analyses: [],
    similarityGroups: [],
    suggestions: [],
    loading: false,
  });

  const cacheRef = useRef<Map<string, CachedAnalysis>>(new Map());
  const analysisInProgressRef = useRef(false);

  // Load cache from storage
  const loadCache = useCallback(async () => {
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as CachedAnalysis[];
        const now = Date.now();
        parsed.forEach((item) => {
          if (now - item.timestamp < CACHE_EXPIRY) {
            cacheRef.current.set(item.photoId, item);
          }
        });
      }
    } catch (error) {
      console.error("Failed to load analysis cache:", error);
    }
  }, []);

  // Save cache to storage
  const saveCache = useCallback(async () => {
    try {
      const cacheArray = Array.from(cacheRef.current.values());
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cacheArray));
    } catch (error) {
      console.error("Failed to save analysis cache:", error);
    }
  }, []);

  // Analyze photos
  const analyzePhotos = useCallback(async () => {
    if (photos.length === 0 || analysisInProgressRef.current) return;

    analysisInProgressRef.current = true;
    setResult((prev) => ({ ...prev, loading: true, error: undefined }));

    try {
      // Load cache first
      await loadCache();

      const analyses: PhotoAnalysis[] = [];

      // Analyze each photo, using cache if available
      for (const photo of photos) {
        const cached = cacheRef.current.get(photo.id);
        if (cached) {
          analyses.push(cached.analysis);
        } else {
          const analysis = await analyzePhotoQuality(photo, photos[photos.indexOf(photo) - 1]);
          analyses.push(analysis);
          cacheRef.current.set(photo.id, {
            photoId: photo.id,
            analysis,
            timestamp: Date.now(),
          });
        }
      }

      // Detect similar photos
      const similarityGroups = detectSimilarPhotos(photos, analyses);

      // Generate suggestions
      const suggestions = generateCleanupSuggestions(analyses);

      setResult({
        analyses,
        similarityGroups,
        suggestions,
        loading: false,
      });

      // Save updated cache
      await saveCache();
    } catch (error) {
      console.error("Failed to analyze photos:", error);
      setResult((prev) => ({
        ...prev,
        loading: false,
        error: "Failed to analyze photos",
      }));
    } finally {
      analysisInProgressRef.current = false;
    }
  }, [photos, loadCache, saveCache]);

  // Trigger analysis when photos change
  useEffect(() => {
    analyzePhotos();
  }, [photos.length]); // Only trigger on length change to avoid excessive re-analysis

  // Clear cache
  const clearCache = useCallback(async () => {
    cacheRef.current.clear();
    await AsyncStorage.removeItem(CACHE_KEY);
  }, []);

  return {
    ...result,
    analyzePhotos,
    clearCache,
  };
}
