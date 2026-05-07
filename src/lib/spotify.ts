const SPOTIFY_SCOPES = [
  'user-read-currently-playing',
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-recently-played'
];

export class SpotifyService {
  private static getRedirectUri() {
    return chrome.identity.getRedirectURL();
  }

  // Generate a random string for the code verifier
  private static generateRandomString(length: number) {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const values = crypto.getRandomValues(new Uint8Array(length));
    return Array.from(values).map((x) => possible[x % possible.length]).join('');
  }

  // SHA-256 hashing for PKCE
  private static async sha256(plain: string) {
    const encoder = new TextEncoder();
    const data = encoder.encode(plain);
    return crypto.subtle.digest('SHA-256', data);
  }

  private static base64encode(input: ArrayBuffer) {
    return btoa(String.fromCharCode(...new Uint8Array(input)))
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  }

  static async login(clientId: string): Promise<{ accessToken: string; refreshToken: string }> {
    const redirectUri = this.getRedirectUri();
    const codeVerifier = this.generateRandomString(64);
    const hashed = await this.sha256(codeVerifier);
    const codeChallenge = this.base64encode(hashed);

    // Store verifier for later exchange
    await chrome.storage.local.set({ spotify_code_verifier: codeVerifier });

    const scope = SPOTIFY_SCOPES.join(' ');
    const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&code_challenge_method=S256&code_challenge=${codeChallenge}`;

    console.log('Redirect URI:', redirectUri);

    return new Promise((resolve, reject) => {
      chrome.identity.launchWebAuthFlow({
        url: authUrl,
        interactive: true
      }, async (redirectUrl) => {
        if (chrome.runtime.lastError || !redirectUrl) {
          reject(chrome.runtime.lastError || new Error('No redirect URL'));
          return;
        }

        const url = new URL(redirectUrl);
        const code = url.searchParams.get('code');

        if (!code) {
          reject(new Error('No code found in response'));
          return;
        }

        // Exchange code for token
        try {
          const tokens = await this.exchangeCodeForToken(clientId, code, codeVerifier, redirectUri);
          resolve(tokens);
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  private static async exchangeCodeForToken(clientId: string, code: string, codeVerifier: string, redirectUri: string): Promise<{ accessToken: string; refreshToken: string }> {
    console.log('Exchanging code for token...');
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
        code_verifier: codeVerifier,
      }),
    });

    const data = await response.json();
    console.log('Exchange response:', data);

    if (data.access_token) {
      console.log('Token received successfully (starts with):', data.access_token.substring(0, 10));
      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token || '',
      };
    } else {
      console.error('Exchange error:', data);
      throw new Error(data.error_description || 'Failed to exchange code for token');
    }
  }

  static async refreshAccessToken(clientId: string, refreshToken: string): Promise<{ accessToken: string; refreshToken?: string }> {
    console.log('Refreshing Spotify access token...');
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    const data = await response.json();
    console.log('Refresh response:', data);

    if (data.access_token) {
      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token, // Some APIs might return a new refresh token
      };
    } else {
      console.error('Refresh error:', data);
      throw new Error(data.error_description || 'Failed to refresh access token');
    }
  }

  static async getCurrentlyPlaying(token: string) {
    // Try to get full playback state first (includes paused sessions on other devices)
    const response = await fetch('https://api.spotify.com/v1/me/player', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.status === 401) {
      const err: any = new Error('Spotify token expired or invalid');
      err.status = 401;
      throw err;
    }

    if (response.status === 204) {
      // No active session, fallback to recently played
      return this.getRecentlyPlayed(token);
    }

    if (response.status > 400) return null;

    const data = await response.json();
    if (!data.item) return this.getRecentlyPlayed(token);

    return {
      name: data.item.name,
      artist: data.item.artists[0].name,
      albumArt: data.item.album.images[0].url,
      isPlaying: data.is_playing,
      progress_ms: data.progress_ms,
      duration_ms: data.item.duration_ms,
      uri: data.item.uri,
      deviceId: data.device?.id
    };
  }

  static async getRecentlyPlayed(token: string) {
    try {
      const response = await fetch('https://api.spotify.com/v1/me/player/recently-played?limit=1', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 403) {
        console.warn('Recently played permission (user-read-recently-played) missing.');
        return null;
      }

      if (response.status !== 200) return null;

      const data = await response.json();
      if (!data.items || data.items.length === 0) return null;

      const track = data.items[0].track;
      return {
        name: track.name,
        artist: track.artists[0].name,
        albumArt: track.album.images[0].url,
        isPlaying: false,
        progress_ms: 0,
        duration_ms: track.duration_ms,
        uri: track.uri
      };
    } catch (e) {
      return null;
    }
  }

  static async getDevices(token: string) {
    const response = await fetch('https://api.spotify.com/v1/me/player/devices', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.status !== 200) return [];
    const data = await response.json();
    return data.devices || [];
  }

  static async transferPlayback(token: string, deviceId: string, play: boolean = true) {
    await fetch('https://api.spotify.com/v1/me/player', {
      method: 'PUT',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ device_ids: [deviceId], play })
    });
  }

  static async controlPlayback(token: string, action: 'play' | 'pause' | 'next' | 'previous', deviceId?: string, uris?: string[], positionMs?: number) {
    const method = (action === 'next' || action === 'previous') ? 'POST' : 'PUT';
    const endpoint = action === 'play' ? 'play' : action === 'pause' ? 'pause' : action === 'next' ? 'next' : 'previous';
    
    const url = new URL(`https://api.spotify.com/v1/me/player/${endpoint}`);
    if (deviceId) url.searchParams.set('device_id', deviceId);

    const body: any = {};
    if (action === 'play' && uris) {
      body.uris = uris;
      if (positionMs) body.position_ms = positionMs;
    }

    await fetch(url.toString(), {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        ...(action === 'play' && uris ? { 'Content-Type': 'application/json' } : {})
      },
      ...(action === 'play' && uris ? { body: JSON.stringify(body) } : {})
    });
  }

  static async seek(token: string, positionMs: number) {
    await fetch(`https://api.spotify.com/v1/me/player/seek?position_ms=${Math.floor(positionMs)}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  }
}
