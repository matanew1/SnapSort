/**
 * AI Photo Analyzer Service
 * Free on-device AI analysis for photo quality, similarity, and smart suggestions
 * Uses image dimensions, file size, and basic heuristics for quality scoring
 */

import * as FileSystem from "expo-file-system";
import { Image as ExpoImage } from "expo-image";

export interface PhotoAsset {
  id: string;
  uri: string;
  filename: string;
  width: number;
  height: number;
  creationTime: number;
}

export interface PhotoAnalysis {
  photoId: string;
  qualityScore: number; // 0-100
  isBlurry: boolean;
  isDark: boolean;
  isOverexposed: boolean;
  aspectRatio: number;
  megapixels: number;
  isBurst: boolean;
  burstGroupId?: string;
  isSimilarToNext: boolean;
  suggestDelete: boolean;
  reason?: string;
}

export interface SimilarityGroup {
  groupId: string;
  photos: PhotoAsset[];
  bestPhotoId: string;
  similarity: number;
}

/**
 * Analyze a single photo for quality metrics
 * Uses file size, dimensions, and filename patterns
 */
export async function analyzePhotoQuality(
  photo: PhotoAsset,
  previousPhoto?: PhotoAsset
): Promise<PhotoAnalysis> {
  try {
    const fileInfo = await FileSystem.getInfoAsync(photo.uri);
    const fileSizeKB = ((fileInfo as any).size ?? 0) / 1024;
    const megapixels = (photo.width * photo.height) / 1000000;
    const aspectRatio = photo.width / photo.height;

    // Detect burst photos (same creation time or very close)
    const isBurst: boolean =
      (previousPhoto &&
      Math.abs(photo.creationTime - previousPhoto.creationTime) < 500) || false;

    // Quality scoring heuristics
    let qualityScore = 50;
    const reasons: string[] = [];

    // Megapixel scoring (higher is better, but diminishing returns)
    if (megapixels < 1) {
      qualityScore -= 20;
      reasons.push("Low resolution");
    } else if (megapixels > 12) {
      qualityScore += 15;
    } else if (megapixels > 8) {
      qualityScore += 10;
    }

    // File size heuristics (very small files often indicate compression or poor quality)
    if (fileSizeKB < 100) {
      qualityScore -= 15;
      reasons.push("Very small file size");
    } else if (fileSizeKB > 5000) {
      qualityScore += 5;
    }

    // Aspect ratio analysis (standard ratios are better)
    const standardRatios = [1, 1.33, 1.5, 1.77, 2]; // 1:1, 4:3, 3:2, 16:9, 2:1
    const isStandardRatio = standardRatios.some((r) => Math.abs(aspectRatio - r) < 0.1);
    if (isStandardRatio) {
      qualityScore += 5;
    }

    // Detect potential blurry photos (very small file size + low megapixels)
    const isBlurry = fileSizeKB < 150 && megapixels < 2;
    if (isBlurry) {
      qualityScore -= 25;
      reasons.push("Likely blurry");
    }

    // Detect dark photos (filename contains "dark" or very small file)
    const isDark: boolean =
      photo.filename.toLowerCase().includes("dark") ||
      (fileSizeKB < 80 && megapixels < 3) || false;
    if (isDark) {
      qualityScore -= 20;
      reasons.push("Likely dark or underexposed");
    }

    // Detect overexposed photos (filename contains "bright" or "over")
    const isOverexposed =
      photo.filename.toLowerCase().includes("bright") ||
      photo.filename.toLowerCase().includes("over");
    if (isOverexposed) {
      qualityScore -= 15;
      reasons.push("Likely overexposed");
    }

    // Burst detection bonus (keep first of burst)
    if (isBurst) {
      qualityScore -= 5;
      reasons.push("Part of burst sequence");
    }

    // Clamp score to 0-100
    qualityScore = Math.max(0, Math.min(100, qualityScore));

    // Determine if should suggest delete
    const suggestDelete =
      qualityScore < 35 || isBlurry || (isDark && qualityScore < 40);

    return {
      photoId: photo.id,
      qualityScore,
      isBlurry,
      isDark,
      isOverexposed,
      aspectRatio,
      megapixels,
      isBurst,
      burstGroupId: isBurst ? `burst_${previousPhoto?.creationTime}` : (undefined as any),
      isSimilarToNext: false, // Will be computed separately
      suggestDelete,
      reason: reasons.length > 0 ? reasons.join(", ") : undefined,
    };
  } catch (error) {
    console.error("Error analyzing photo:", error);
    return {
      photoId: photo.id,
      qualityScore: 50,
      isBlurry: false,
      isDark: false,
      isOverexposed: false,
      aspectRatio: photo.width / photo.height,
      megapixels: (photo.width * photo.height) / 1000000,
      isBurst: false,
      isSimilarToNext: false,
      suggestDelete: false,
    };
  }
}

/**
 * Detect similar photos (potential duplicates or burst sequences)
 * Uses filename, creation time, and dimensions
 */
export function detectSimilarPhotos(
  photos: PhotoAsset[],
  analyses: PhotoAnalysis[]
): SimilarityGroup[] {
  const groups: Map<string, PhotoAsset[]> = new Map();
  const groupBest: Map<string, string> = new Map();

  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i];
    const analysis = analyses[i];
    const nextPhoto = photos[i + 1];
    const nextAnalysis = analyses[i + 1];

    // Check for burst sequences (creation time within 1 second)
    if (
      nextPhoto &&
      Math.abs(photo.creationTime - nextPhoto.creationTime) < 1000
    ) {
      const burstId = `burst_${Math.floor(photo.creationTime / 1000)}`;
      if (!groups.has(burstId)) {
        groups.set(burstId, []);
      }
      groups.get(burstId)!.push(photo);

      // Mark as similar
      if (nextAnalysis) {
        nextAnalysis.isSimilarToNext = true;
      }

      // Keep the one with highest quality score
      const currentBest = groupBest.get(burstId);
      if (!currentBest || analysis.qualityScore > (analyses.find((a) => a.photoId === currentBest)?.qualityScore ?? 0)) {
        groupBest.set(burstId, photo.id);
      }
    }

    // Check for filename-based duplicates (same base name)
    const baseName = photo.filename.split(".")[0].replace(/[-_]\d+$/, "");
    if (baseName.length > 5) {
      const dupId = `dup_${baseName}`;
      if (!groups.has(dupId)) {
        groups.set(dupId, []);
      }
      const group = groups.get(dupId)!;
      if (!group.find((p) => p.id === photo.id)) {
        group.push(photo);
      }

      // Keep the one with highest quality
      const currentBest = groupBest.get(dupId);
      if (!currentBest || analysis.qualityScore > (analyses.find((a) => a.photoId === currentBest)?.qualityScore ?? 0)) {
        groupBest.set(dupId, photo.id);
      }
    }
  }

  // Convert to SimilarityGroup array
  return Array.from(groups.entries())
    .filter(([_, photos]) => photos.length > 1)
    .map(([groupId, groupPhotos]) => ({
      groupId,
      photos: groupPhotos,
      bestPhotoId: groupBest.get(groupId) || groupPhotos[0].id,
      similarity: Math.min(100, 70 + groupPhotos.length * 5), // Heuristic similarity score
    }));
}

/**
 * Generate smart cleanup suggestions
 */
export function generateCleanupSuggestions(
  analyses: PhotoAnalysis[]
): { suggestion: string; photoIds: string[]; priority: "high" | "medium" | "low" }[] {
  const suggestions: { suggestion: string; photoIds: string[]; priority: "high" | "medium" | "low" }[] = [];

  // Suggestion 1: Delete blurry photos
  const blurryPhotos = analyses.filter((a) => a.isBlurry);
  if (blurryPhotos.length > 0) {
    suggestions.push({
      suggestion: `Delete ${blurryPhotos.length} blurry photo${blurryPhotos.length > 1 ? "s" : ""}`,
      photoIds: blurryPhotos.map((a) => a.photoId),
      priority: "high",
    });
  }

  // Suggestion 2: Delete dark photos
  const darkPhotos = analyses.filter((a) => a.isDark && !a.isBlurry);
  if (darkPhotos.length > 0) {
    suggestions.push({
      suggestion: `Delete ${darkPhotos.length} dark or underexposed photo${darkPhotos.length > 1 ? "s" : ""}`,
      photoIds: darkPhotos.map((a) => a.photoId),
      priority: "high",
    });
  }

  // Suggestion 3: Delete low-quality photos
  const lowQuality = analyses.filter(
    (a) => a.qualityScore < 30 && !a.isBlurry && !a.isDark
  );
  if (lowQuality.length > 0) {
    suggestions.push({
      suggestion: `Delete ${lowQuality.length} low-quality photo${lowQuality.length > 1 ? "s" : ""}`,
      photoIds: lowQuality.map((a) => a.photoId),
      priority: "medium",
    });
  }

  // Suggestion 4: Delete overexposed photos
  const overexposed = analyses.filter((a) => a.isOverexposed);
  if (overexposed.length > 0) {
    suggestions.push({
      suggestion: `Delete ${overexposed.length} overexposed photo${overexposed.length > 1 ? "s" : ""}`,
      photoIds: overexposed.map((a) => a.photoId),
      priority: "medium",
    });
  }

  return suggestions;
}

/**
 * Batch analyze multiple photos
 */
export async function batchAnalyzePhotos(
  photos: PhotoAsset[]
): Promise<PhotoAnalysis[]> {
  const analyses: PhotoAnalysis[] = [];

  for (let i = 0; i < photos.length; i++) {
    const analysis = await analyzePhotoQuality(photos[i], photos[i - 1]);
    analyses.push(analysis);
  }

  return analyses;
}
