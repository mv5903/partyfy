export class SpotifyAuth {
    accessToken: string;
    refreshToken: string;
    authorizationCode: string;
    initialized: boolean = false;
    lastRefresh: Date;

    constructor(code: string) {
        this.accessToken = '';
        this.refreshToken = '';
        this.authorizationCode = code;
        if (code !== '') {
            this.initialized = true;
            this.lastRefresh = new Date();
        }
    }

    async refreshAccessToken() {
        let success = false;
        await fetch('/api/spotify/refreshaccesstoken?refresh_token=' + this.refreshToken)
            .then(res => res.json())
            .then(data => {
                if (data.access_token) {
                    this.accessToken = data.access_token;
                    success = true;
                    this.lastRefresh = new Date();
                    return;
                }
                console.error(data);
            });
        return success;
    }
    async getRefreshToken() {
        let success = false;
        await fetch('/api/spotify/refreshtoken?code=' + this.authorizationCode)
            .then(res => res.json())
            .then(data => {
                if (data.refresh_token) {
                    this.accessToken = data.access_token;
                    this.refreshToken = data.refresh_token;
                    success = true;
                }
            })
            .catch(err => {
                console.error(err);
                return;
            });
        this.authorizationCode = '';
        return success;
    }

    async getAccessToken() {
        var hoursDifference = Math.abs(new Date().getTime() - this.lastRefresh.getTime()) / 36e5;
        if (hoursDifference > 0.9) {
            await this.refreshAccessToken();
        }
        return this.accessToken;
    }
}