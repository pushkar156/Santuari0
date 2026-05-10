// vite.config.ts
import { defineConfig } from "file:///E:/Pushkar/Personal%20Projects/Santuario/node_modules/vite/dist/node/index.js";
import react from "file:///E:/Pushkar/Personal%20Projects/Santuario/node_modules/@vitejs/plugin-react/dist/index.js";
import { crx } from "file:///E:/Pushkar/Personal%20Projects/Santuario/node_modules/@crxjs/vite-plugin/dist/index.mjs";

// manifest.json
var manifest_default = {
  manifest_version: 3,
  name: "Santuario",
  version: "2.5.3",
  description: "A fully custom privacy-focused new tab dashboard.",
  chrome_url_overrides: {
    newtab: "index.html"
  },
  permissions: [
    "storage",
    "identity",
    "unlimitedStorage",
    "bookmarks",
    "favicon"
  ],
  background: {
    service_worker: "src/background.ts"
  },
  oauth2: {
    client_id: "75741279554-kb6g88m7fmhrpbf9ko3u0jv1qj1t07as.apps.googleusercontent.com",
    scopes: [
      "https://www.googleapis.com/auth/tasks",
      "https://www.googleapis.com/auth/calendar.readonly"
    ]
  },
  host_permissions: [
    "https://api.openweathermap.org/*",
    "https://api.spotify.com/*",
    "https://accounts.spotify.com/*",
    "https://www.googleapis.com/*"
  ]
};

// vite.config.ts
var vite_config_default = defineConfig({
  server: {
    port: 5173,
    strictPort: true,
    cors: true,
    hmr: {
      port: 5173,
      clientPort: 5173
    }
  },
  plugins: [
    react(),
    crx({ manifest: manifest_default })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom"],
          "vendor-motion": ["framer-motion"],
          "vendor-icons": ["lucide-react"],
          "vendor-dnd": ["@dnd-kit/core", "@dnd-kit/sortable", "@dnd-kit/utilities"]
        }
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiLCAibWFuaWZlc3QuanNvbiJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkU6XFxcXFB1c2hrYXJcXFxcUGVyc29uYWwgUHJvamVjdHNcXFxcU2FudHVhcmlvXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJFOlxcXFxQdXNoa2FyXFxcXFBlcnNvbmFsIFByb2plY3RzXFxcXFNhbnR1YXJpb1xcXFx2aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vRTovUHVzaGthci9QZXJzb25hbCUyMFByb2plY3RzL1NhbnR1YXJpby92aXRlLmNvbmZpZy50c1wiO2ltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gJ3ZpdGUnO1xuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0JztcbmltcG9ydCB7IGNyeCB9IGZyb20gJ0Bjcnhqcy92aXRlLXBsdWdpbic7XG5pbXBvcnQgbWFuaWZlc3QgZnJvbSAnLi9tYW5pZmVzdC5qc29uJztcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgc2VydmVyOiB7XG4gICAgcG9ydDogNTE3MyxcbiAgICBzdHJpY3RQb3J0OiB0cnVlLFxuICAgIGNvcnM6IHRydWUsXG4gICAgaG1yOiB7XG4gICAgICBwb3J0OiA1MTczLFxuICAgICAgY2xpZW50UG9ydDogNTE3MyxcbiAgICB9LFxuICB9LFxuICBwbHVnaW5zOiBbXG4gICAgcmVhY3QoKSxcbiAgICBjcngoeyBtYW5pZmVzdCB9KSxcbiAgXSxcbiAgYnVpbGQ6IHtcbiAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICBvdXRwdXQ6IHtcbiAgICAgICAgbWFudWFsQ2h1bmtzOiB7XG4gICAgICAgICAgJ3ZlbmRvci1yZWFjdCc6IFsncmVhY3QnLCAncmVhY3QtZG9tJ10sXG4gICAgICAgICAgJ3ZlbmRvci1tb3Rpb24nOiBbJ2ZyYW1lci1tb3Rpb24nXSxcbiAgICAgICAgICAndmVuZG9yLWljb25zJzogWydsdWNpZGUtcmVhY3QnXSxcbiAgICAgICAgICAndmVuZG9yLWRuZCc6IFsnQGRuZC1raXQvY29yZScsICdAZG5kLWtpdC9zb3J0YWJsZScsICdAZG5kLWtpdC91dGlsaXRpZXMnXSxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfSxcbiAgfSxcbn0pO1xuIiwgIntcclxuICBcIm1hbmlmZXN0X3ZlcnNpb25cIjogMyxcclxuICBcIm5hbWVcIjogXCJTYW50dWFyaW9cIixcclxuICBcInZlcnNpb25cIjogXCIyLjUuM1wiLFxyXG4gIFwiZGVzY3JpcHRpb25cIjogXCJBIGZ1bGx5IGN1c3RvbSBwcml2YWN5LWZvY3VzZWQgbmV3IHRhYiBkYXNoYm9hcmQuXCIsXHJcbiAgXCJjaHJvbWVfdXJsX292ZXJyaWRlc1wiOiB7XHJcbiAgICBcIm5ld3RhYlwiOiBcImluZGV4Lmh0bWxcIlxyXG4gIH0sXHJcbiAgXCJwZXJtaXNzaW9uc1wiOiBbXHJcbiAgICBcInN0b3JhZ2VcIixcclxuICAgIFwiaWRlbnRpdHlcIixcclxuICAgIFwidW5saW1pdGVkU3RvcmFnZVwiLFxyXG4gICAgXCJib29rbWFya3NcIixcclxuICAgIFwiZmF2aWNvblwiXHJcbiAgXSxcclxuICBcImJhY2tncm91bmRcIjoge1xyXG4gICAgXCJzZXJ2aWNlX3dvcmtlclwiOiBcInNyYy9iYWNrZ3JvdW5kLnRzXCJcclxuICB9LFxyXG4gIFwib2F1dGgyXCI6IHtcclxuICAgIFwiY2xpZW50X2lkXCI6IFwiNzU3NDEyNzk1NTQta2I2Zzg4bTdmbWhycGJmOWtvM3UwanYxcWoxdDA3YXMuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb21cIixcclxuICAgIFwic2NvcGVzXCI6IFtcclxuICAgICAgXCJodHRwczovL3d3dy5nb29nbGVhcGlzLmNvbS9hdXRoL3Rhc2tzXCIsXHJcbiAgICAgIFwiaHR0cHM6Ly93d3cuZ29vZ2xlYXBpcy5jb20vYXV0aC9jYWxlbmRhci5yZWFkb25seVwiXHJcbiAgICBdXHJcbiAgfSxcclxuICBcImhvc3RfcGVybWlzc2lvbnNcIjogW1xyXG4gICAgXCJodHRwczovL2FwaS5vcGVud2VhdGhlcm1hcC5vcmcvKlwiLFxyXG4gICAgXCJodHRwczovL2FwaS5zcG90aWZ5LmNvbS8qXCIsXHJcbiAgICBcImh0dHBzOi8vYWNjb3VudHMuc3BvdGlmeS5jb20vKlwiLFxyXG4gICAgXCJodHRwczovL3d3dy5nb29nbGVhcGlzLmNvbS8qXCJcclxuICBdXHJcbn0iXSwKICAibWFwcGluZ3MiOiAiO0FBQThTLFNBQVMsb0JBQW9CO0FBQzNVLE9BQU8sV0FBVztBQUNsQixTQUFTLFdBQVc7OztBQ0ZwQjtBQUFBLEVBQ0Usa0JBQW9CO0FBQUEsRUFDcEIsTUFBUTtBQUFBLEVBQ1IsU0FBVztBQUFBLEVBQ1gsYUFBZTtBQUFBLEVBQ2Ysc0JBQXdCO0FBQUEsSUFDdEIsUUFBVTtBQUFBLEVBQ1o7QUFBQSxFQUNBLGFBQWU7QUFBQSxJQUNiO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0Y7QUFBQSxFQUNBLFlBQWM7QUFBQSxJQUNaLGdCQUFrQjtBQUFBLEVBQ3BCO0FBQUEsRUFDQSxRQUFVO0FBQUEsSUFDUixXQUFhO0FBQUEsSUFDYixRQUFVO0FBQUEsTUFDUjtBQUFBLE1BQ0E7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUFBLEVBQ0Esa0JBQW9CO0FBQUEsSUFDbEI7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNGO0FBQ0Y7OztBRDFCQSxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixRQUFRO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixZQUFZO0FBQUEsSUFDWixNQUFNO0FBQUEsSUFDTixLQUFLO0FBQUEsTUFDSCxNQUFNO0FBQUEsTUFDTixZQUFZO0FBQUEsSUFDZDtBQUFBLEVBQ0Y7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNQLE1BQU07QUFBQSxJQUNOLElBQUksRUFBRSwyQkFBUyxDQUFDO0FBQUEsRUFDbEI7QUFBQSxFQUNBLE9BQU87QUFBQSxJQUNMLGVBQWU7QUFBQSxNQUNiLFFBQVE7QUFBQSxRQUNOLGNBQWM7QUFBQSxVQUNaLGdCQUFnQixDQUFDLFNBQVMsV0FBVztBQUFBLFVBQ3JDLGlCQUFpQixDQUFDLGVBQWU7QUFBQSxVQUNqQyxnQkFBZ0IsQ0FBQyxjQUFjO0FBQUEsVUFDL0IsY0FBYyxDQUFDLGlCQUFpQixxQkFBcUIsb0JBQW9CO0FBQUEsUUFDM0U7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
