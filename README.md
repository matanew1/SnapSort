# SnapSort 📸

**SnapSort** is a premium, high-performance mobile application built with React Native and Expo. It provides a "Tinder-style" swipe interface to help users quickly sort through their photo library, keeping what they love and trashing what they don't.

![SnapSort Header](https://raw.githubusercontent.com/matanew1/SnapSort/main/assets/images/icon.png)

## ✨ Features

- **Swipe-to-Sort**: Intuitive left/right swipe gestures for deleting or keeping photos.
- **Media Library Integration**: Seamlessly fetches and manages local device photos.
- **Advanced Filtering**: Filter by albums or date ranges (Today, This Week, This Month, etc.).
- **Review & Permanent Delete**: Safety-first review screen before permanently removing assets.
- **Premium UI/UX**: Sophisticated dark theme with smooth Reanimated 3 animations and haptic feedback.
- **Modular Architecture**: Clean, scalable codebase using Zustand for state management and Atomic design principles.

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or newer)
- [Expo Go](https://expo.dev/go) app on your device or an emulator/simulator.

### Installation

1.  Clone the repository:

    ```bash
    git clone https://github.com/matanew1/SnapSort.git
    cd SnapSort
    ```

2.  Install dependencies:

    ```bash
    npm install
    ```

3.  Start the development server:
    ```bash
    npm start
    ```

## 🛠 Tech Stack

- **Framework**: [Expo](https://expo.dev/) (SDK 54) / React Native
- **Navigation**: [Expo Router](https://docs.expo.dev/router/introduction/) (v3)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Animations**: [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/)
- **Gestures**: [React Native Gesture Handler](https://docs.swmansion.com/react-native-gesture-handler/)
- **Icons**: [Lucide React Native](https://lucide.dev/guide/react-native)
- **Persistence**: [AsyncStorage](https://react-native-async-storage.github.io/async-storage/)

## 📂 Project Structure

```bash
├── app/              # Expo Router pages & layouts
├── assets/           # Static images, fonts, and icons
├── components/       # UI components (Atomic structure)
│   ├── common/       # Global/Generic components
│   ├── features/     # Feature-specific components
│   └── shared/       # Cross-feature reusable components
├── constants/        # Theme definitions (Colors, Spacing, etc.)
├── hooks/            # Custom React hooks
├── store/            # Zustand store definitions
└── scripts/          # Utility scripts
```

## 📜 License

This project is private and intended for internal use.

---

_Built with ❤️ by matanew1_
