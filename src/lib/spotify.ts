const SPOTIFY_SCOPES = [
  'user-read-currently-playing',
  'user-read-playback-state',
  'user-modify-playback-state'
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

  static async login(clientId: string): Promise<string> {
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
          const token = await this.exchangeCodeForToken(clientId, code, codeVerifier, redirectUri);
          resolve(token);
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  private static async exchangeCodeForToken(clientId: string, code: string, codeVerifier: string, redirectUri: string): Promise<string> {
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
      return data.access_token;
    } else {
      console.error('Exchange error:', data);
      throw new Error(data.error_description || 'Failed to exchange code for token');
    }
  }

  static async getCurrentlyPlaying(token: string) {
    const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('Spotify API Status:', response.status);

    if (response.status === 401) {
      const err: any = new Error('Spotify token expired or invalid');
      err.status = 401;
      throw err;
    }

    if (response.status === 204 || response.status > 400) {
      return null;
    }

    const data = await response.json();
    if (!data.item) return null;

    return {
      name: data.item.name,
      artist: data.item.artists[0].name,
      albumArt: data.item.album.images[0].url,
      isPlaying: data.is_playing,
      progress_ms: data.progress_ms,
      duration_ms: data.item.duration_ms
    };
  }

  static async controlPlayback(token: string, action: 'play' | 'pause' | 'next' | 'previous') {
    const method = (action === 'next' || action === 'previous') ? 'POST' : 'PUT';
    const endpoint = action === 'play' ? 'play' : action === 'pause' ? 'pause' : action === 'next' ? 'next' : 'previous';
    
    await fetch(`https://api.spotify.com/v1/me/player/${endpoint}`, {
      method,
      headers: {
        'Authorization': `Bearer ${token}`
      }
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
