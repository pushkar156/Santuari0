import { useWidgetStore } from '../../store/widgetStore';
import { useViewStore } from '../../store/viewStore';
import { 
  Settings as SettingsIcon, 
  Music, 
  CloudRain, 
  X, 
  Eye, 
  EyeOff, 
  MapPin
} from 'lucide-react';
import { SpotifyService } from '../../lib/spotify';
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

export const Settings = ({ onClose }: { onClose: () => void }) => {
  const { 
    spotifyToken, setSpotifyToken,
    setSpotifyRefreshToken,
    spotifyClientId, setSpotifyClientId,
    settings, updateWeatherSettings,
    updateSpotifyTrack,
    weatherConnected, setWeatherConnected
  } = useWidgetStore();

  const { setActiveView } = useViewStore();
  const modalRef = useRef<HTMLDivElement>(null);
  
  const [showSpotifyId, setShowSpotifyId] = useState(false);
  const [showWeatherKey, setShowWeatherKey] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const mode = useWidgetStore(state => state.mode);

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      setActiveView('home');
    }
  };

  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const handleSpotifyConnect = async () => {
    if (!spotifyClientId) {
      alert('Please enter your Spotify Client ID first.');
      return;
    }
    try {
      const tokens = await SpotifyService.login(spotifyClientId);
      setSpotifyToken(tokens.accessToken);
      setSpotifyRefreshToken(tokens.refreshToken);
    } catch (error: any) {
      console.error('Spotify login error:', error);
      alert(`Spotify Connection Error: ${error.message || 'Check your Client ID and Redirect URI.'}`);
    }
  };

  const handleSpotifyDisconnect = () => {
    setSpotifyToken(null);
    setSpotifyRefreshToken(null);
    updateSpotifyTrack(null);
  };

  const handleWeatherConnect = () => {
    if (!settings.weather.apiKey) {
      alert('Please enter an OpenWeatherMap API Key.');
      return;
    }
    if (!settings.weather.city) {
      alert('Please enter a city.');
      return;
    }
    setWeatherConnected(true);
  };

  const handleWeatherDisconnect = () => {
    setWeatherConnected(false);
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch(
            `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${settings.weather.apiKey || 'YOUR_API_KEY'}`
          );
          const data = await response.json();
          if (data && data[0]) {
            updateWeatherSettings({ city: data[0].name });
          } else {
            alert('Could not determine city name from your coordinates.');
          }
        } catch (error) {
          console.error('Error detecting location:', error);
          alert('Failed to detect location name. Please enter it manually.');
        } finally {
          setIsDetectingLocation(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        alert('Error getting your location. Please check your permissions.');
        setIsDetectingLocation(false);
      }
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-12">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal Container */}
      <motion.div 
        ref={modalRef}
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative w-full max-w-5xl bg-theme-glass/40 backdrop-blur-3xl border border-theme-border rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-8 border-b border-theme-border shrink-0">
          <h2 className="text-3xl font-bold flex items-center gap-4 text-theme-text">
            <SettingsIcon size={32} className="text-theme-muted" /> Configuration
          </h2>
          <button 
            onClick={handleClose}
            className="p-2 rounded-full hover:bg-theme-hover text-theme-muted hover:text-theme-text transition-colors"
          >
            <X size={28} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-8 md:p-10 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Column 1: Spotify */}
            <div className="space-y-6">
              <label className="text-sm font-bold uppercase tracking-widest text-theme-muted flex items-center gap-2">
                <Music size={16} /> Spotify Integration
              </label>
              <div className="space-y-4">
                <div className="relative">
                  <input 
                    type={showSpotifyId ? "text" : "password"} 
                    value={spotifyClientId}
                    onChange={(e) => setSpotifyClientId(e.target.value)}
                    className="w-full bg-theme-glass border border-theme-border rounded-xl px-5 py-4 pr-14 outline-none focus:ring-2 focus:ring-theme-border transition-colors text-lg placeholder-theme-muted text-theme-text"
                    placeholder="Enter Spotify Client ID..."
                  />
                  <button 
                    onClick={() => setShowSpotifyId(!showSpotifyId)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-theme-muted hover:text-theme-text transition-colors"
                  >
                    {showSpotifyId ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={handleSpotifyConnect}
                    disabled={!!spotifyToken}
                    className={`py-4 rounded-xl font-bold transition-all text-lg ${spotifyToken ? 'bg-green-500/10 text-green-500 cursor-not-allowed border border-green-500/20' : 'bg-[#1DB954] text-white hover:bg-[#1ed760] shadow-lg shadow-[#1DB954]/20'}`}
                  >
                    {spotifyToken ? 'Connected' : 'Connect'}
                  </button>
                  <button 
                    onClick={handleSpotifyDisconnect}
                    disabled={!spotifyToken}
                    className={`py-4 rounded-xl font-bold transition-all text-lg ${!spotifyToken ? 'bg-red-500/10 text-red-500/50 cursor-not-allowed border border-red-500/20' : 'bg-red-500/20 text-red-500 border border-red-500/30 hover:bg-red-500/30'}`}
                  >
                    Disconnect
                  </button>
                </div>

                <p className="text-xs text-theme-muted">
                  Redirect URI: <span className="select-all bg-theme-glass px-2 py-1 rounded">
                    {typeof chrome !== 'undefined' && chrome.identity ? chrome.identity.getRedirectURL() : 'https://[EXTENSION_ID].chromiumapp.org/'}
                  </span>
                </p>
              </div>
            </div>

            {/* Column 2: Weather */}
            <div className="space-y-6">
              <label className="text-sm font-bold uppercase tracking-widest text-theme-muted flex items-center gap-2">
                <CloudRain size={16} /> Weather Integration
              </label>
              <div className="space-y-4">
                <div className="relative">
                  <input 
                    type={showWeatherKey ? "text" : "password"} 
                    value={settings.weather.apiKey}
                    onChange={(e) => updateWeatherSettings({ apiKey: e.target.value })}
                    className="w-full bg-theme-glass border border-theme-border rounded-xl px-5 py-4 pr-14 outline-none focus:ring-2 focus:ring-theme-border transition-colors text-lg placeholder-theme-muted text-theme-text"
                    placeholder="OpenWeatherMap API Key..."
                  />
                  <button 
                    onClick={() => setShowWeatherKey(!showWeatherKey)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-theme-muted hover:text-theme-text transition-colors"
                  >
                    {showWeatherKey ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>

                <div className="relative">
                  <input 
                    type="text" 
                    value={settings.weather.city}
                    onChange={(e) => updateWeatherSettings({ city: e.target.value })}
                    className="w-full bg-theme-glass border border-theme-border rounded-xl px-5 py-4 pr-14 outline-none focus:ring-2 focus:ring-theme-border transition-colors text-lg placeholder-theme-muted text-theme-text"
                    placeholder="City (e.g. London)..."
                  />
                  <button 
                    onClick={detectLocation}
                    disabled={isDetectingLocation}
                    title="Detect current location"
                    className={`absolute right-4 top-1/2 -translate-y-1/2 p-2 text-theme-muted hover:text-theme-text transition-colors ${isDetectingLocation ? 'animate-pulse' : ''}`}
                  >
                    <MapPin size={20} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={handleWeatherConnect}
                    disabled={weatherConnected}
                    className={`py-4 rounded-xl font-bold transition-all text-lg ${weatherConnected ? 'bg-orange-500/10 text-orange-500 cursor-not-allowed border border-orange-500/20' : 'bg-orange-500 text-white hover:bg-orange-600 shadow-lg shadow-orange-500/20'}`}
                  >
                    {weatherConnected ? 'Connected' : 'Connect'}
                  </button>
                  <button 
                    onClick={handleWeatherDisconnect}
                    disabled={!weatherConnected}
                    className={`py-4 rounded-xl font-bold transition-all text-lg ${!weatherConnected ? 'bg-red-500/10 text-red-500/50 cursor-not-allowed border border-red-500/20' : 'bg-red-500/20 text-red-500 border border-red-500/30 hover:bg-red-500/30'}`}
                  >
                    Disconnect
                  </button>
                </div>
                <p className="text-xs text-theme-muted">
                  Get Key: <a href="https://home.openweathermap.org/api_keys" target="_blank" rel="noopener noreferrer" className="select-all bg-theme-glass px-2 py-1 rounded hover:text-theme-text transition-colors underline decoration-theme-border">https://home.openweathermap.org/api_keys</a>
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-8 border-t border-theme-border flex justify-end shrink-0">
          <button 
            onClick={handleClose}
            className={`px-10 py-3 rounded-xl font-bold transition-all shadow-lg active:scale-95 hover:opacity-90 ${
              mode === 'light' 
                ? 'bg-black text-white hover:shadow-black/20' 
                : 'bg-white text-black hover:shadow-white/20'
            }`}
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
};
