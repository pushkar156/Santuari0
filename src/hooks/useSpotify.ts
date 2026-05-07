import { useEffect, useRef } from 'react';
import { useWidgetStore } from '../store/widgetStore';
import { SpotifyService } from '../lib/spotify';

export const useSpotify = () => {
  const { spotifyToken, updateSpotifyTrack, setSpotifyToken } = useWidgetStore();
  const pollTimer = useRef<number | null>(null);

  const fetchTrack = async () => {
    if (!spotifyToken) return;

    try {
      console.log('Polling Spotify...');
      const track = await SpotifyService.getCurrentlyPlaying(spotifyToken);
      console.log('Spotify track update:', track);
      updateSpotifyTrack(track);
    } catch (error: any) {
      console.error('Spotify poll error:', error);
      if (error?.status === 401) {
        console.log('Token expired, clearing...');
        setSpotifyToken(null);
      }
    }
  };

  useEffect(() => {
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
  }, [spotifyToken]);

  return { fetchTrack };
};
