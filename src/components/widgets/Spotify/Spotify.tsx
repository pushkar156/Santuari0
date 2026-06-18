import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useWidgetStore } from '../../../store/widgetStore';
import { SpotifyService } from '../../../lib/spotify';
import { useViewStore } from '../../../store/viewStore';
import { Play, Pause, SkipBack, SkipForward, Music, Settings as SettingsIcon, ListMusic, Search, Loader2, X } from 'lucide-react';
import { useSpotify } from '../../../hooks/useSpotify';

export const Spotify: React.FC = () => {
  const { spotifyToken, spotifyTrack, updateSpotifyTrack } = useWidgetStore();
  const { setActiveView } = useViewStore();
  const { resumePlayback } = useSpotify(); // No polling here, Dashboard handles it
  const [localProgress, setLocalProgress] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);

  // Expanded panel states
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'playlists' | 'search'>('playlists');
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingPlaylists, setIsLoadingPlaylists] = useState(false);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  // Selected playlist and songs states
  const [selectedPlaylist, setSelectedPlaylist] = useState<any | null>(null);
  const [playlistTracks, setPlaylistTracks] = useState<any[]>([]);
  const [isLoadingTracks, setIsLoadingTracks] = useState(false);

  // Auto-clear toast messages after 3 seconds
  useEffect(() => {
    if (toastMsg) {
      const timer = setTimeout(() => {
        setToastMsg('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMsg]);

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

  // Load playlists when expanded and playlists tab is active
  const loadPlaylists = async () => {
    if (!spotifyToken) return;
    setIsLoadingPlaylists(true);
    setErrorMsg('');
    try {
      const data = await SpotifyService.getUserPlaylists(spotifyToken);
      console.log('Playlists loaded:', data.length);
      // Debug: check what keys the first playlist has for track count
      if (data.length > 0) {
        console.log('First playlist keys:', Object.keys(data[0]));
        console.log('First playlist tracks field:', data[0].tracks);
      }
      setPlaylists(data);
    } catch (err: any) {
      console.error('Error fetching playlists:', err);
      setErrorMsg(err.message || 'Failed to load playlists. Try reconnecting Spotify.');
    } finally {
      setIsLoadingPlaylists(false);
    }
  };

  useEffect(() => {
    if (isExpanded && activeTab === 'playlists' && playlists.length === 0) {
      loadPlaylists();
    }
  }, [isExpanded, activeTab]);

  // Load songs inside a selected playlist
  const loadPlaylistTracks = async (playlist: any) => {
    if (!spotifyToken) return;
    setSelectedPlaylist(playlist);
    setIsLoadingTracks(true);
    setErrorMsg('');
    try {
      console.log('Fetching tracks for playlist:', playlist.name, 'ID:', playlist.id);
      const data = await SpotifyService.getPlaylistTracks(spotifyToken, playlist.id);
      console.log('Playlist tracks API response data:', data);
      // Spotify /items endpoint returns track data under 'item' key (not 'track')
      const validTracks = data
        .map((entry: any) => {
          if (!entry) return null;
          // Handle both API formats: 'item' (new /items endpoint) or 'track' (legacy)
          const track = entry.item || entry.track || entry;
          if (!track || !track.name || !track.uri) return null;
          return track;
        })
        .filter(Boolean);
      console.log('Valid playlist tracks:', validTracks.length);
      setPlaylistTracks(validTracks);
    } catch (err: any) {
      console.error('Error fetching playlist tracks:', err);
      const msg = err.message || '';
      if (msg.includes('403') || msg.toLowerCase().includes('forbidden')) {
        setErrorMsg("This is a followed playlist. Spotify restricts third-party apps from reading tracks of playlists you do not own, but you can still play it by clicking the 'Play Playlist' button above.");
      } else {
        setErrorMsg(msg || 'Failed to load songs inside playlist.');
      }
    } finally {
      setIsLoadingTracks(false);
    }
  };

  const addTrackToQueue = async (uri: string, name: string) => {
    if (!spotifyToken) return;
    try {
      const devices = await SpotifyService.getDevices(spotifyToken);
      console.log('Spotify devices list:', devices);
      const activeDevice = devices.find((d: any) => d.is_active);
      const laptopDevice = devices.find((d: any) => d.type.toLowerCase() === 'computer') || devices[0];
      const targetDevice = activeDevice || laptopDevice;

      if (!targetDevice) {
        alert('No active Spotify devices found. Please open Spotify on your phone/computer first.');
        return;
      }

      console.log(`Adding track to queue on device "${targetDevice.name}": ${name} (${uri})`);
      await SpotifyService.addToQueue(spotifyToken, uri, targetDevice.id);
      setToastMsg(`Added "${name}" to queue`);
    } catch (err: any) {
      console.error('Queue error:', err);
      setErrorMsg(err.message || 'Failed to add track to queue. Make sure Spotify is open on your device.');
    }
  };

  // Explicit manual search
  const triggerManualSearch = async () => {
    if (!spotifyToken) return;
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    setIsLoadingSearch(true);
    setErrorMsg('');
    try {
      const data = await SpotifyService.searchTracks(spotifyToken, searchQuery);
      setSearchResults(data);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Search failed. Try reconnecting Spotify.');
    } finally {
      setIsLoadingSearch(false);
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      triggerManualSearch();
    }
  };

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

  const playTrackOrPlaylist = async (options: { context_uri?: string; uris?: string[]; offset?: { uri: string } }) => {
    if (!spotifyToken) return;
    try {
      const devices = await SpotifyService.getDevices(spotifyToken);
      const activeDevice = devices.find((d: any) => d.is_active);
      const laptopDevice = devices.find((d: any) => d.type.toLowerCase() === 'computer') || devices[0];
      const targetDevice = activeDevice || laptopDevice;

      if (!targetDevice) {
        alert('No active Spotify devices found. Please open Spotify on your phone/computer first.');
        return;
      }

      await SpotifyService.play(spotifyToken, options, targetDevice.id);

      setTimeout(async () => {
        const track = await SpotifyService.getCurrentlyPlaying(spotifyToken);
        updateSpotifyTrack(track);
      }, 600);
    } catch (err: any) {
      console.error('Play error:', err);
      setErrorMsg(err.message || 'Playback failed. Make sure Spotify is open on your device.');
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
      <div className="theme-glass w-full h-full min-h-[180px] flex flex-col items-center justify-center p-8 text-center">
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
      </div>
    );
  }

  const renderTabsAndLists = () => {
    return (
      <div className="flex-grow flex flex-col overflow-hidden border-t border-theme-border/50 relative z-10 bg-black/10">
        {/* Tab Headers */}
        <div className="flex border-b border-theme-border/30 shrink-0">
          <button
            onClick={() => setActiveTab('playlists')}
            className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'playlists' 
                ? 'text-theme-text bg-theme-hover/20 border-b-2 border-theme-text' 
                : 'text-theme-muted hover:text-theme-text hover:bg-theme-hover/10'
            }`}
          >
            <ListMusic size={12} /> Playlists
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'search' 
                ? 'text-theme-text bg-theme-hover/20 border-b-2 border-theme-text' 
                : 'text-theme-muted hover:text-theme-text hover:bg-theme-hover/10'
            }`}
          >
            <Search size={12} /> Search
          </button>
        </div>

        {/* Scrollable Container */}
        <div className="flex-grow overflow-y-auto custom-scrollbar-thin p-3 space-y-2">
          {errorMsg && !selectedPlaylist && (
            <p className="text-[10px] text-red-400 text-center py-2 bg-red-500/10 rounded-lg">{errorMsg}</p>
          )}

          {activeTab === 'playlists' && (
            <>
              {selectedPlaylist ? (
                <div className="space-y-3">
                  {/* Playlist Songs Navigation Header */}
                  <div className="flex items-center justify-between shrink-0">
                    <button
                      onClick={() => {
                        setSelectedPlaylist(null);
                        setPlaylistTracks([]);
                      }}
                      className="flex items-center gap-1 text-[10px] text-theme-muted hover:text-theme-text uppercase tracking-widest font-bold transition-all"
                    >
                      &larr; Back to Playlists
                    </button>
                    <button
                      onClick={() => playTrackOrPlaylist({ context_uri: selectedPlaylist.uri })}
                      className="px-3 py-1 bg-theme-bg-accent text-theme-contrast rounded-lg text-[9px] font-bold uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow"
                    >
                      Play Playlist
                    </button>
                  </div>

                  {/* Info Header */}
                  <div className="flex items-center gap-3 p-2 bg-theme-hover/10 rounded-xl border border-theme-border/20">
                    {selectedPlaylist.images && selectedPlaylist.images[0] ? (
                      <img 
                        src={selectedPlaylist.images[0].url} 
                        alt={selectedPlaylist.name} 
                        className="w-10 h-10 rounded object-cover shadow shrink-0" 
                      />
                    ) : (
                      <div className="w-10 h-10 rounded bg-theme-border/30 flex items-center justify-center shrink-0">
                        <Music size={16} className="text-theme-muted" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <h4 className="font-bold text-theme-text text-sm truncate">{selectedPlaylist.name}</h4>
                      <p className="text-theme-muted text-[10px]">
                        {selectedPlaylist.tracks?.total ?? selectedPlaylist.items?.total ?? selectedPlaylist.items?.length ?? 0} songs
                      </p>
                    </div>
                  </div>

                  {errorMsg && (
                    <p className={`text-[10px] text-center py-2.5 px-3 rounded-xl border leading-relaxed ${
                      errorMsg.includes('followed playlist') 
                        ? 'text-theme-muted bg-theme-hover/5 border-theme-border/20' 
                        : 'text-red-400 bg-red-500/10 border-red-500/20'
                    }`}>
                      {errorMsg}
                    </p>
                  )}

                  {/* Songs list */}
                  {isLoadingTracks ? (
                    <div className="flex flex-col items-center justify-center py-10 space-y-2">
                      <Loader2 className="animate-spin text-theme-muted" size={20} />
                      <span className="text-[9px] text-theme-muted uppercase tracking-widest">Loading Songs...</span>
                    </div>
                  ) : playlistTracks.length === 0 && !errorMsg ? (
                    <div className="text-center py-8">
                      <p className="text-xs text-theme-muted">No songs inside this playlist.</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {playlistTracks.map((item: any, idx: number) => {
                        // Items are already unwrapped track objects from the filter
                        const track = item;
                        if (!track) return null;
                        return (
                          <button
                            key={`${track.id || idx}-${idx}`}
                            onClick={() => playTrackOrPlaylist({ 
                              context_uri: selectedPlaylist.uri, 
                              offset: { uri: track.uri } 
                            })}
                            className="w-full flex items-center gap-3 p-1.5 rounded-lg hover:bg-theme-hover/20 transition-all text-left group/item"
                          >
                            {track.album?.images && track.album.images[0] ? (
                              <img 
                                src={track.album.images[0].url} 
                                alt={track.name} 
                                className="w-7 h-7 rounded object-cover shadow shrink-0" 
                              />
                            ) : (
                              <div className="w-7 h-7 rounded bg-theme-border/30 flex items-center justify-center shrink-0">
                                <Music size={10} className="text-theme-muted" />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <h5 className="font-bold text-theme-text text-xs truncate group-hover/item:text-theme-bg-accent transition-colors">
                                {track.name}
                              </h5>
                              <p className="text-theme-muted text-[9px] truncate">
                                {track.artists ? track.artists.map((a: any) => a.name).join(', ') : 'Unknown Artist'}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                /* Playlists Grid View */
                <>
                  {isLoadingPlaylists ? (
                    <div className="flex flex-col items-center justify-center py-12 space-y-2">
                      <Loader2 className="animate-spin text-theme-muted" size={20} />
                      <span className="text-[9px] text-theme-muted uppercase tracking-widest">Loading Playlists...</span>
                    </div>
                  ) : playlists.length === 0 && !errorMsg ? (
                    <div className="text-center py-8">
                      <p className="text-xs text-theme-muted">No playlists found.</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {playlists.map((playlist: any) => (
                        <button
                          key={playlist.id}
                          onClick={() => loadPlaylistTracks(playlist)}
                          className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-theme-hover/20 transition-all text-left group/item"
                        >
                          {playlist.images && playlist.images[0] ? (
                            <img 
                              src={playlist.images[0].url} 
                              alt={playlist.name} 
                              className="w-8 h-8 rounded object-cover shadow shrink-0" 
                            />
                          ) : (
                            <div className="w-8 h-8 rounded bg-theme-border/30 flex items-center justify-center shrink-0">
                              <Music size={12} className="text-theme-muted" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <h5 className="font-bold text-theme-text text-xs truncate group-hover/item:text-theme-bg-accent transition-colors">
                              {playlist.name}
                            </h5>
                            <p className="text-theme-muted text-[9px] truncate">
                              {playlist.tracks?.total ?? playlist.items?.total ?? playlist.items?.length ?? 0} songs
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {activeTab === 'search' && (
            <div className="flex flex-col h-full space-y-2">
              {/* Search Input */}
              <div className="relative shrink-0">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Search songs... (press Enter)"
                  className="w-full bg-theme-glass border border-theme-border/60 rounded-xl px-3 py-1.5 pr-8 text-xs text-theme-text placeholder-theme-muted outline-none focus:border-theme-text transition-all"
                />
                <button 
                  onClick={triggerManualSearch}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-theme-muted hover:text-theme-text transition-colors"
                >
                  <Search size={12} />
                </button>
              </div>

              {/* Search Results */}
              <div className="flex-1 space-y-1">
                {isLoadingSearch ? (
                  <div className="flex flex-col items-center justify-center py-8 space-y-2">
                    <Loader2 className="animate-spin text-theme-muted" size={16} />
                  </div>
                ) : searchResults.length === 0 && searchQuery ? (
                  <p className="text-center text-xs text-theme-muted py-6">No tracks found.</p>
                ) : !searchQuery ? (
                  <p className="text-center text-[9px] text-theme-muted uppercase tracking-widest py-8">
                    Type and press Enter to search
                  </p>
                ) : (
                  <div className="space-y-1">
                    {searchResults.map((track: any) => (
                      <button
                        key={track.id}
                        onClick={() => addTrackToQueue(track.uri, track.name)}
                        className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-theme-hover/20 transition-all text-left group/item"
                      >
                        {track.album?.images && track.album.images[0] ? (
                          <img 
                            src={track.album.images[0].url} 
                            alt={track.name} 
                            className="w-8 h-8 rounded object-cover shadow shrink-0" 
                          />
                        ) : (
                          <div className="w-8 h-8 rounded bg-theme-border/30 flex items-center justify-center shrink-0">
                            <Music size={12} className="text-theme-muted" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <h5 className="font-bold text-theme-text text-xs truncate group-hover/item:text-theme-bg-accent transition-colors">
                            {track.name}
                          </h5>
                          <p className="text-theme-muted text-[9px] truncate">
                            {track.artists.map((a: any) => a.name).join(', ')}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderPlayerContent = (isExpandedMode: boolean) => {
    // Background Album Art Blur (REMOVED layoutId here to reduce heavy GPU blurring projection lag)
    const backgroundBlur = spotifyTrack?.albumArt && (
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-20 blur-2xl scale-110 pointer-events-none"
        style={{ backgroundImage: `url(${spotifyTrack.albumArt})` }}
      />
    );

    if (!spotifyTrack) {
      return (
        <div className="relative w-full h-full flex flex-col justify-between p-4">
          {backgroundBlur}
          <div className="relative z-10 flex items-center gap-4 w-full">
            <motion.div 
              layoutId="spotify-art-container"
              className="relative flex-shrink-0 w-20 h-20 rounded-lg bg-theme-border/20 flex items-center justify-center border border-theme-border/30"
            >
              <Music size={32} className="text-theme-muted" />
            </motion.div>
            <div className="flex-grow min-w-0">
              <motion.h4 layoutId="spotify-track-name" className="font-bold text-theme-text truncate text-base leading-tight">No active session</motion.h4>
              <motion.p layoutId="spotify-artist-name" className="text-theme-muted truncate text-xs mb-3">Expand to choose music</motion.p>
              {!isExpandedMode && (
                <button 
                  onClick={() => setIsExpanded(true)} 
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-theme-glass hover:bg-theme-hover border border-theme-border rounded-lg text-[10px] font-bold uppercase tracking-widest text-theme-text transition-all"
                >
                  <ListMusic size={12} /> Playlists & Search
                </button>
              )}
            </div>
            {isExpandedMode && (
              <button 
                onClick={() => setIsExpanded(false)}
                className="absolute right-0 top-0 p-1.5 rounded-full hover:bg-theme-hover text-theme-muted hover:text-theme-text transition-colors"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {isExpandedMode && renderTabsAndLists()}
        </div>
      );
    }

    // Ready to resume view when collapsed
    if (!spotifyTrack.isPlaying && spotifyTrack.uri && !isExpandedMode) {
      return (
        <div className="relative z-10 flex flex-col items-center justify-center h-full p-6 text-center w-full">
          {backgroundBlur}
          <motion.div layoutId="spotify-art-container" className="relative mb-3">
            <motion.img 
              layoutId="spotify-art"
              src={spotifyTrack.albumArt} 
              className="w-16 h-16 rounded-lg shadow-2xl opacity-50" 
            />
            <button 
              onClick={resumePlayback}
              className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/20 rounded-lg transition-all"
            >
              <Play size={20} fill="white" className="text-white scale-100 hover:scale-110 transition-transform" />
            </button>
          </motion.div>
          <motion.h4 layoutId="spotify-track-name" className="font-bold text-theme-text text-sm truncate w-full px-4">{spotifyTrack.name}</motion.h4>
          <motion.p layoutId="spotify-artist-name" className="text-theme-muted text-[10px] uppercase tracking-widest mb-3">Ready to Resume</motion.p>
          
          {/* REMOVED layoutId from controls in ready to resume */}
          <div className="flex items-center gap-3">
            <button 
              onClick={resumePlayback}
              className="bg-theme-text text-theme-contrast px-5 py-1.5 rounded-full font-bold text-[9px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-md"
            >
              Resume Playback
            </button>
            <button 
              onClick={() => setIsExpanded(true)}
              className="p-1.5 rounded-full hover:bg-theme-hover text-theme-muted hover:text-theme-text transition-all"
              title="Open playlists & search"
            >
              <ListMusic size={16} />
            </button>
          </div>
        </div>
      );
    }

    // Normal active player view
    const progressPercent = (localProgress / spotifyTrack.duration_ms) * 100;

    return (
      <div className="relative w-full h-full flex flex-col justify-between overflow-hidden">
        {backgroundBlur}
        
        {/* Top Info & Controls Row */}
        <div className="relative z-10 flex items-center p-4 w-full gap-4 shrink-0">
          {/* Album Art Container with layoutId */}
          <motion.div layoutId="spotify-art-container" className="relative flex-shrink-0">
            <motion.img 
              layoutId="spotify-art"
              src={spotifyTrack.albumArt} 
              alt={spotifyTrack.name}
              className="w-20 h-20 rounded-lg shadow-2xl"
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
          </motion.div>

          {/* Track Info & Controls */}
          <div className="flex-grow min-w-0">
            <div className="flex items-center justify-between pr-6">
              <motion.h4 layoutId="spotify-track-name" className="font-bold text-theme-text truncate text-base leading-tight max-w-[150px]">{spotifyTrack.name}</motion.h4>
              {isExpandedMode && (
                <button 
                  onClick={() => setIsExpanded(false)}
                  className="p-1 rounded-full hover:bg-theme-hover text-theme-muted hover:text-theme-text transition-colors absolute right-4 top-4"
                  title="Close expanded player"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            <motion.p layoutId="spotify-artist-name" className="text-theme-muted truncate text-xs mb-3">{spotifyTrack.artist}</motion.p>

            {/* Controls Row (REMOVED layoutId to simplify GPU calculations) */}
            <div className="flex items-center gap-4">
              <button onClick={() => handleAction('previous')} className="text-theme-muted hover:text-theme-text transition-all hover:scale-110">
                <SkipBack size={16} fill="currentColor" />
              </button>
              
              <button 
                onClick={() => handleAction(spotifyTrack.isPlaying ? 'pause' : 'play')}
                className="bg-theme-text text-theme-contrast p-2 rounded-full hover:scale-110 transition-all shadow-xl active:scale-95"
              >
                {spotifyTrack.isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
              </button>

              <button onClick={() => handleAction('next')} className="text-theme-muted hover:text-theme-text transition-all hover:scale-110">
                <SkipForward size={16} fill="currentColor" />
              </button>

              <button 
                onClick={() => setIsExpanded(!isExpanded)} 
                className={`p-1.5 rounded-full hover:bg-theme-hover transition-all ${isExpandedMode ? 'text-theme-bg-accent bg-theme-hover/20' : 'text-theme-muted hover:text-theme-text'}`}
                title={isExpandedMode ? "Collapse Player" : "Expand Player"}
              >
                <ListMusic size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Progress Section (REMOVED layoutId to prevent slider projection stutter) */}
        <div className="relative z-10 px-4 pb-3 w-full shrink-0">
          <div className="flex justify-between text-[9px] font-bold text-theme-muted mb-1 uppercase tracking-tighter">
            <span>{formatTime(localProgress)}</span>
            <span>{formatTime(spotifyTrack.duration_ms)}</span>
          </div>
          <div className="relative h-1 w-full bg-theme-border rounded-full overflow-hidden group/slider">
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

        {isExpandedMode && renderTabsAndLists()}
      </div>
    );
  };

  const renderExpandedPortal = () => {
    if (typeof document === 'undefined') return null;

    return createPortal(
      <AnimatePresence>
        {isExpanded && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop with lightweight Blur for high rendering speed */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
              onClick={() => setIsExpanded(false)}
              transition={{ duration: 0.15, ease: 'easeInOut' }}
            />

            {/* Centered Expanded Spotify Card */}
            <motion.div
              layoutId="spotify-player-card"
              className="relative w-full max-w-lg h-[460px] bg-theme-glass/40 backdrop-blur-3xl overflow-hidden flex flex-col shadow-2xl z-10 border border-white/20"
              style={{ borderRadius: '2rem' }}
              transition={{ type: 'spring', damping: 26, stiffness: 260, mass: 0.8 }}
            >
              {renderPlayerContent(true)}

              {/* Toast Message inside the card */}
              <AnimatePresence>
                {toastMsg && (
                  <motion.div
                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -15, scale: 0.95 }}
                    className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/90 text-white px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-2xl border border-white/10 z-[110] whitespace-nowrap flex items-center gap-1.5 pointer-events-none"
                  >
                    <Music size={10} className="text-theme-bg-accent animate-bounce" />
                    {toastMsg}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        )}
      </AnimatePresence>,
      document.body
    );
  };

  return (
    <>
      {/* Sidebar View */}
      {isExpanded ? (
        <div className="w-full h-[180px] opacity-25 bg-theme-glass backdrop-blur-2xl border border-theme-border rounded-2xl relative overflow-hidden flex flex-col justify-center items-center pointer-events-none">
          <Music size={24} className="text-theme-muted animate-pulse" />
        </div>
      ) : (
        <motion.div
          layoutId="spotify-player-card"
          className="bg-theme-glass backdrop-blur-2xl border border-theme-border rounded-2xl shadow-xl group relative overflow-hidden p-0 min-h-[180px] flex flex-col cursor-pointer"
          style={{ borderRadius: '1rem' }}
          onClick={(e) => {
            const target = e.target as HTMLElement;
            if (!target.closest('button') && !target.closest('input')) {
              setIsExpanded(true);
            }
          }}
          transition={{ type: 'spring', damping: 26, stiffness: 260, mass: 0.8 }}
        >
          {renderPlayerContent(false)}
        </motion.div>
      )}

      {/* Expanded Modal View via Portal */}
      {renderExpandedPortal()}
    </>
  );
};
