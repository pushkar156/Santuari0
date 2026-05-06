import React from 'react';
import { useWidgetStore } from '../../../store/widgetStore';
import { SpotifyService } from '../../../lib/spotify';
import { WidgetContainer } from '../../layout/WidgetContainer';
import { useViewStore } from '../../../store/viewStore';
import { Play, Pause, SkipBack, SkipForward, Music, Settings as SettingsIcon } from 'lucide-react';

export const Spotify: React.FC = () => {
  const { spotifyToken, spotifyTrack, updateSpotifyTrack } = useWidgetStore();
  const { setActiveView } = useViewStore();

  const handleAction = async (action: 'play' | 'pause' | 'next' | 'previous') => {
    if (!spotifyToken) return;
    try {
      await SpotifyService.controlPlayback(spotifyToken, action);
      // Brief delay to let Spotify update its state before we fetch
      setTimeout(async () => {
        const track = await SpotifyService.getCurrentlyPlaying(spotifyToken);
        updateSpotifyTrack(track);
      }, 500);
    } catch (error) {
      console.error('Spotify control error:', error);
    }
  };

  if (!spotifyToken) {
    return (
      <WidgetContainer className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
        <Music size={32} className="text-white/40 mb-4" />
        <h3 className="text-lg font-bold text-white/80 mb-2">Spotify Not Connected</h3>
        <p className="text-sm text-white/60 mb-6 leading-relaxed">
          Please connect your Spotify account in the settings to see your music.
        </p>
        <button 
          onClick={() => setActiveView('settings')}
          className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 transition-all rounded-xl text-sm font-bold tracking-wider uppercase"
        >
          <SettingsIcon size={16} /> Go to Settings
        </button>
      </WidgetContainer>
    );
  }

  if (!spotifyTrack) {
    return (
      <WidgetContainer className="flex flex-col items-center justify-center p-8 space-y-4">
        <Music size={40} className="text-white/40 animate-pulse" />
        <p className="text-sm text-white/60">No music playing</p>
      </WidgetContainer>
    );
  }

  return (
    <WidgetContainer className="group relative overflow-hidden p-0 min-h-[120px] flex items-center">
      {/* Background Album Art Blur */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-20 blur-2xl scale-110"
        style={{ backgroundImage: `url(${spotifyTrack.albumArt})` }}
      />
      
      <div className="relative z-10 flex items-center p-4 w-full gap-4">
        {/* Album Art */}
        <img 
          src={spotifyTrack.albumArt} 
          alt={spotifyTrack.name}
          className="w-20 h-20 rounded-lg shadow-2xl"
        />

        {/* Track Info & Controls */}
        <div className="flex-grow min-w-0">
          <h4 className="font-bold text-white truncate text-lg">{spotifyTrack.name}</h4>
          <p className="text-white/70 truncate text-sm mb-3">{spotifyTrack.artist}</p>

          {/* Controls */}
          <div className="flex items-center gap-6">
            <button onClick={() => handleAction('previous')} className="text-white/60 hover:text-white transition-colors">
              <SkipBack size={20} fill="currentColor" />
            </button>
            
            <button 
              onClick={() => handleAction(spotifyTrack.isPlaying ? 'pause' : 'play')}
              className="bg-white text-black p-2 rounded-full hover:scale-105 transition-all"
            >
              {spotifyTrack.isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
            </button>

            <button onClick={() => handleAction('next')} className="text-white/60 hover:text-white transition-colors">
              <SkipForward size={20} fill="currentColor" />
            </button>
          </div>
        </div>
      </div>
    </WidgetContainer>
  );
};
