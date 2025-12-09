import { OAuthRedirect } from '@/helpers/OAuthRedirect';

const LOCAL_CONSTANTS = {
    SPOTIFY_CLIENT_ID : '56b011ba0994424ea55cd9f2205c6439',
    SPOTIFY_API_URI : 'http://localhost:8080/',
    SPOTIFY_SCOPES : 'user-modify-playback-state user-read-playback-state playlist-read-private playlist-read-collaborative user-library-read',
}

/**
 * Gets the Spotify OAuth URL with dynamic redirect based on current origin
 */
function getSpotifyAuthUrl(): string {
    return OAuthRedirect.getSpotifyAuthUrl(
        LOCAL_CONSTANTS.SPOTIFY_CLIENT_ID,
        LOCAL_CONSTANTS.SPOTIFY_SCOPES
    );
}

export const CONSTANTS = {
    SPOTIFY_CLIENT_ID: LOCAL_CONSTANTS.SPOTIFY_CLIENT_ID,
    SPOTIFY_SCOPES: LOCAL_CONSTANTS.SPOTIFY_SCOPES,
    // This is a getter function to ensure it always uses the current/stored origin
    get SPOTIFY_AUTH_URL() {
        return getSpotifyAuthUrl();
    },
}