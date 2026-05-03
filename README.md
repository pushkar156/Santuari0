# 🌅 Santuario
> A high-performance, privacy-first dashboard for your browser.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Vercel Deployment](https://img.shields.io/badge/Vercel-Deployed-success?logo=vercel)](https://santuario-alpha.vercel.app)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.0-646CFF?logo=vite)](https://vitejs.dev/)

**Santuario** is a premium, minimal, and privacy-focused browser extension that transforms your new tab page into a stunning personal command center. Built with **Glassmorphism** aesthetics and modern web standards, it offers a seamless experience without tracking, cloud-syncing, or subscription fees.

---

## 📸 Preview
*A visual showcase of the dashboard layout featuring the core widget suite.*

> [!NOTE]
> High-resolution screenshots coming soon in the next major release!

---

## ✨ Key Features

### 🧩 Core Widgets (Available Now)
- **🔍 Multi-Engine Search**: Switch between Google, DuckDuckGo, and Perplexity in a single click.
- **⛅ Live Weather**: Dynamic updates powered by OpenWeatherMap API with beautiful weather-synced icons.
- **📝 Productivity Suite**: 
  - **Sticky Notes**: A persistent scratchpad for your immediate thoughts.
  - **Daily Todo**: Simple, effective task management to keep you on track.
- **🔗 Quick Links**: A custom-curated board for your most visited sites with auto-fetching favicons.
- **⏰ Smart Greeting**: Time-aware personalized greetings with a sleek digital clock.
- **🖼️ Unsplash Backgrounds**: High-resolution, curated photography that refreshes every session.

### 🎨 Design & UX
- **Glassmorphism Architecture**: Modern UI using backdrop blurs, subtle gradients, and smooth transitions.
- **Responsive Layout**: Designed to look great on any screen size, from laptops to ultra-wide monitors.
- **Zero Latency**: Highly optimized build ensures your new tab opens instantly.

---

## 🔒 Privacy & Architecture

Santuario is built on the philosophy that **your data belongs to you**.

1. **Local-First**: All your links, todos, and notes are stored on your device via `chrome.storage.local`.
2. **Hybrid Engine**: The app features a custom storage adapter that switches between Chrome Storage (for the extension) and LocalStorage (for the web preview).
3. **No Tracking**: We use zero analytics, zero trackers, and zero third-party cookies.
4. **Vercel Optimized**: Fully compatible with Vercel for web hosting while maintaining all local features.

---

## 🛠️ Technology Stack

| Category | Technology |
| :--- | :--- |
| **Frontend** | React 18, TypeScript |
| **State** | Zustand + Persistence Middleware |
| **Styling** | Tailwind CSS, Framer Motion |
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

### Loading the Extension
1. Go to `chrome://extensions/`
2. Enable **Developer Mode**.
3. Click **Load Unpacked** and select the `dist` folder.

---

## 🗺️ Roadmap

- [x] **Phase 1**: Base Shell & Extension Scaffold
- [x] **Phase 2**: Core Widgets & Storage Persistence
- [ ] **Phase 3**: Polish, Themes (Zen/Cyber), & Drag-and-Drop Layout
- [ ] **Phase 4**: Media Integration (Spotify) & Pomodoro Timer

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<p align="center">
  Built with ❤️ for a better browser experience.
</p>