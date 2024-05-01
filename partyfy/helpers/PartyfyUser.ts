import { UserProfile } from "@auth0/nextjs-auth0/client";
import { Users } from "@prisma/client";
import { SpotifyAuth } from "./SpotifyAuth";
import Swal from 'sweetalert2/dist/sweetalert2.js';
import { PartyfyProductType } from "./PartyfyProductType";

export default class PartyfyUser {
    /**
     * Auth0 User Object
     */
    auth0: UserProfile;

    /**
     * Database User Object
     */
    db: Users;

    /**
     * Spotify Auth Object
     */
    spotifyAuth: SpotifyAuth;

    constructor(auth0: UserProfile) {
        this.auth0 = auth0;
        this.db = null;
        this.spotifyAuth = null;
    }

    /**
     * Returns the user's ID
     * @returns the user's ID
     */
    getUserID(): string {
        return this.auth0?.sub as string ?? this.auth0.user_id as string;
    }

    /**
     * Gets the product type of the user
     * @returns The {@link PartyfyProductType} product type of the user
     */
    getProductType(): PartyfyProductType {
        if (!this.db) throw new Error('DB user not found or not defined');
        if (this.db.product_type === null || this.db.product_type === 'free') return PartyfyProductType.FREE;
        if (this.db.product_type === 'premium') return PartyfyProductType.PREMIUM;
        if (this.db.product_type === 'commercial') return PartyfyProductType.COMMERCIAL;
    }

    /**
     * Runs every time the user initially logs in, from a useEffect hook
     * @returns true if spotify auth is found and was able to be initialized
     */
    async fillUserInfoFromDB(): Promise<boolean> {
        // There should be an auth0 user at this point
        if (!this.auth0) throw new Error('Auth0 user not found');

        // Get user from db, this function may run again if the user refreshes the page or after authenticating Spotify
        if (!this.db) {
            const response = await fetch('/api/database/users?UserID=' + this.getUserID());
            if (response.status === 500) {
                Swal.fire({
                  title: 'We\'re sorry...',
                  text: 'Our database provider (Supabase) is currently experiencing issues. We apologize for any inconvenience. Please try again later.',
                  icon: 'error',
                  confirmButtonText: 'OK'
                });
                return;
              }
            const data = await response.json();
            if (!data || !data.Username) {
                await this.setUsername();
            } 
            this.db = data as Users;
        }

        // If the user has a refresh token already, create a SpotifyAuth object
        if (this.db && this.db.RefreshToken && this.db.RefreshToken.length > 0) {
            this.spotifyAuth = new SpotifyAuth(this.db.RefreshToken);
            this.spotifyAuth.refreshAccessToken();
            return true;
        }

        // If the user does not have a refresh token, check the url for a code parameter
        if (window.location.search.includes('code')) {
            const urlParams = new URLSearchParams(window.location.search);
            const code = urlParams.get('code');
            if (!code) return false;
            this.spotifyAuth = new SpotifyAuth(null);
            let data = await this.spotifyAuth.getRefreshToken(code);
            if (data && data.access_token && data.refresh_token) {
                this.spotifyAuth.accessToken = data.access_token;
                this.spotifyAuth.refreshToken = data.refresh_token;
                await fetch('/api/database/users', {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        UserID: this.getUserID(),
                        RefreshToken: data.refresh_token
                    })
                });
                window.location.href = window.location.origin;
                return true;
            }
        }

        // Otherwise, user has never attempted to authenticate Spotify
        return false;
    }

    async setUsername(): Promise<boolean> {
        // Push new user to db, if not exists (api handles that)
        await fetch('/api/database/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                UserID: this.getUserID()
            })
        });

        let isReasonDuplicate = false;
        let firstTime = true;
        do {
            let { value: username } = await Swal.fire({
                title: firstTime ? 'Welcome! Please enter a username to get started.' : isReasonDuplicate ? 'Username already taken. Please try again.' : 'Invalid username. Please try again.',
                input: 'text',
                inputLabel: 'Your username. Choose up to 16 characters.',
                inputPlaceholder: 'johndoe24',
                allowOutsideClick: false,
                allowEscapeKey: false
            })
            firstTime = false;

            // If user cancels
            if (!username) {
                isReasonDuplicate = false;
                continue;
            }

            // Check length
            if (username.length < 1 || username.length > 16) {
                isReasonDuplicate = false;
                continue;
            }

            // Check for duplicate
            const response = await fetch('/api/database/username', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    UserID: this.getUserID(),
                    Username: username
                })
            })
            try {
                let data = await response.json();
                if ('duplicate' in data && data.duplicate) {
                    isReasonDuplicate = true;
                    continue;
                }
            } catch (e) {
                isReasonDuplicate = false;
                continue;
            }

            // If we get here, we have a valid username, refetch user
            await this.refetchUser();
            break;

        } while (true);

        return true;
    }

    async refetchUser(): Promise<void> {
        const response = await fetch('/api/database/users?UserID=' + this.getUserID());
        this.db = await response.json() as Users;
    }
}