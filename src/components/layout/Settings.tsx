import { useState } from 'react';
import { useWidgetStore } from '../../store/widgetStore';
import { Settings as SettingsIcon, X, User, Palette, EyeOff, Layout, Music } from 'lucide-react';
import { SpotifyService } from '../../lib/spotify';

export const Settings = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { 
    userName, setUserName, 
    theme, setTheme, 
    isBlurred, toggleBlur, 
    resetLayout,
    spotifyToken, setSpotifyToken,
    spotifyClientId, setSpotifyClientId
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
    <>
      {/* Floating Settings Button */}
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 left-8 p-3 rounded-full theme-glass hover:bg-white/20 transition-all z-50 shadow-lg"
      >
        <SettingsIcon size={24} />
      </button>

      {/* Settings Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-md theme-glass p-8 relative shadow-2xl">
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-all"
            >
              <X size={20} />
            </button>

            <h2 className="text-2xl font-bold mb-8 flex items-center gap-2">
              <SettingsIcon size={24} /> Settings
            </h2>

            <div className="space-y-8">
              {/* User Name */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-white/60 flex items-center gap-2">
                  <User size={16} /> Display Name
                </label>
                <input 
                  type="text" 
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-white/20 transition-all"
                  placeholder="Enter your name..."
                />
              </div>

              {/* Theme Switcher */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-white/60 flex items-center gap-2">
                  <Palette size={16} /> Theme
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => setTheme('glass')}
                    className={`py-3 rounded-xl border transition-all ${theme === 'glass' ? 'bg-white/20 border-white/40' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                  >
                    Glass
                  </button>
                  <button 
                    onClick={() => setTheme('zen')}
                    className={`py-3 rounded-xl border transition-all ${theme === 'zen' ? 'bg-white/20 border-white/40' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                  >
                    Zen
                  </button>
                </div>
              </div>

              {/* Spotify Integration */}
              <div className="space-y-3 pt-8 border-t border-white/10">
                <label className="text-sm font-medium text-white/60 flex items-center gap-2">
                  <Music size={16} /> Spotify Integration
                </label>
                <div className="space-y-3">
                  <input 
                    type="text" 
                    value={spotifyClientId}
                    onChange={(e) => setSpotifyClientId(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-white/20 transition-all text-sm"
                    placeholder="Enter Spotify Client ID..."
                  />
                  <button 
                    onClick={handleSpotifyConnect}
                    className={`w-full py-3 rounded-xl font-bold transition-all ${spotifyToken ? 'bg-green-500/20 text-green-500 border border-green-500/30' : 'bg-[#1DB954] text-white hover:bg-[#1ed760]'}`}
                  >
                    {spotifyToken ? 'Spotify Connected' : 'Connect Spotify'}
                  </button>
                  <p className="text-[10px] text-white/40">
                    Redirect URI: <span className="select-all">{chrome.identity.getRedirectURL()}</span>
                  </p>
                </div>
              </div>

              {/* Privacy & Layout */}
              <div className="space-y-4 pt-4 border-t border-white/10">
                <button 
                  onClick={toggleBlur}
                  className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <EyeOff size={18} className="text-white/60 group-hover:text-white" />
                    <span>Privacy Blur (Alt+B)</span>
                  </div>
                  <div className={`w-10 h-5 rounded-full transition-all relative ${isBlurred ? 'bg-blue-500' : 'bg-white/20'}`}>
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isBlurred ? 'left-6' : 'left-1'}`} />
                  </div>
                </button>

                <button 
                  onClick={resetLayout}
                  className="w-full flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-all text-left text-white/80"
                >
                  <Layout size={18} className="text-white/60" />
                  <span>Reset Layout Positions</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
