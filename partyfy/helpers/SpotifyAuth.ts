export class SpotifyAuth {
    accessToken: string = null;
    refreshToken: string;
    lastRefresh: Date;

    constructor(refreshToken: string) {
        this.lastRefresh = new Date();
        if (refreshToken === '' || refreshToken === undefined) return;
        this.refreshToken = refreshToken;
    }

    async refreshAccessToken() {
        if (this.refreshToken === '' || this.refreshToken === undefined) return;
        await fetch('/api/spotify/refreshaccesstoken?refresh_token=' + this.refreshToken)
            .then(res => res.json())
            .then(data => {
                if (data.access_token) {
                    this.accessToken = data.access_token;
                    this.lastRefresh = new Date();
                }
            });
    }

    async getRefreshToken(authorizationCode: string) {
        if (authorizationCode === '') return;
        console.log('[SpotifyAuth] Exchanging authorization code for refresh token...');
        let returnedData = null;
        const redirectUri = window.location.origin;
        console.log('[SpotifyAuth] Using redirect URI:', redirectUri);
        await fetch('/api/spotify/refreshtoken?code=' + authorizationCode + '&redirect_uri=' + encodeURIComponent(redirectUri))
            .then(res => res.json())
            .then(data => {
                if (data.error) {
                    console.error('[SpotifyAuth] Error response from /refreshtoken endpoint:', data);
                    return;
                }
                console.log('[SpotifyAuth] Received data from /refreshtoken endpoint:', data);
                if (data.refresh_token) {
                    this.accessToken = data.access_token;
                    this.refreshToken = data.refresh_token;
                    returnedData = data;
                }
            })
            .catch(err => {
                console.error('[SpotifyAuth] Error exchanging authorization code for refresh token:', err);
                return;
            });
        if (returnedData) {
            console.log('[SpotifyAuth] Successfully obtained refresh token from Spotify', returnedData);
            this.lastRefresh = new Date();
            return returnedData;
        }
    }

    async getAccessToken() {
        if (this.lastRefresh === undefined) this.lastRefresh = new Date();
        if (this.accessToken == null || this.accessToken == undefined) await this.refreshAccessToken();
        var hoursDifference = Math.abs(new Date().getTime() - this.lastRefresh.getTime()) / 36e5;
        // If time difference is approaching 1 hour, refresh the access token
        if (hoursDifference >= 0.9) {
            await this.refreshAccessToken();
        }
        return this.accessToken;
    }
}