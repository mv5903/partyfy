/**
 * Converts milliseconds to a human readable time format (mm:ss) used primarily
 * for the duration/elapsed time of a song.
 * @param duration in ms value to convert from
 * @returns string in mm:ss format
 */
export function fancyTimeFormat(duration: number) : string { 
    let date = new Date(duration);
    return `${date.getMinutes()}:${date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds()}`
} 