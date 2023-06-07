import { UserProfile } from "@auth0/nextjs-auth0/client";

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

/**
 * Extracts a user's ID based on their OAuth profile. This may appear differently, depending on if they signed up with email or Google.
 * ```js
 * // Google Account
 * user.sub
 * // Email Account
 * user.user_id
 * ```
 * @param user User to extract ID from
 * @returns A string containing the user's ID
 */
export function getUserID(user: UserProfile) : string {
    return user.sub as string ?? user.user_id as string;
}