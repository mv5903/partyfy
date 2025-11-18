import { create } from 'zustand';
import { UserProfile } from '@auth0/nextjs-auth0/client';
import { Users } from '@prisma/client';
import PartyfyUser from '@/helpers/PartyfyUser';
import { SpotifyAuth } from '@/helpers/SpotifyAuth';

interface UserState {
  // Current user data
  partyfyUser: PartyfyUser | null;
  dbUser: Users | null;
  spotifyAuth: SpotifyAuth | null;

  // Cache management
  lastFetch: number | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  initializeUser: (auth0User: UserProfile, spotifyCode?: string) => Promise<boolean>;
  refetchUser: () => Promise<void>;
  clearUser: () => void;
  shouldRefetch: () => boolean;
}

// Cache validity: 60 seconds
const CACHE_DURATION = 60 * 1000;

export const useUserStore = create<UserState>((set, get) => ({
  partyfyUser: null,
  dbUser: null,
  spotifyAuth: null,
  lastFetch: null,
  isLoading: false,
  error: null,

  shouldRefetch: () => {
    const { lastFetch } = get();
    if (!lastFetch) return true;
    return Date.now() - lastFetch > CACHE_DURATION;
  },

  initializeUser: async (auth0User: UserProfile, spotifyCode?: string) => {
    const { partyfyUser, lastFetch, shouldRefetch } = get();

    // Return cached data if still fresh AND we're not processing an OAuth callback
    if (partyfyUser && !shouldRefetch() && !spotifyCode) {
      console.log('[UserStore] Using cached user data');
      return !!partyfyUser.spotifyAuth;
    }

    console.log('[UserStore] Fetching fresh user data' + (spotifyCode ? ' (processing OAuth callback with code)' : ''));
    set({ isLoading: true, error: null });

    try {
      const user = new PartyfyUser(auth0User);
      const hasSpotifyAuth = await user.fillUserInfoFromDB(spotifyCode);

      set({
        partyfyUser: user,
        dbUser: user.db,
        spotifyAuth: user.spotifyAuth,
        lastFetch: Date.now(),
        isLoading: false,
      });

      return hasSpotifyAuth;
    } catch (error) {
      console.error('[UserStore] Error initializing user:', error);
      set({ error: error.message, isLoading: false });
      return false;
    }
  },

  refetchUser: async () => {
    const { partyfyUser } = get();
    if (!partyfyUser) return;

    console.log('[UserStore] Refetching user data');
    set({ isLoading: true });

    try {
      await partyfyUser.refetchUser();
      set({
        dbUser: partyfyUser.db,
        lastFetch: Date.now(),
        isLoading: false,
      });
    } catch (error) {
      console.error('[UserStore] Error refetching user:', error);
      set({ error: error.message, isLoading: false });
    }
  },

  clearUser: () => {
    set({
      partyfyUser: null,
      dbUser: null,
      spotifyAuth: null,
      lastFetch: null,
      isLoading: false,
      error: null,
    });
  },
}));
