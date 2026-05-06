
import { useWidgetStore } from '../../store/widgetStore';
import { Settings as SettingsIcon, User, Palette, EyeOff, Layout, Music, CloudRain } from 'lucide-react';
import { SpotifyService } from '../../lib/spotify';

export const Settings = () => {
  const { 
    userName, setUserName, 
    theme, setTheme, 
    isBlurred, toggleBlur, 
    resetLayout,
    spotifyToken, setSpotifyToken,
    spotifyClientId, setSpotifyClientId,
    customCSS, setCustomCSS,
    settings, updateWeatherSettings
  } = useWidgetStore();

  const handleSpotifyConnect = async () => {
    if (!spotifyClientId) {
      alert('Please enter your Spotify Client ID first.');
      return;
    }
    try {
      const token = await SpotifyService.login(spotifyClientId);
      setSpotifyToken(token);
    } catch (error: any) {
      console.error('Spotify login error:', error);
      alert(`Spotify Connection Error: ${error.message || 'Check your Client ID and Redirect URI.'}`);
    }
  };

  return (
    <div className="flex flex-col w-full min-h-screen p-12 text-white">
      <div className="w-full max-w-5xl mx-auto bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-10 shadow-2xl overflow-y-auto max-h-[85vh] custom-scrollbar">
        <h2 className="text-4xl font-bold mb-10 flex items-center gap-4">
          <SettingsIcon size={36} className="text-white/80" /> Configuration
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Column 1 */}
          <div className="space-y-10">
          {/* User Name */}
          <div className="space-y-4">
            <label className="text-sm font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
              <User size={16} /> Display Name
            </label>
            <input 
              type="text" 
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full bg-black/20 border border-white/10 rounded-xl px-5 py-4 outline-none focus:ring-2 focus:ring-white/20 transition-all text-lg"
              placeholder="Enter your name..."
            />
          </div>

          {/* Theme Switcher */}
          <div className="space-y-4">
            <label className="text-sm font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
              <Palette size={16} /> Theme
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setTheme('glass')}
                className={`py-4 rounded-xl border transition-all text-lg font-medium ${theme === 'glass' ? 'bg-white/20 border-white/40' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
              >
                Glass
              </button>
              <button 
                onClick={() => setTheme('zen')}
                className={`py-4 rounded-xl border transition-all text-lg font-medium ${theme === 'zen' ? 'bg-white/20 border-white/40' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
              >
                Zen
              </button>
            </div>
          </div>

          {/* Spotify Integration */}
          <div className="space-y-4 pt-8 border-t border-white/10">
            <label className="text-sm font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
              <Music size={16} /> Spotify Integration
            </label>
            <div className="space-y-4">
              <input 
                type="text" 
                value={spotifyClientId}
                onChange={(e) => setSpotifyClientId(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-xl px-5 py-4 outline-none focus:ring-2 focus:ring-white/20 transition-all text-lg"
                placeholder="Enter Spotify Client ID..."
              />
              <button 
                onClick={handleSpotifyConnect}
                className={`w-full py-4 rounded-xl font-bold transition-all text-lg ${spotifyToken ? 'bg-green-500/20 text-green-500 border border-green-500/30' : 'bg-[#1DB954] text-white hover:bg-[#1ed760]'}`}
              >
                {spotifyToken ? 'Spotify Connected' : 'Connect Spotify'}
              </button>
              <p className="text-xs text-white/40">
                Redirect URI: <span className="select-all bg-black/40 px-2 py-1 rounded">{chrome.identity.getRedirectURL()}</span>
              </p>
            </div>
          </div>

          {/* Weather Integration */}
          <div className="space-y-4 pt-8 border-t border-white/10">
            <label className="text-sm font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
              <CloudRain size={16} /> Weather Integration
            </label>
            <div className="space-y-4">
              <input 
                type="text" 
                value={settings.weather.apiKey}
                onChange={(e) => updateWeatherSettings({ apiKey: e.target.value })}
                className="w-full bg-black/20 border border-white/10 rounded-xl px-5 py-4 outline-none focus:ring-2 focus:ring-white/20 transition-all text-lg"
                placeholder="OpenWeatherMap API Key..."
              />
              <input 
                type="text" 
                value={settings.weather.city}
                onChange={(e) => updateWeatherSettings({ city: e.target.value })}
                className="w-full bg-black/20 border border-white/10 rounded-xl px-5 py-4 outline-none focus:ring-2 focus:ring-white/20 transition-all text-lg"
                placeholder="City (e.g. London)..."
              />
            </div>
          </div>

          </div>

          {/* Column 2 */}
          <div className="space-y-10">
            {/* Custom CSS */}
            <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
                <Palette size={16} /> Custom CSS
              </label>
              {customCSS && (
                <button 
                  onClick={() => setCustomCSS('')}
                  className="text-xs text-red-400 hover:text-red-300 uppercase font-bold tracking-wider"
                >
                  Reset
                </button>
              )}
            </div>
            <textarea
              value={customCSS || ''}
              onChange={(e) => setCustomCSS(e.target.value)}
              placeholder="/* Example: */&#10;.widget-container { border-radius: 2rem; }&#10;.glass-panel { background: rgba(0,0,0,0.8); }"
              className="w-full h-40 bg-black/40 border border-white/10 rounded-xl p-4 font-mono text-white/80 placeholder:text-white/20 outline-none focus:ring-2 focus:ring-white/20 transition-all resize-none"
            />
          </div>

          {/* Privacy & Layout */}
          <div className="space-y-4 pt-8 border-t border-white/10">
            <button 
              onClick={toggleBlur}
              className="w-full flex items-center justify-between p-5 bg-white/5 hover:bg-white/10 rounded-xl transition-all group"
            >
              <div className="flex items-center gap-3">
                <EyeOff size={20} className="text-white/60 group-hover:text-white" />
                <span className="text-lg">Privacy Blur (Alt+B)</span>
              </div>
              <div className={`w-12 h-6 rounded-full transition-all relative ${isBlurred ? 'bg-blue-500' : 'bg-white/20'}`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isBlurred ? 'left-7' : 'left-1'}`} />
              </div>
            </button>

            <button 
              onClick={resetLayout}
              className="w-full flex items-center gap-3 p-5 bg-white/5 hover:bg-white/10 rounded-xl transition-all text-left text-white/80"
            >
              <Layout size={20} className="text-white/60" />
              <span className="text-lg">Reset Layout Positions</span>
            </button>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};
