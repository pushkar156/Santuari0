# Concerns: Santuario V2

## Critical Path Issues
- **Roadmap Mismatch**: Phases 5.6 (Bookmarks) and 5.7 (Drive) are marked as completed in `ROADMAP.md` but are currently implemented as **placeholders** (`PlaceholderView.tsx`). The logic for these features still needs to be built.
- **Theme Parity**: Some older components might still have hardcoded `theme-glass` classes. A full audit is required to ensure the "Zen" theme works across all views.
- **Performance**: As more views are added to `Dashboard.tsx`, the component size and conditional rendering logic are becoming complex.

## UX & Design
- **Gooey Rail Transitions**: While visually impressive, the transition between "Home" and "Tasks" needs to feel snappy to maintain the productivity tool's feel.
- **Privacy Mode Coverage**: Need to ensure `isBlurred` state is respected in the new `TasksView` and `CalendarView`.

## Technical Debt
- **Store Refactoring**: `widgetStore` currently handles both theme and layout. It should be split to avoid unnecessary re-renders in unrelated components.
- **Base64 Images**: Storing wallpapers in `chrome.storage.local` as Base64 can hit the 5MB quota quickly.
