export default class SpotifyAuth_Backend {
    static async getAnAccessToken(refreshToken: string) {
        let authorization = 'Basic ' + Buffer.from(process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET).toString('base64');
        const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Authorization": authorization
            },
            body: new URLSearchParams({
                'grant_type': 'refresh_token',
                'refresh_token': refreshToken
            })
        });
        const data = await response.json();
        if (data && data.access_token) {
            return data.access_token;
        }
    }
}