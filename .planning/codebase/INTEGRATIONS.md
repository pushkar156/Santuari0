# Integrations: Santuario V2

## 1. Spotify Web API
- **Purpose**: Real-time playback control and metadata.
- **Auth**: PKCE Flow using `chrome.identity`.
- **Status**: Stable. Polling every 10s via `useSpotify` hook.

## 2. Google APIs
- **Tasks**: Integration for `TasksView`.
- **Calendar**: Integration for `CalendarView`.
- **Status**: Core services and stores implemented. UI is functional.

## 3. OpenWeatherMap
- **Purpose**: Live weather updates for the dashboard.
- **Status**: Stable. Requires API Key in settings.

## 4. Local File System (Proposed)
- **Purpose**: Supporting the "Drive" view for local media access.
- **Status**: Currently a placeholder.

## 5. Chrome Bookmarks
- **Purpose**: Logic for the Bookmarks Organizer.
- **Status**: Currently a placeholder.
