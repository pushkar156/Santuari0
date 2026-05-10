# Critical User Flows: Santuario V2

## 1. App Startup
1. User opens a new tab.
2. `Dashboard` initializes.
3. `widgetStore` loads layout from `chrome.storage.local`.
4. `viewStore` initializes to the default view (Home).
5. Background image is fetched from storage or default is used.

## 2. View Switching
1. User clicks "Tasks" in the Navigation Rail.
2. `viewStore.setActiveView('Tasks')` is called.
3. `Dashboard` re-renders, swapping the main content area with `TasksView`.
4. Navigation Rail plays the gooey bubble animation via GSAP.

## 3. Customizing the Space
1. User drags a widget on the Home view.
2. `onLayoutChange` triggers.
3. `widgetStore` saves the new coordinates to local storage.
4. User changes theme to "Zen".
5. CSS variables update across the entire app.
