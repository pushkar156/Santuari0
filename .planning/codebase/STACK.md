# Tech Stack: Santuario V2

## Core Frameworks
- **React 18**: Frontend library for component-based UI.
- **TypeScript**: Type-safe development environment.
- **Vite + @crxjs/vite-plugin**: Build system optimized for Chrome Extension Manifest V3.

## Extension Architecture
- **Manifest V3**: Using `chrome_url_overrides` for the New Tab page.
- **Chrome APIs**: 
  - `chrome.storage.local`: Primary persistence layer.
  - `chrome.identity`: Used for OAuth flows (Spotify).
  - `chrome.bookmarks`: Intended for the Bookmarks view.

## Styling & Animation
- **Tailwind CSS**: Core styling engine.
- **Framer Motion**: Smooth transitions and modal animations.
- **GSAP**: Powering the liquid gooey navigation rail.
- **Lucide React**: Icon library.

## State Management
- **Zustand**: Global state for widgets, views, and settings.
- **dnd-kit**: Drag-and-drop toolkit for widget reordering (V1 logic, V2 grid-ready).

## External Integrations
- **Spotify Web API**: Real-time playback control (PKCE Flow).
- **OpenWeatherMap**: Live weather data.
- **Google Calendar API**: Integrated schedule management.
- **Google Tasks API**: Cloud-synced task tracking.
- **Google APIs**: Common integration hooks.
