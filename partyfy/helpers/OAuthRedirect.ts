/**
 * Helper class for managing OAuth redirects across different domains
 */
export class OAuthRedirect {
  private static STORAGE_KEY = 'partyfy_oauth_origin';

  /**
   * Store the current origin before OAuth redirect
   */
  static storeOrigin(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.STORAGE_KEY, window.location.origin);
    }
  }

  /**
   * Get the stored origin, or fall back to current origin
   */
  static getStoredOrigin(): string {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(this.STORAGE_KEY) || window.location.origin;
    }
    return '';
  }

  /**
   * Clear the stored origin
   */
  static clearStoredOrigin(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }

  /**
   * Get the Spotify OAuth URL with dynamic redirect
   */
  static getSpotifyAuthUrl(clientId: string, scopes: string): string {
    const redirectUri = this.getStoredOrigin();

    return 'https://accounts.spotify.com/authorize' +
      '?response_type=code' +
      '&client_id=' + clientId +
      (scopes ? '&scope=' + encodeURIComponent(scopes) : '') +
      '&redirect_uri=' + encodeURIComponent(redirectUri) +
      '&show_dialog=true';
  }
}
