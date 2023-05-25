export class SpotifyAuth {
    accessToken: string;
    refreshToken: string;
    authorizationCode: string;
    initialized: boolean = false;

    constructor(code: string) {
        this.accessToken = '';
        this.refreshToken = '';
        this.authorizationCode = code;
        if (code !== '') {
            this.initialized = true;
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
}