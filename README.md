# 🌅 Santuario

**Santuario** is a fully custom, privacy-focused new tab browser extension. It replaces your default blank new tab with a beautiful, widget-driven personal dashboard that acts as your daily command center.

Designed with glassmorphism and minimal aesthetics, Santuario gives you complete control over your browser homepage without any subscription fees, analytics tracking, or data privacy concerns. 

Everything stays local. Everything is yours.

---

## ✨ Core Features

Santuario is currently in active development. Here is what is available and what is planned:

### 🚀 Available Now (Phase 1)
- **Stunning Backgrounds**: Dynamic, curated background images powered by Unsplash.
- **Live Clock**: A beautiful, real-time ticking digital clock widget.
- **Personalized Greeting**: Time-based dynamic greetings tailored to you.

### 🔮 Coming Soon (Roadmap)
- **Productivity Suite**: 
  - Quick Links Board (draggable bookmarks)
  - Persistent Sticky Notes
  - Daily Todo & Focus Task manager
  - Multi-engine Search Bar
- **Wellness & Habits**:
  - Live Weather via OpenWeatherMap API
  - 25/5 Pomodoro Timer
  - Daily Habit Tracker & Streaks
  - Spotify Now Playing integration
- **Deep Customization**:
  - Global drag-and-drop widget layout editor
  - Dark/Light, Glassmorphism, and Cyberpunk theme presets
  - Privacy/Blur toggle for public spaces
  - Custom CSS configuration for power users

---

## 🔒 The Privacy Promise

Santuario was built specifically to be an alternative to SaaS-based dashboard extensions (like Momentum or LumiList). 
- **Zero Cloud Syncing**: 100% of your data is stored locally on your machine using `chrome.storage.local`.
- **Zero Accounts**: No sign-ups or login pages.
- **Zero Tracking**: No analytics, telemetry, or behavior tracking scripts are used.

---

## 🛠️ Technology Stack

Santuario is built with modern, lightning-fast web technologies:

- **Framework**: React 18
- **Build Tool**: Vite + CRXJS (for seamless hot-module-replacement in extension development)
- **Styling**: Tailwind CSS & Framer Motion
- **Language**: TypeScript
- **Extension API**: Manifest V3 (Chrome, Edge, Brave, Firefox via WebExtensions)

---

## 💻 Local Development & Installation

Want to run Santuario locally or contribute? It's incredibly easy to get started.

### Prerequisites
- Node.js (v18 or higher)
- npm or pnpm
- Google Chrome (or a Chromium-based browser) for testing

### 1. Setup the Project
Clone the repository and install dependencies:

```bash
git clone https://github.com/yourusername/santuario.git
cd santuario
npm install
```

### 2. Start the Development Server
Run Vite's development server with CRXJS:

```bash
npm run dev
```

### 3. Load the Extension into your Browser
1. Open Chrome and navigate to `chrome://extensions/`.
2. Enable **Developer mode** (toggle in the top right corner).
3. Click **Load unpacked** in the top left corner.
4. Select the `dist/` folder that was generated inside the project directory.
5. Open a new tab! As you edit the React code, the extension will automatically hot-reload via Vite.

### 4. Build for Production
To build the final, optimized version for the Chrome Web Store:

```bash
npm run build
```
This generates the optimized bundle in the `dist/` directory, ready to be zipped and published.

---

## 📂 Project Architecture

```text
santuario/
├── public/                 # Static assets (icons, manifest base)
├── src/
│   ├── components/
│   │   ├── layout/         # Core structural components (Dashboard)
│   │   └── widgets/        # Individual feature widgets (Clock, Greeting)
│   ├── hooks/              # Custom React hooks (useTime, useBackground)
│   ├── newtab/             # New Tab page entry point (App.tsx, index.html)
│   └── background.ts       # Service worker script
├── .planning/              # GSD internal architecture and project tracking
├── manifest.json           # Manifest V3 configuration
├── tailwind.config.js      # Styling tokens and theme rules
└── vite.config.ts          # Vite build and CRXJS config
```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.