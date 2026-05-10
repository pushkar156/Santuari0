# Architecture: Santuario V2

## Core Patterns

### 1. View-Based Routing
The application is orchestrated by a `viewStore`. The `Dashboard.tsx` acts as a router, rendering different "Views" based on the `activeView` state:
- **Home**: The main dashboard with a 12-column grid.
- **Tasks**: Dedicated to-do management (`TasksView.tsx`).
- **Calendar**: Integrated schedule view (`CalendarView.tsx`).
- **Secondary Views**: `bookmarks`, `drive`, and `ovi` currently utilize a reusable `PlaceholderView.tsx`.

### 2. Standardized Design Tokens
A central theme system in `widgetStore.ts` provides a `themeClass` (`theme-glass` or `theme-zen`). This token is injected into component wrappers to maintain aesthetic consistency.

### 3. Navigation Orchestration
The **NavigationRail** is persistent across all views. It uses GSAP for a high-end "Gooey" selection effect and Framer Motion for entrance/exit animations.

### 4. Persistent State Loop
The app uses a custom `storageAdapter` for Zustand, which prioritizes `chrome.storage.local` with a fallback to `localStorage`. This ensures the environment stays consistent whether running as an extension or in development.

### 5. Media Context (Spotify)
Spotify integration uses the PKCE auth flow. The `useSpotify` hook manages token refreshing and polling, providing real-time playback state to the UI components.
