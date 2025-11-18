import { create } from 'zustand';
import { Users } from '@prisma/client';

interface FriendRequestsState {
  // Requests data
  incomingRequests: Users[];
  sentRequests: Users[];

  // Cache management
  lastIncomingFetch: number | null;
  lastSentFetch: number | null;
  isLoadingIncoming: boolean;
  isLoadingSent: boolean;

  // Actions
  fetchIncomingRequests: (userId: string, useCached?: boolean) => Promise<void>;
  fetchSentRequests: (userId: string, useCached?: boolean) => Promise<void>;
  shouldRefetchIncoming: () => boolean;
  shouldRefetchSent: () => boolean;
  clearRequests: () => void;
}

// Cache requests for 30 seconds (they update frequently)
const REQUESTS_CACHE_DURATION = 30 * 1000;

export const useFriendRequestsStore = create<FriendRequestsState>((set, get) => ({
  incomingRequests: [],
  sentRequests: [],
  lastIncomingFetch: null,
  lastSentFetch: null,
  isLoadingIncoming: false,
  isLoadingSent: false,

  shouldRefetchIncoming: () => {
    const { lastIncomingFetch } = get();
    if (!lastIncomingFetch) return true;
    return Date.now() - lastIncomingFetch > REQUESTS_CACHE_DURATION;
  },

  shouldRefetchSent: () => {
    const { lastSentFetch } = get();
    if (!lastSentFetch) return true;
    return Date.now() - lastSentFetch > REQUESTS_CACHE_DURATION;
  },

  fetchIncomingRequests: async (userId: string, useCached = true) => {
    const { shouldRefetchIncoming, incomingRequests } = get();

    // Return cached data if still fresh
    if (useCached && incomingRequests.length > 0 && !shouldRefetchIncoming()) {
      console.log('[FriendRequestsStore] Using cached incoming requests');
      return;
    }

    console.log('[FriendRequestsStore] Fetching fresh incoming requests');
    set({ isLoadingIncoming: incomingRequests.length === 0 });

    try {
      const response = await fetch(`/api/database/friends?UserID=${userId}&action=requests`);
      const data = await response.json();

      set({
        incomingRequests: data || [],
        lastIncomingFetch: Date.now(),
        isLoadingIncoming: false,
      });
    } catch (error) {
      console.error('[FriendRequestsStore] Error fetching incoming requests:', error);
      set({ isLoadingIncoming: false });
    }
  },

  fetchSentRequests: async (userId: string, useCached = true) => {
    const { shouldRefetchSent, sentRequests } = get();

    // Return cached data if still fresh
    if (useCached && sentRequests.length > 0 && !shouldRefetchSent()) {
      console.log('[FriendRequestsStore] Using cached sent requests');
      return;
    }

    console.log('[FriendRequestsStore] Fetching fresh sent requests');
    set({ isLoadingSent: sentRequests.length === 0 });

    try {
      const response = await fetch(`/api/database/friends?UserID=${userId}&action=sent`);
      const data = await response.json();

      set({
        sentRequests: data || [],
        lastSentFetch: Date.now(),
        isLoadingSent: false,
      });
    } catch (error) {
      console.error('[FriendRequestsStore] Error fetching sent requests:', error);
      set({ isLoadingSent: false });
    }
  },

  clearRequests: () => {
    set({
      incomingRequests: [],
      sentRequests: [],
      lastIncomingFetch: null,
      lastSentFetch: null,
      isLoadingIncoming: false,
      isLoadingSent: false,
    });
  },
}));
