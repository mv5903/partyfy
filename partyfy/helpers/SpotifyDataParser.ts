/**
 * 
 * @param json Artists json from Spotify API
 * @returns Comma seperated list of artists 
 */
export const getArtistList = (artistsJson: any) => artistsJson.map((artist: any) => artist.name).join(', ');