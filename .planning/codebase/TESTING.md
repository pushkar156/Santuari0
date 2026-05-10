# Testing Strategy: Santuario V2

## Manual Verification (UAT)
Since this is a Chrome Extension with high visual fidelity, manual verification is the primary testing method.

### 1. Persistence Test
- Move a widget (Home).
- Switch to "Tasks" view.
- Refresh the tab.
- **Success**: The widget stays in its new position and the view returns to "Home" (or stays in Tasks if state is persisted).

### 2. Theme Switch Test
- Open Settings.
- Toggle between Glass and Zen.
- **Success**: All views (Home, Tasks, Calendar) update their glass intensity instantly.

### 3. Navigation Test
- Click each icon in the Rail.
- **Success**: The gooey indicator moves smoothly and the view content swaps without flickering.

### 4. Auth Test
- Login to Spotify.
- **Success**: Token is saved to `chrome.storage.local` and playback status updates.

## Automated Checks
- **TypeScript**: `npm run build` (runs `tsc`).
- **Linting**: Standard ESLint configuration.
