import { useEffect, useRef } from 'react';
import { useWidgetStore } from '../store/widgetStore';
import { SpotifyService } from '../lib/spotify';

export const useSpotify = (autoPoll = false) => {
  const { 
    spotifyToken, 
    spotifyRefreshToken, 
    spotifyClientId, 
    spotifyTrack, 
    updateSpotifyTrack, 
    setSpotifyToken, 
    setSpotifyRefreshToken 
  } = useWidgetStore();
  const pollTimer = useRef<number | null>(null);

  const fetchTrack = async () => {
    if (!spotifyToken) return;

    try {
      console.log('Polling Spotify...');
      const track = await SpotifyService.getCurrentlyPlaying(spotifyToken);
      
      // Preserve progress if track matches and API returns 0 (idle session fallback)
      if (track && spotifyTrack && track.uri === spotifyTrack.uri && track.progress_ms === 0 && spotifyTrack.progress_ms > 0) {
        track.progress_ms = spotifyTrack.progress_ms;
      }
      
      updateSpotifyTrack(track);
    } catch (error: any) {
      console.error('Spotify poll error:', error);
      if (error?.status === 401 && spotifyRefreshToken && spotifyClientId) {
        try {
          const tokens = await SpotifyService.refreshAccessToken(spotifyClientId, spotifyRefreshToken);
          setSpotifyToken(tokens.accessToken);
          if (tokens.refreshToken) {
            setSpotifyRefreshToken(tokens.refreshToken);
          }
          // Retry fetch with new token
          const track = await SpotifyService.getCurrentlyPlaying(tokens.accessToken);
          updateSpotifyTrack(track);
        } catch (refreshError) {
          console.error('Failed to refresh Spotify token:', refreshError);
          // If refresh fails, then we might need to clear it, but user wanted it to stay
          // Maybe just leave it and let user re-connect manually if refresh fails
        }
      }
    }
  };

  const resumePlayback = async () => {
    if (!spotifyToken) return;

    try {
      console.log('Attempting to resume playback...');
      const devices = await SpotifyService.getDevices(spotifyToken);
      console.log('Available devices:', devices);

      if (devices.length === 0) {
        console.warn('No Spotify devices found.');
        return;
      }

      // Find an active device or a computer
      const activeDevice = devices.find((d: any) => d.is_active);
      const laptopDevice = devices.find((d: any) => d.type.toLowerCase() === 'computer') || devices[0];
      
      const targetDevice = activeDevice || laptopDevice;

      if (!targetDevice) return;

      console.log('Targeting device:', targetDevice.name);

      // Fetch the last played track to get URI and progress
      const apiTrack = await SpotifyService.getCurrentlyPlaying(spotifyToken);
      
      if (apiTrack && apiTrack.uri) {
        // If the API returns 0 progress (common for idle sessions), 
        // try to use our stored progress if the track is the same
        const resumeProgress = (spotifyTrack && apiTrack.uri === spotifyTrack.uri && apiTrack.progress_ms === 0)
          ? spotifyTrack.progress_ms
          : apiTrack.progress_ms;

        console.log('Resuming track:', apiTrack.name, 'at', resumeProgress, 'ms');
        
        // Transfer and play
        await SpotifyService.transferPlayback(spotifyToken, targetDevice.id, true);
        
        // If it was recently played (not active), we might need to specifically play the URI
        if (!apiTrack.isPlaying) {
          await SpotifyService.controlPlayback(
            spotifyToken, 
            'play', 
            targetDevice.id, 
            [apiTrack.uri], 
            resumeProgress
          );
        }
        
        // Update local state
        await fetchTrack();
      }
    } catch (error: any) {
      console.error('Failed to resume Spotify playback:', error);
      if (error?.status === 401 && spotifyRefreshToken && spotifyClientId) {
        try {
          const tokens = await SpotifyService.refreshAccessToken(spotifyClientId, spotifyRefreshToken);
          setSpotifyToken(tokens.accessToken);
          if (tokens.refreshToken) {
            setSpotifyRefreshToken(tokens.refreshToken);
          }
          // Retry resume with new token
          await resumePlayback(); 
        } catch (refreshError) {
          console.error('Failed to refresh Spotify token during resume:', refreshError);
        }
      }
    }
  };

  useEffect(() => {
    if (!autoPoll) return;

    if (spotifyToken) {
      fetchTrack(); // Initial fetch

      pollTimer.current = window.setInterval(fetchTrack, 3000); // Poll every 3s
    } else {
      if (pollTimer.current) {
        window.clearInterval(pollTimer.current);
      }
    }

    return () => {
      if (pollTimer.current) {
        window.clearInterval(pollTimer.current);
      }
    };
  }, [spotifyToken, autoPoll]);

  return { fetchTrack, resumePlayback };
};
