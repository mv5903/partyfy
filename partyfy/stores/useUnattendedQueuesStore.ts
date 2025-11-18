import { create } from 'zustand';

interface UnattendedQueuesState {
  // UQ status data
  isEnabled: boolean | null;

  // Cache management
  lastFetch: number | null;
  isLoading: boolean;

  // Actions
  fetchStatus: (userId: string, useCached?: boolean) => Promise<void>;
  updateStatus: (userId: string, enabled: boolean) => Promise<void>;
  shouldRefetch: () => boolean;
  clearStatus: () => void;
}

// Cache for 30 seconds since this changes infrequently
const CACHE_DURATION = 30 * 1000;

export const useUnattendedQueuesStore = create<UnattendedQueuesState>((set, get) => ({
  isEnabled: null,
  lastFetch: null,
  isLoading: false,

  shouldRefetch: () => {
    const { lastFetch } = get();
    if (!lastFetch) return true;
    return Date.now() - lastFetch > CACHE_DURATION;
  },

  fetchStatus: async (userId: string, useCached = true) => {
    const { shouldRefetch, isEnabled } = get();

    // Return cached data if still fresh
    if (isEnabled !== null && !shouldRefetch() && useCached) {
      console.log('[UQStore] Using cached unattended queues status');
      return;
    }

    console.log('[UQStore] Fetching fresh unattended queues status');
    set({ isLoading: true });

    try {
      const response = await fetch(`/api/database/unattendedqueues?UserID=${userId}`);
      const data = await response.json();

      set({
        isEnabled: data?.UnattendedQueues ?? false,
        lastFetch: Date.now(),
        isLoading: false,
      });
    } catch (error) {
      console.error('[UQStore] Error fetching UQ status:', error);
      set({ isLoading: false });
    }
  },

  updateStatus: async (userId: string, enabled: boolean) => {
    console.log('[UQStore] Updating unattended queues status');
    set({ isLoading: true });

    try {
      await fetch('/api/database/unattendedqueues', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          UserID: userId,
          UnattendedQueues: enabled,
        }),
      });

      // Update cache immediately
      set({
        isEnabled: enabled,
        lastFetch: Date.now(),
        isLoading: false,
      });
    } catch (error) {
      console.error('[UQStore] Error updating UQ status:', error);
      set({ isLoading: false });
    }
  },

  clearStatus: () => {
    set({
      isEnabled: null,
      lastFetch: null,
      isLoading: false,
    });
  },
}));
