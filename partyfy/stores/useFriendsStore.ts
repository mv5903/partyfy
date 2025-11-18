import { create } from 'zustand';
import { Users } from '@prisma/client';

interface FriendWithStatus extends Users {
  isPlaying?: boolean;
  playingData?: any;
}

interface FriendsState {
  // Friends data
  friends: FriendWithStatus[];
  spotifyStatuses: any[];

  // Cache management
  lastFetch: number | null;
  lastStatusCheck: number | null;
  isLoading: boolean;
  isRefreshing: boolean;

  // Actions
  fetchFriends: (userId: string, useCached?: boolean) => Promise<void>;
  updateSpotifyStatuses: (statuses: any[]) => void;
  shouldRefetch: () => boolean;
  shouldRefetchStatuses: () => boolean;
  clearFriends: () => void;
}

// Cache friends list for 60 seconds
const FRIENDS_CACHE_DURATION = 60 * 1000;
// Check Spotify status every 15 seconds (reduced from 10)
const STATUS_CACHE_DURATION = 15 * 1000;

export const useFriendsStore = create<FriendsState>((set, get) => ({
  friends: [],
  spotifyStatuses: [],
  lastFetch: null,
  lastStatusCheck: null,
  isLoading: false,
  isRefreshing: false,

  shouldRefetch: () => {
    const { lastFetch } = get();
    if (!lastFetch) return true;
    return Date.now() - lastFetch > FRIENDS_CACHE_DURATION;
  },

  shouldRefetchStatuses: () => {
    const { lastStatusCheck } = get();
    if (!lastStatusCheck) return true;
    return Date.now() - lastStatusCheck > STATUS_CACHE_DURATION;
  },

  fetchFriends: async (userId: string, useCached = true) => {
    const { shouldRefetch, friends } = get();

    // Return cached data if still fresh
    if (useCached && friends.length > 0 && !shouldRefetch()) {
      console.log('[FriendsStore] Using cached friends list');
      return;
    }

    console.log('[FriendsStore] Fetching fresh friends list');
    set({ isLoading: friends.length === 0, isRefreshing: friends.length > 0 });

    try {
      const response = await fetch('/api/database/friends?UserID=' + userId);
      let data = await response.json();

      // Show users who have functionality enabled first
      data = data.sort((a: any, b: any) => b.UnattendedQueues - a.UnattendedQueues);

      set({
        friends: data,
        lastFetch: Date.now(),
        isLoading: false,
        isRefreshing: false,
      });
    } catch (error) {
      console.error('[FriendsStore] Error fetching friends:', error);
      set({ isLoading: false, isRefreshing: false });
    }
  },

  updateSpotifyStatuses: (statuses: any[]) => {
    set({
      spotifyStatuses: statuses,
      lastStatusCheck: Date.now(),
    });
  },

  clearFriends: () => {
    set({
      friends: [],
      spotifyStatuses: [],
      lastFetch: null,
      lastStatusCheck: null,
      isLoading: false,
      isRefreshing: false,
    });
  },
}));
