# Codebase Structure: Santuario V2

## Directory Map

### `src/components/views/`
- `TasksView.tsx`: Full-screen task management interface.
- `CalendarView.tsx`: Integrated schedule display.
- `PlaceholderView.tsx`: Generic container for in-development views.

### `src/components/layout/`
- `Dashboard.tsx`: Main application shell and view router.
- `NavigationRail.tsx`: Side navigation with gooey effects.
- `Settings.tsx`: Global configuration modal.
- `BackgroundSettings.tsx`: Wallpapers and customization panel.
- `WidgetContainer.tsx`: Standard wrapper for all draggable dashboard elements.

### `src/components/widgets/`
Modular functional units for the Home view:
- `Clock/`, `Weather/`, `Spotify/`, `QuickLinks/`, `SearchBar/`, `Todo/`, `StickyNotes/`, `Greeting/`.

### `src/store/`
- `widgetStore.ts`: Theme, blur, and layout coordinates.
- `viewStore.ts`: Navigation state.
- `calendarStore.ts`: Local and remote calendar state.
- `tasksStore.ts`: Task list and sync state.

### `src/hooks/`
- `useSpotify.ts`, `useTime.ts`, `useWeather.ts`.

### `src/services/`
- `googleCalendar.ts`: Google Calendar API interaction.
- `googleTasks.ts`: Google Tasks API interaction.

### `src/lib/`
- `spotify.ts`: API and Auth logic.
- `storage.ts`: Unified storage adapter.

## Key Configuration
- `manifest.json`: Extension entry points and permissions.
- `index.css`: Global glassmorphism utilities and variables.
- `vite.config.ts`: CRXJS plugin configuration.
