const LOCAL_CONSTANTS = {
    SPOTIFY_CLIENT_ID : '56b011ba0994424ea55cd9f2205c6439',
    SPOTIFY_REDIRECT_URL : process.env.SPOTIFY_REDIRECT_URL || 'https://partyfy-mv5903.vercel.app/',
    SPOTIFY_API_URI : 'http://localhost:8080/',
    SPOTIFY_SCOPES : 'user-read-playback-state user-read-private user-read-email',
}

export const CONSTANTS = {
    SPOTIFY_AUTH_URL : 'https://accounts.spotify.com/authorize' +
            '?response_type=code' +
            '&client_id=' + LOCAL_CONSTANTS.SPOTIFY_CLIENT_ID +
            (LOCAL_CONSTANTS.SPOTIFY_SCOPES ? '&scope=' + encodeURIComponent(LOCAL_CONSTANTS.SPOTIFY_SCOPES) : '') +
            '&redirect_uri=' + encodeURIComponent(LOCAL_CONSTANTS.SPOTIFY_REDIRECT_URL)
}