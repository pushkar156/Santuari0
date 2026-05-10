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
  const failCount = useRef<number>(0);

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
      failCount.current = 0; // Reset on success
    } catch (error: any) {
      console.error('Spotify poll error:', error);
      
      // Check for 401 status (token expired)
      const is401 = error?.status === 401 || error?.message?.includes('401') || error?.message?.includes('expired');
      
      if (is401 && spotifyRefreshToken && spotifyClientId) {
        try {
          const tokens = await SpotifyService.refreshAccessToken(spotifyClientId, spotifyRefreshToken);
          setSpotifyToken(tokens.accessToken);
          if (tokens.refreshToken) {
            setSpotifyRefreshToken(tokens.refreshToken);
          }
          failCount.current = 0;
          // Retry fetch with new token
          const track = await SpotifyService.getCurrentlyPlaying(tokens.accessToken);
          updateSpotifyTrack(track);
        } catch (refreshError) {
          console.error('Failed to refresh Spotify token:', refreshError);
          failCount.current++;
        }
      } else if (is401) {
        failCount.current++;
      }
      
      // After 3 consecutive failures, stop polling and clear token
      if (failCount.current >= 3) {
        console.warn('Spotify: Too many auth failures, clearing token. Please reconnect.');
        setSpotifyToken(null);
        if (pollTimer.current) {
          window.clearInterval(pollTimer.current);
          pollTimer.current = null;
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
