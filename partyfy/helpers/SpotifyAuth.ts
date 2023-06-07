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
        let returnedData = null;
        await fetch('/api/spotify/refreshtoken?code=' + authorizationCode)
            .then(res => res.json())
            .then(data => {
                if (data.refresh_token) {
                    this.accessToken = data.access_token;
                    this.refreshToken = data.refresh_token;
                    returnedData = data;
                }
            })
            .catch(err => {
                return;
            });
        if (returnedData) {
            this.lastRefresh = new Date();
            return returnedData;
        }
    }

    async getAccessToken() {
        if (this.lastRefresh === undefined) this.lastRefresh = new Date();
        if (this.accessToken == null || this.accessToken == undefined) await this.refreshAccessToken();
        var hoursDifference = Math.abs(new Date().getTime() - this.lastRefresh.getTime()) / 36e5;
        // If time difference is greater than 1 hour, refresh the access token
        if (hoursDifference > 1) {
            await this.refreshAccessToken();
        }
        return this.accessToken;
    }
}