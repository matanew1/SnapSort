import { ScreenBackground } from "@/components";
import { LoadingState } from "@/components/features";
import { scale, scaleFont, verticalScale } from "@/constants/responsive";
import { BorderRadius, getColors, Spacing } from "@/constants/theme";
import { useAIAnalysis } from "@/hooks/useAIAnalysis";
import { useMediaLibrary } from "@/hooks/useMediaLibrary";
import { useAppStore } from "@/store";
import type { PhotoAnalysis } from "@/services/aiPhotoAnalyzer";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  Trash2,
  Wand2,
  ZapOff,
} from "lucide-react-native";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Animated,
  Easing,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ─── types ────────────────────────────────────────────────────────────────────

interface PackPhoto {
  id: string;
  uri: string;
  fileSizeKB: number;
}

interface CleanupPack {
  id: string;
  label: string;
  description: string;
  emoji: string;
  gradientStart: string;
  gradientEnd: string;
  iconColor: string;
  photos: PackPhoto[];
  totalSizeKB: number;
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function fmtStorage(kb: number): string {
  if (kb < 1024) return `${Math.round(kb)} KB`;
  if (kb < 1024 * 1024) return `${(kb / 1024).toFixed(1)} MB`;
  return `${(kb / (1024 * 1024)).toFixed(2)} GB`;
}

function buildPacks(
  photos: { id: string; uri: string; filename: string }[],
  analyses: PhotoAnalysis[],
): CleanupPack[] {
  const usedIds = new Set<string>();

  const make = (
    id: string,
    label: string,
    description: string,
    emoji: string,
    gradientStart: string,
    gradientEnd: string,
    iconColor: string,
    predicate: (
      p: { id: string; uri: string; filename: string },
      a: PhotoAnalysis,
    ) => boolean,
  ): CleanupPack => {
    const matched: PackPhoto[] = [];
    photos.forEach((photo, i) => {
      const analysis = analyses[i];
      if (!analysis) return;
      if (!usedIds.has(photo.id) && predicate(photo, analysis)) {
        usedIds.add(photo.id);
        matched.push({
          id: photo.id,
          uri: photo.uri,
          fileSizeKB: analysis.fileSizeKB,
        });
      }
    });
    return {
      id,
      label,
      description,
      emoji,
      gradientStart,
      gradientEnd,
      iconColor,
      photos: matched,
      totalSizeKB: matched.reduce((s, p) => s + p.fileSizeKB, 0),
    };
  };

  const packs: CleanupPack[] = [
    make(
      "screenshots",
      "Screenshots",
      "System screenshots taking up space",
      "📱",
      "#374151",
      "#1F2937",
      "#9CA3AF",
      (p) =>
        p.filename.toLowerCase().includes("screenshot") ||
        p.filename.toLowerCase().includes("screen_shot") ||
        p.filename.toLowerCase().includes("screen-shot"),
    ),
    make(
      "blurry",
      "Blurry Shots",
      "Out-of-focus or motion-blurred photos",
      "🌫️",
      "#7C3AED",
      "#4C1D95",
      "#A78BFA",
      (_, a) => a.isBlurry,
    ),
    make(
      "dark",
      "Dark Photos",
      "Underexposed or too-dark shots",
      "🌑",
      "#1E3A5F",
      "#0F2235",
      "#60A5FA",
      (_, a) => a.isDark && !a.isBlurry,
    ),
    make(
      "burst",
      "Burst Duplicates",
      "Near-identical burst sequence copies",
      "⚡",
      "#92400E",
      "#451A03",
      "#FCD34D",
      (_, a) => a.isBurst,
    ),
    make(
      "lowQuality",
      "Low Quality",
      "Photos scoring below 35% AI quality",
      "📉",
      "#7F1D1D",
      "#450A0A",
      "#FCA5A5",
      (_, a) => a.qualityScore < 35 && !a.isBlurry && !a.isDark,
    ),
  ];

  return packs.filter((p) => p.photos.length > 0);
}

// ─── PhotoFan ─────────────────────────────────────────────────────────────────

interface PhotoFanProps {
  uris: string[];
  selected: boolean;
  selectionAnim: Animated.Value;
}

const FAN_CONFIGS = [
  { rotate: "-13deg", tx: -22, ty: 4, zIndex: 1 },
  { rotate: "-5deg", tx: -9, ty: 1, zIndex: 2 },
  { rotate: "3deg", tx: 0, ty: 0, zIndex: 3 },
];

function PhotoFan({ uris, selected, selectionAnim }: PhotoFanProps) {
  const shown = uris.slice(0, 3);
  const padded = [...shown];
  while (padded.length < 3) padded.unshift("");

  const glow = selectionAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <View style={fanStyles.root}>
      {padded.map((uri, i) => {
        const cfg = FAN_CONFIGS[i];
        return (
          <Animated.View
            key={i}
            style={[
              fanStyles.photo,
              {
                zIndex: cfg.zIndex,
                transform: [
                  { rotate: cfg.rotate },
                  { translateX: cfg.tx },
                  { translateY: cfg.ty },
                ],
              },
            ]}
          >
            {uri ? (
              <Image
                source={{ uri }}
                style={fanStyles.img}
                contentFit="cover"
                transition={200}
              />
            ) : (
              <View style={[fanStyles.img, fanStyles.placeholder]} />
            )}
          </Animated.View>
        );
      })}
      {/* selection glow ring */}
      <Animated.View
        style={[
          fanStyles.glow,
          {
            opacity: glow,
            shadowOpacity: glow,
          },
        ]}
      />
    </View>
  );
}

const fanStyles = StyleSheet.create({
  root: {
    width: 110,
    height: 88,
    position: "relative",
    alignItems: "flex-end",
    justifyContent: "center",
  },
  photo: {
    position: "absolute",
    width: 70,
    height: 84,
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.15)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
    right: 0,
  },
  img: { width: "100%", height: "100%" },
  placeholder: { backgroundColor: "rgba(255,255,255,0.07)" },
  glow: {
    position: "absolute",
    right: -3,
    top: -3,
    width: 76,
    height: 90,
    borderRadius: 13,
    borderWidth: 2.5,
    borderColor: "#A78BFA",
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 14,
    elevation: 0,
  },
});

// ─── PackCard ─────────────────────────────────────────────────────────────────

interface PackCardProps {
  pack: CleanupPack;
  selected: boolean;
  onToggle: () => void;
  entryDelay: number;
  isDark: boolean;
}

function PackCard({ pack, selected, onToggle, entryDelay, isDark }: PackCardProps) {
  const Colors = getColors(isDark);

  const entryAnim = useRef(new Animated.Value(0)).current;
  const selectionAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(entryDelay),
      Animated.parallel([
        Animated.spring(entryAnim, {
          toValue: 1,
          tension: 68,
          friction: 10,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [entryDelay]);

  useEffect(() => {
    Animated.spring(selectionAnim, {
      toValue: selected ? 1 : 0,
      tension: 90,
      friction: 7,
      useNativeDriver: false,
    }).start();
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.96,
        duration: 90,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start();
  }, [selected]);

  const borderColor = selectionAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [
      isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)",
      "#8B5CF6",
    ],
  });

  const bgOpacity = selectionAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.12],
  });

  return (
    <Animated.View
      style={{
        opacity: entryAnim,
        transform: [
          {
            translateY: entryAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [32, 0],
            }),
          },
          { scale: scaleAnim },
        ],
        marginBottom: Spacing.md,
      }}
    >
      <TouchableOpacity
        onPress={onToggle}
        activeOpacity={0.88}
        style={[cardStyles.root]}
      >
        {/* Animated border */}
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            cardStyles.border,
            { borderColor },
          ]}
        />

        {/* Selection tint */}
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { borderRadius: BorderRadius.xl, backgroundColor: "#8B5CF6", opacity: bgOpacity },
          ]}
        />

        {/* Gradient header strip */}
        <LinearGradient
          colors={[pack.gradientStart, pack.gradientEnd]}
          start={[0, 0]}
          end={[1, 1]}
          style={cardStyles.gradientStrip}
        />

        {/* Content row */}
        <View style={cardStyles.row}>
          {/* Photo fan */}
          <PhotoFan
            uris={pack.photos.slice(0, 3).map((p) => p.uri)}
            selected={selected}
            selectionAnim={selectionAnim}
          />

          {/* Text info */}
          <View style={cardStyles.info}>
            <View style={cardStyles.labelRow}>
              <Text style={cardStyles.emoji}>{pack.emoji}</Text>
              <Text
                style={[
                  cardStyles.label,
                  { color: Colors.text },
                ]}
              >
                {pack.label}
              </Text>
            </View>
            <Text
              style={[cardStyles.description, { color: Colors.textSecondary }]}
              numberOfLines={2}
            >
              {pack.description}
            </Text>

            {/* Count + size pills */}
            <View style={cardStyles.pillRow}>
              <View
                style={[
                  cardStyles.pill,
                  { backgroundColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)" },
                ]}
              >
                <Text style={[cardStyles.pillText, { color: Colors.textMuted }]}>
                  {pack.photos.length} photo{pack.photos.length !== 1 ? "s" : ""}
                </Text>
              </View>
              {pack.totalSizeKB > 0 && (
                <View
                  style={[
                    cardStyles.pill,
                    { backgroundColor: "rgba(239,68,68,0.12)" },
                  ]}
                >
                  <Trash2 size={9} color="#EF4444" />
                  <Text style={[cardStyles.pillText, { color: "#EF4444" }]}>
                    {fmtStorage(pack.totalSizeKB)}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Checkbox */}
          <View style={[cardStyles.check, selected && cardStyles.checkSelected]}>
            {selected ? (
              <CheckCircle2 size={22} color="#fff" />
            ) : (
              <View style={cardStyles.checkEmpty} />
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const cardStyles = StyleSheet.create({
  root: {
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
    backgroundColor: "transparent",
  },
  border: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
  },
  gradientStrip: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    width: 5,
    borderTopLeftRadius: BorderRadius.xl,
    borderBottomLeftRadius: BorderRadius.xl,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingLeft: Spacing.md + 8,
    gap: Spacing.md,
  },
  info: { flex: 1, gap: 5 },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  emoji: { fontSize: scaleFont(16) },
  label: {
    fontSize: scaleFont(15),
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  description: {
    fontSize: scaleFont(12),
    lineHeight: scaleFont(17),
  },
  pillRow: { flexDirection: "row", gap: 5, marginTop: 2 },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  pillText: { fontSize: scaleFont(10), fontWeight: "700" },
  check: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  checkSelected: {
    backgroundColor: "#8B5CF6",
    borderColor: "#8B5CF6",
  },
  checkEmpty: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.2)",
  },
});

// ─── Scanning animation ───────────────────────────────────────────────────────

function ScanningView({ isDark }: { isDark: boolean }) {
  const Colors = getColors(isDark);
  const shimmer = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 1400,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.12,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  const shimmerTranslate = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-8, 8],
  });

  return (
    <View style={scanStyles.root}>
      <Animated.View style={[scanStyles.orb, { transform: [{ scale: pulse }] }]}>
        <LinearGradient
          colors={["#8B5CF6", "#6C63FF", "#AE40FF"]}
          style={scanStyles.orbGradient}
        >
          <Wand2 size={scale(36)} color="#fff" />
        </LinearGradient>
      </Animated.View>
      <Animated.View
        style={[
          scanStyles.scanLine,
          { transform: [{ translateY: shimmerTranslate }] },
        ]}
      />
      <Text style={[scanStyles.title, { color: Colors.text }]}>
        Analysing your library…
      </Text>
      <Text style={[scanStyles.subtitle, { color: Colors.textSecondary }]}>
        Finding photos you can safely remove
      </Text>
    </View>
  );
}

const scanStyles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  orb: {
    width: scale(96),
    height: scale(96),
    borderRadius: scale(48),
    overflow: "hidden",
    marginBottom: Spacing.sm,
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 16,
  },
  orbGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scanLine: {
    position: "absolute",
    width: scale(120),
    height: 2,
    backgroundColor: "rgba(139,92,246,0.45)",
    borderRadius: 1,
  },
  title: {
    fontSize: scaleFont(22),
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: -0.4,
    marginTop: Spacing.md,
  },
  subtitle: {
    fontSize: scaleFont(14),
    textAlign: "center",
    lineHeight: scaleFont(21),
  },
});

// ─── Empty (clean library) state ──────────────────────────────────────────────

function CleanLibraryView({ isDark }: { isDark: boolean }) {
  const Colors = getColors(isDark);
  const pop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(pop, {
      toValue: 1,
      tension: 70,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: Spacing.xl,
        gap: Spacing.md,
        opacity: pop,
        transform: [{ scale: pop }],
      }}
    >
      <Text style={{ fontSize: scaleFont(64) }}>🦄</Text>
      <Text style={[scanStyles.title, { color: Colors.text }]}>
        Your library is pristine!
      </Text>
      <Text style={[scanStyles.subtitle, { color: Colors.textSecondary }]}>
        The AI couldn't find anything worth removing. Your photos are in great
        shape.
      </Text>
    </Animated.View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function BatchScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const isDark = useAppStore((s) => s.isDarkMode);
  const Colors = getColors(isDark);
  const { addPhotoToDelete } = useAppStore();

  const { photos, loading: photosLoading } = useMediaLibrary();
  const { analyses, loading: aiLoading } = useAIAnalysis(photos);

  const isLoading = photosLoading || aiLoading;

  // Build packs once data is ready
  const packs = useMemo<CleanupPack[]>(() => {
    if (photos.length === 0 || analyses.length === 0) return [];
    // analyses array aligns with photos array
    const photosWithFilename = photos.map((p) => ({
      id: p.id,
      uri: p.uri,
      filename: p.filename,
    }));
    return buildPacks(photosWithFilename, analyses);
  }, [photos, analyses]);

  // Selection state
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const togglePack = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // Aggregated counts
  const { totalPhotos, totalSizeKB } = useMemo(() => {
    let photos = 0;
    let sizeKB = 0;
    packs.forEach((pack) => {
      if (selected.has(pack.id)) {
        photos += pack.photos.length;
        sizeKB += pack.totalSizeKB;
      }
    });
    return { totalPhotos: photos, totalSizeKB: sizeKB };
  }, [selected, packs]);

  // Bottom bar entrance anim
  const bottomAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(bottomAnim, {
      toValue: totalPhotos > 0 ? 1 : 0,
      tension: 70,
      friction: 10,
      useNativeDriver: true,
    }).start();
  }, [totalPhotos > 0]);

  // "Select all" convenience
  const allSelected = packs.length > 0 && packs.every((p) => selected.has(p.id));
  const handleSelectAll = useCallback(() => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(packs.map((p) => p.id)));
    }
  }, [allSelected, packs]);

  // Apply selections → mark for delete → navigate to review
  const handleCleanup = useCallback(() => {
    const photosToMark: PackPhoto[] = [];
    packs.forEach((pack) => {
      if (selected.has(pack.id)) {
        pack.photos.forEach((p) => photosToMark.push(p));
      }
    });

    // De-duplicate by id
    const uniqueIds = new Set<string>();
    const unique = photosToMark.filter((p) => {
      if (uniqueIds.has(p.id)) return false;
      uniqueIds.add(p.id);
      return true;
    });

    unique.forEach((p) => addPhotoToDelete(p.id));

    // Find URIs
    const photoMap = new Map(
      photos.map((p) => [p.id, p.uri]),
    );
    const assetIds = unique.map((p) => p.id).join(",");
    const assetUris = unique.map((p) => photoMap.get(p.id) ?? "").join(",");

    router.replace({
      pathname: "/review",
      params: { assetIds, assetUris },
    });
  }, [packs, selected, addPhotoToDelete, photos, router]);

  const headerAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(headerAnim, {
      toValue: 1,
      duration: 550,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <ScreenBackground>
      {/* Header */}
      <Animated.View
        style={[
          styles.header,
          {
            opacity: headerAnim,
            transform: [
              {
                translateY: headerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-18, 0],
                }),
              },
            ],
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.backBtn,
            { backgroundColor: Colors.surfaceLight, borderColor: Colors.border },
          ]}
          onPress={() => router.back()}
        >
          <ArrowLeft size={20} color={Colors.text} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <View style={styles.headerTitleRow}>
            <Wand2 size={18} color="#8B5CF6" />
            <Text style={[styles.headerTitle, { color: Colors.text }]}>
              Magic Cleanup
            </Text>
          </View>
          {!isLoading && packs.length > 0 && (
            <Text
              style={[styles.headerSub, { color: Colors.textSecondary }]}
            >
              {packs.reduce((s, p) => s + p.photos.length, 0)} photos · {fmtStorage(packs.reduce((s, p) => s + p.totalSizeKB, 0))}
            </Text>
          )}
        </View>

        {/* Select all */}
        {!isLoading && packs.length > 0 && (
          <TouchableOpacity
            style={[
              styles.selectAllBtn,
              {
                backgroundColor: allSelected
                  ? "rgba(139,92,246,0.15)"
                  : Colors.surfaceLight,
                borderColor: allSelected ? "#8B5CF6" : Colors.border,
              },
            ]}
            onPress={handleSelectAll}
          >
            <Text
              style={[
                styles.selectAllText,
                { color: allSelected ? "#8B5CF6" : Colors.textSecondary },
              ]}
            >
              {allSelected ? "None" : "All"}
            </Text>
          </TouchableOpacity>
        )}
      </Animated.View>

      {/* Body */}
      {isLoading ? (
        <ScanningView isDark={isDark} />
      ) : packs.length === 0 ? (
        <CleanLibraryView isDark={isDark} />
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingBottom:
                insets.bottom + (totalPhotos > 0 ? 120 : 24) + Spacing.xl,
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Section label */}
          <View style={styles.sectionLabel}>
            <Sparkles size={13} color="#8B5CF6" />
            <Text style={[styles.sectionLabelText, { color: Colors.textMuted }]}>
              AI-DETECTED CLEANUP PACKS
            </Text>
          </View>

          {packs.map((pack, i) => (
            <PackCard
              key={pack.id}
              pack={pack}
              selected={selected.has(pack.id)}
              onToggle={() => togglePack(pack.id)}
              entryDelay={120 + i * 110}
              isDark={isDark}
            />
          ))}

          {/* Tip */}
          <View
            style={[
              styles.tip,
              {
                backgroundColor: isDark
                  ? "rgba(139,92,246,0.08)"
                  : "rgba(139,92,246,0.06)",
                borderColor: "rgba(139,92,246,0.18)",
              },
            ]}
          >
            <ZapOff size={13} color="#8B5CF6" />
            <Text style={[styles.tipText, { color: Colors.textMuted }]}>
              Photos are analysed on-device. Nothing leaves your phone.
            </Text>
          </View>
        </ScrollView>
      )}

      {/* Bottom action bar */}
      <Animated.View
        style={[
          styles.bottomBar,
          {
            paddingBottom: insets.bottom + Spacing.sm,
            backgroundColor: Colors.surface,
            borderTopColor: Colors.border,
            transform: [
              {
                translateY: bottomAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [140, 0],
                }),
              },
            ],
          },
        ]}
        pointerEvents={totalPhotos > 0 ? "auto" : "none"}
      >
        {/* Summary row */}
        <View style={styles.summaryRow}>
          <View
            style={[
              styles.summaryPill,
              { backgroundColor: "rgba(139,92,246,0.12)" },
            ]}
          >
            <CheckCircle2 size={12} color="#8B5CF6" />
            <Text style={[styles.summaryText, { color: "#8B5CF6" }]}>
              {selected.size} pack{selected.size !== 1 ? "s" : ""} selected
            </Text>
          </View>
          <View
            style={[
              styles.summaryPill,
              { backgroundColor: "rgba(239,68,68,0.1)" },
            ]}
          >
            <Trash2 size={12} color="#EF4444" />
            <Text style={[styles.summaryText, { color: "#EF4444" }]}>
              {totalPhotos} photos · {fmtStorage(totalSizeKB)} freed
            </Text>
          </View>
        </View>

        {/* CTA */}
        <TouchableOpacity
          onPress={handleCleanup}
          style={styles.ctaWrapper}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={["#8B5CF6", "#6C63FF"]}
            start={[0, 0]}
            end={[1, 0]}
            style={styles.ctaGradient}
          >
            <Wand2 size={20} color="#fff" />
            <Text style={styles.ctaText}>
              Clean It Up — {totalPhotos} Photo{totalPhotos !== 1 ? "s" : ""}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </ScreenBackground>
  );
}

// ─── styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  backBtn: {
    width: scale(42),
    height: scale(42),
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  headerTitle: {
    fontSize: scaleFont(18),
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: scaleFont(11),
    fontWeight: "500",
  },
  selectAllBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  selectAllText: {
    fontSize: scaleFont(12),
    fontWeight: "700",
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
  },
  sectionLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: Spacing.md,
    marginLeft: 4,
  },
  sectionLabelText: {
    fontSize: scaleFont(10),
    fontWeight: "700",
    letterSpacing: 1.4,
  },
  tip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginTop: Spacing.sm,
  },
  tipText: {
    flex: 1,
    fontSize: scaleFont(11),
    fontWeight: "500",
    lineHeight: scaleFont(16),
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    gap: Spacing.sm,
  },
  summaryRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    flexWrap: "wrap",
  },
  summaryPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  summaryText: {
    fontSize: scaleFont(11),
    fontWeight: "700",
  },
  ctaWrapper: {
    borderRadius: BorderRadius.full,
    overflow: "hidden",
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 10,
  },
  ctaGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: Spacing.md + 2,
    borderRadius: BorderRadius.full,
  },
  ctaText: {
    fontSize: scaleFont(16),
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.2,
  },
});