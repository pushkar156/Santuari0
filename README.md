# 🌅 Santuario
> A high-performance, privacy-first dashboard for your browser.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Vercel Deployment](https://img.shields.io/badge/Vercel-Deployed-success?logo=vercel)](https://santuario-alpha.vercel.app)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.0-646CFF?logo=vite)](https://vitejs.dev/)

**Santuario** is a premium, minimal, and privacy-focused browser extension that transforms your new tab page into a stunning personal command center. Built with **Glassmorphism** aesthetics and modern web standards, it offers a seamless experience without tracking, cloud-syncing, or subscription fees.

---

## 📸 Preview

*Santuario offers a serene, glassmorphism-inspired interface designed to help you focus and stay productive.*

---

## ✨ Key Features

### 🚀 Advanced Navigation & Workspace
- **Modular Navigation Rail**: A sleek, right-side command bar for instant switching between specialized views.
- **Multi-View Ecosystem**: Dedicated interfaces for Home, Tasks, Calendar, Bookmarks, Local Media, and an integrated AI Assistant (OVI).
- **Gooey Interaction Design**: High-end interactive navigation components with fluid, organic transitions.
- **Perspective Layout**: A structured grid that balances focus and information density.

### 🧩 Core Widgets
- **🔍 Multi-Engine Search**: Switch between Google, DuckDuckGo, and Perplexity in a single click.
- **⛅ Live Weather**: Dynamic updates powered by OpenWeatherMap API with weather-synced icons.
- **🎵 Spotify Connect**: Full playback control and real-time "Now Playing" metadata with PKCE authentication.
- **📝 Productivity Suite**: 
  - **Sticky Notes**: A persistent scratchpad for your immediate thoughts.
  - **Daily Todo**: Simple, effective task management.
- **🔗 Quick Links**: A custom-curated board for your most visited sites with auto-fetching favicons.
- **⏰ Smart Greeting**: Time-aware personalized greetings with a sleek digital clock.

### 🖼️ Wallpaper Engine
- **Custom Uploads**: Use any image as your background with local persistence.
- **In-App Image Editor**: Crop, rotate (90° increments), and zoom wallpapers directly within the dashboard.
- **Wallpaper History**: Remembers your last 10 backgrounds for quick switching.
- **High-Fidelity Aesthetics**: Glassmorphism UI with backdrop blurs and spring-physics transitions.

---

## 🔒 Privacy & Architecture

Santuario is built on the philosophy that **your data belongs to you**.

1. **Local-First**: All your links, todos, and backgrounds are stored on your device via `chrome.storage.local`.
2. **Hybrid Engine**: Custom storage adapter switches between Chrome Storage (extension) and LocalStorage (web preview).
3. **Privacy Blur**: Press `Alt + B` to instantly blur sensitive widgets when someone walks behind you.
4. **No Tracking**: Zero analytics, zero trackers, and zero third-party cookies.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Alt + B` | Toggle Privacy Blur |
| `Esc` | Close Settings / Background Modals |
| `Enter` | Search from the bar |

---

## 🛠️ Technology Stack

| Category | Technology |
| :--- | :--- |
| **Frontend** | React 18, TypeScript |
| **Animation** | Framer Motion (Spring Physics) |
| **State** | Zustand + Persistence Middleware |
| **Styling** | Tailwind CSS + Custom CSS Variables |
| **Build Tool** | Vite, CRXJS |
| **Deployment** | Vercel (Web), Chrome Web Store (Extension) |

---

## 🚀 Getting Started

### Installation (Local Development)

```bash
# 1. Clone the repository
git clone https://github.com/pushkar156/Santuari0.git

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

### 🔑 API Configuration

To enable the full suite of features, you will need to obtain API keys from the following services and add them via the **Settings** panel within the extension.

| Service | Purpose | Source |
| :--- | :--- | :--- |
| **OpenWeatherMap** | Live Weather Updates | [Get API Key](https://home.openweathermap.org/api_keys) |
| **Spotify Developer** | Now Playing Widget | [Create App](https://developer.spotify.com/dashboard) |

#### **How to Add Keys:**
1. Click the **Settings (Gear Icon)** in the right-side Navigation Rail.
2. Enter your **OpenWeatherMap API Key** and your city name.
3. Enter your **Spotify Client ID**. 
   - *Note: You must add the Redirect URI found in the settings panel to your Spotify Developer Dashboard under "Edit Settings".*

### Loading the Extension
1. Run `npm run build`
2. Go to `chrome://extensions/`
3. Enable **Developer Mode**.
4. Click **Load Unpacked** and select the `dist` folder.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<p align="center">
  Built with ❤️ for a better browser experience.
</p>