# Conventions: Santuario V2

## 1. Theme Awareness
All new components MUST consume the `themeClass` from `useWidgetStore`. Hardcoding `theme-glass` or `theme-zen` is deprecated.

## 2. Component Organization
- **Views**: Full-screen layouts go in `src/components/views/`.
- **Widgets**: Modular Home-grid items go in `src/components/widgets/`.
- **UI**: Reusable atomic elements go in `src/components/ui/`.

## 3. Styling
- Use Tailwind CSS for almost all styling.
- Custom CSS variables (e.g., `--glass-bg`) are defined in `index.css` and vary by `themeClass`.

## 4. State
- Use `zustand` for any state that needs to persist across views or reloads.
- Use the `storageAdapter` for automatic `chrome.storage.local` persistence.

## 5. Animation
- Use `framer-motion` for mounting/unmounting.
- Use `GSAP` for layout-level physics or continuous animations (like the rail).
