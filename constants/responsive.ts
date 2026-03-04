import { Dimensions, PixelRatio, Platform } from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Base width from iPhone 11/12/13/14/15 (standard viewport)
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

/**
 * Scale value based on screen width
 */
export const scale = (size: number) =>
  (SCREEN_WIDTH / guidelineBaseWidth) * size;

/**
 * Scale value based on screen height
 */
export const verticalScale = (size: number) =>
  (SCREEN_HEIGHT / guidelineBaseHeight) * size;

/**
 * Moderate scale value (blended scale between original and scaled)
 * Useful for font sizes and spacing that shouldn't grow too much on large screens
 */
export const moderateScale = (size: number, factor = 0.5) =>
  size + (scale(size) - size) * factor;

/**
 * Font size scaling that respects system font scale settings
 */
export const scaleFont = (size: number) => {
  const newSize = moderateScale(size);
  if (Platform.OS === "ios") {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  } else {
    return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 2;
  }
};

/**
 * Screen dimensions for easy access
 */
export const dimensions = {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
  isSmallDevice: SCREEN_WIDTH < 375,
  isTablet: SCREEN_WIDTH >= 768,
};
