import React, { useState, useEffect } from 'react';
import { useWidgetStore } from '../../../store/widgetStore';
import { SpotifyService } from '../../../lib/spotify';
import { WidgetContainer } from '../../layout/WidgetContainer';
import { useViewStore } from '../../../store/viewStore';
import { Play, Pause, SkipBack, SkipForward, Music, Settings as SettingsIcon } from 'lucide-react';
import { useSpotify } from '../../../hooks/useSpotify';

export const Spotify: React.FC = () => {
  const { spotifyToken, spotifyTrack, updateSpotifyTrack } = useWidgetStore();
  const { setActiveView } = useViewStore();
  const { resumePlayback } = useSpotify(); // No polling here, Dashboard handles it
  const [localProgress, setLocalProgress] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);

  // Sync local progress with the polled track data
  useEffect(() => {
    if (spotifyTrack && !isDragging) {
      setLocalProgress(spotifyTrack.progress_ms);
    }
  }, [spotifyTrack, isDragging]);

  // Local interpolation for smooth progress bar
  useEffect(() => {
    let interval: number | null = null;
    
    if (spotifyTrack?.isPlaying && !isDragging) {
      interval = window.setInterval(() => {
        setLocalProgress(prev => {
          const next = prev + 100;
          return next > (spotifyTrack?.duration_ms || 0) ? (spotifyTrack?.duration_ms || 0) : next;
        });
      }, 100);
    }

    return () => {
      if (interval) window.clearInterval(interval);
    };
  }, [spotifyTrack?.isPlaying, spotifyTrack?.duration_ms, isDragging]);

  const handleAction = async (action: 'play' | 'pause' | 'next' | 'previous') => {
    if (!spotifyToken) return;
    try {
      if (action === 'play' && !spotifyTrack?.isPlaying) {
        await resumePlayback();
        return;
      }
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

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsDragging(true);
    setLocalProgress(parseInt(e.target.value));
  };

  const handleSeekCommit = async (e: React.MouseEvent<HTMLInputElement> | React.TouchEvent<HTMLInputElement>) => {
    const val = parseInt((e.target as HTMLInputElement).value);
    setIsDragging(false);
    setLocalProgress(val);
    
    if (!spotifyToken || !spotifyTrack) return;
    try {
      await SpotifyService.seek(spotifyToken, val);
    } catch (error) {
      console.error('Spotify seek error:', error);
    }
  };

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!spotifyToken) {
    return (
      <WidgetContainer className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
        <Music size={32} className="text-theme-muted mb-4" />
        <h3 className="text-lg font-bold text-theme-text mb-2">Spotify Not Connected</h3>
        <p className="text-sm text-theme-muted mb-6 leading-relaxed">
          Please connect your Spotify account in the settings to see your music.
        </p>
        <button 
          onClick={() => setActiveView('settings')}
          className="flex items-center gap-2 px-6 py-3 bg-theme-glass hover:bg-theme-hover text-theme-text transition-all rounded-xl text-sm font-bold tracking-wider uppercase"
        >
          <SettingsIcon size={16} /> Go to Settings
        </button>
      </WidgetContainer>
    );
  }

  if (!spotifyTrack) {
    return (
      <WidgetContainer className="flex flex-col items-center justify-center p-8 space-y-4">
        <Music size={40} className="text-theme-muted animate-pulse" />
        <p className="text-sm text-theme-muted">No active session</p>
        <button 
          onClick={async () => {
            const track = await SpotifyService.getCurrentlyPlaying(spotifyToken);
            if (track) updateSpotifyTrack(track);
          }}
          className="text-[10px] font-bold uppercase tracking-widest text-theme-text bg-theme-glass px-4 py-2 rounded-lg hover:bg-theme-hover transition-all"
        >
          Refresh State
        </button>
      </WidgetContainer>
    );
  }

  if (!spotifyTrack.isPlaying && spotifyTrack.uri) {
    return (
      <WidgetContainer className="group relative overflow-hidden p-0 min-h-[140px] flex flex-col">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20 blur-2xl scale-110"
          style={{ backgroundImage: `url(${spotifyTrack.albumArt})` }}
        />
        <div className="relative z-10 flex flex-col items-center justify-center h-full p-6 text-center">
          <div className="relative mb-4">
            <img src={spotifyTrack.albumArt} className="w-16 h-16 rounded-lg shadow-2xl opacity-50" />
            <button 
              onClick={resumePlayback}
              className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/20 rounded-lg transition-all group/play"
            >
              <Play size={24} fill="white" className="text-white group-hover/play:scale-125 transition-transform" />
            </button>
          </div>
          <h4 className="font-bold text-theme-text text-sm truncate w-full px-4">{spotifyTrack.name}</h4>
          <p className="text-theme-muted text-[10px] uppercase tracking-widest mb-4">Ready to Resume</p>
          <button 
            onClick={resumePlayback}
            className="bg-theme-text text-theme-contrast px-6 py-2 rounded-full font-bold text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl"
          >
            Play on this Device
          </button>
        </div>
      </WidgetContainer>
    );
  }

  const progressPercent = (localProgress / spotifyTrack.duration_ms) * 100;

  return (
    <WidgetContainer className="group relative overflow-hidden p-0 min-h-[140px] flex flex-col">
      {/* Background Album Art Blur */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-20 blur-2xl scale-110"
        style={{ backgroundImage: `url(${spotifyTrack.albumArt})` }}
      />
      
      <div className="relative z-10 flex items-center p-4 w-full gap-4">
        {/* Album Art */}
        <div className="relative flex-shrink-0">
          <img 
            src={spotifyTrack.albumArt} 
            alt={spotifyTrack.name}
            className="w-20 h-20 rounded-lg shadow-2xl transition-transform duration-500 group-hover:scale-105"
          />
          {spotifyTrack.isPlaying && (
            <div className="absolute -bottom-1 -right-1 bg-theme-bg-accent rounded-full p-1.5 shadow-lg">
              <div className="flex gap-0.5 items-end h-3 w-3">
                {[1, 2, 3].map(i => (
                  <div 
                    key={i}
                    className="w-1 bg-theme-contrast animate-music-bar"
                    style={{ animationDelay: `${i * 0.2}s` }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Track Info & Controls */}
        <div className="flex-grow min-w-0">
          <h4 className="font-bold text-theme-text truncate text-lg leading-tight">{spotifyTrack.name}</h4>
          <p className="text-theme-muted truncate text-sm mb-3">{spotifyTrack.artist}</p>

          {/* Controls */}
          <div className="flex items-center gap-5">
            <button onClick={() => handleAction('previous')} className="text-theme-muted hover:text-theme-text transition-all hover:scale-110">
              <SkipBack size={18} fill="currentColor" />
            </button>
            
            <button 
              onClick={() => handleAction(spotifyTrack.isPlaying ? 'pause' : 'play')}
              className="bg-theme-text text-theme-contrast p-2.5 rounded-full hover:scale-110 transition-all shadow-xl active:scale-95"
            >
              {spotifyTrack.isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
            </button>

            <button onClick={() => handleAction('next')} className="text-theme-muted hover:text-theme-text transition-all hover:scale-110">
              <SkipForward size={18} fill="currentColor" />
            </button>
          </div>
        </div>
      </div>

      {/* Progress Section */}
      <div className="relative z-10 px-4 pb-4 w-full">
        <div className="flex justify-between text-[10px] font-bold text-theme-muted mb-1.5 uppercase tracking-tighter">
          <span>{formatTime(localProgress)}</span>
          <span>{formatTime(spotifyTrack.duration_ms)}</span>
        </div>
        <div className="relative h-1.5 w-full bg-theme-border rounded-full overflow-hidden group/slider">
          {/* Visual Progress Fill */}
          <div 
            className="absolute top-0 left-0 h-full bg-theme-text transition-[width] duration-300 ease-linear rounded-full pointer-events-none"
            style={{ width: `${progressPercent}%` }}
          />
          {/* Interactive Range Input */}
          <input 
            type="range"
            min={0}
            max={spotifyTrack.duration_ms}
            value={localProgress}
            onChange={handleSeekChange}
            onMouseDown={() => setIsDragging(true)}
            onTouchStart={() => setIsDragging(true)}
            onMouseUp={handleSeekCommit}
            onTouchEnd={handleSeekCommit}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>
      </div>
    </WidgetContainer>
  );
};
