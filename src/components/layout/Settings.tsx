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
    spotifyClientId, setSpotifyClientId,
    customCSS, setCustomCSS
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
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all text-white/60 hover:text-white backdrop-blur-md border border-white/10 z-50 group"
        title="Settings"
      >
        <SettingsIcon size={24} className="group-hover:rotate-90 transition-transform duration-500" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-zinc-900/90 border border-white/10 w-full max-w-md rounded-3xl p-8 relative shadow-2xl max-h-[90vh] flex flex-col">
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>

            <h2 className="text-2xl font-bold mb-8 flex items-center gap-2">
              <SettingsIcon size={24} /> Settings
            </h2>

            <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar">
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
                <div className="space-y-4">
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

                {/* Custom CSS */}
                <div className="space-y-4 pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-white/60">
                      <Palette size={18} />
                      <span>Custom CSS</span>
                    </div>
                    {customCSS && (
                      <button 
                        onClick={() => setCustomCSS('')}
                        className="text-[10px] text-red-400 hover:text-red-300 uppercase font-bold tracking-wider"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                  <textarea
                    value={customCSS}
                    onChange={(e) => setCustomCSS(e.target.value)}
                    placeholder="/* Example: */&#10;.widget-container { border-radius: 2rem; }&#10;.glass-panel { background: rgba(0,0,0,0.8); }"
                    className="w-full h-32 bg-black/40 border border-white/10 rounded-xl p-3 text-[10px] font-mono text-white/80 placeholder:text-white/20 outline-none focus:ring-2 focus:ring-white/20 transition-all resize-none"
                  />
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
        </div>
      )}
    </>
  );
};
