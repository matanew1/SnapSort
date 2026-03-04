import "dotenv/config";

import { ExpoConfig } from "expo/config";

const packageJson = require("./package.json");

const config: ExpoConfig = {
  name: "SnapSort",
  slug: "SnapSort",
  version: packageJson.version,
  orientation: "portrait",
  icon: "./assets/ios/AppIcon~ios-marketing.png",
  scheme: "snapsort",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
  },
  android: {
    adaptiveIcon: {
      backgroundColor: "#000000",
      foregroundImage:
        "./assets/android/res/mipmap-xxxhdpi/ic_launcher_foreground.png",
      backgroundImage:
        "./assets/android/res/mipmap-xxxhdpi/ic_launcher_background.png",
      monochromeImage:
        "./assets/android/res/mipmap-xxxhdpi/ic_launcher_monochrome.png",
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
  },
  web: {
    output: "static",
    favicon: "./assets/web/favicon.ico",
  },
  plugins: [
    [
      "expo-media-library",
      {
        photosPermission:
          "Allow SnapSort to access your photos to help you clean up your gallery.",
        savePhotosPermission: "Allow SnapSort to save/delete photos.",
        isAccessMediaLocationEnabled: true,
      },
    ],
    "expo-router",
    [
      "expo-splash-screen",
      {
        image: "./assets/ios/AppIcon~ios-marketing.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#000000",
        dark: {
          backgroundColor: "#000000",
        },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
};

export default config;
