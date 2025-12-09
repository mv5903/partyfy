import { create } from 'zustand';

interface Playlist {
  id: string;
  name: string;
  images?: any[];
  tracks?: any;
  [key: string]: any;
}

interface PlaylistTracks {
  [playlistId: string]: any[];
}

interface PlaylistsState {
  // Playlists data
  playlists: Playlist[];
  playlistTracks: PlaylistTracks;

  // Cache management
  lastFetch: number | null;
  tracksFetchTime: { [playlistId: string]: number };
  isLoading: boolean;

  // Actions
  fetchPlaylists: (accessToken: string) => Promise<void>;
  fetchPlaylistTracks: (playlistId: string, accessToken: string) => Promise<void>;
  shouldRefetch: () => boolean;
  shouldRefetchTracks: (playlistId: string) => boolean;
  clearPlaylists: () => void;
}

// Cache playlists for 2 minutes
const PLAYLISTS_CACHE_DURATION = 2 * 60 * 1000;
// Cache playlist tracks for 2 minutes
const TRACKS_CACHE_DURATION = 2 * 60 * 1000;

export const usePlaylistsStore = create<PlaylistsState>((set, get) => ({
  playlists: [],
  playlistTracks: {},
  lastFetch: null,
  tracksFetchTime: {},
  isLoading: false,

  shouldRefetch: () => {
    const { lastFetch } = get();
    if (!lastFetch) return true;
    return Date.now() - lastFetch > PLAYLISTS_CACHE_DURATION;
  },

  shouldRefetchTracks: (playlistId: string) => {
    const { tracksFetchTime } = get();
    const lastFetch = tracksFetchTime[playlistId];
    if (!lastFetch) return true;
    return Date.now() - lastFetch > TRACKS_CACHE_DURATION;
  },

  fetchPlaylists: async (accessToken: string) => {
    const { shouldRefetch, playlists } = get();

    // Return cached data if still fresh
    if (playlists.length > 0 && !shouldRefetch()) {
      console.log('[PlaylistsStore] Using cached playlists');
      return;
    }

    console.log('[PlaylistsStore] Fetching fresh playlists');
    set({ isLoading: true });

    try {
      const response = await fetch(
        `/api/spotify/playlist?action=list&access_token=${accessToken}`
      );
      const data = await response.json();

      set({
        playlists: data.items || [],
        lastFetch: Date.now(),
        isLoading: false,
      });
    } catch (error) {
      console.error('[PlaylistsStore] Error fetching playlists:', error);
      set({ isLoading: false });
    }
  },

  fetchPlaylistTracks: async (playlistId: string, accessToken: string) => {
    const { shouldRefetchTracks, playlistTracks } = get();

    // Return cached data if still fresh
    if (playlistTracks[playlistId] && !shouldRefetchTracks(playlistId)) {
      console.log(`[PlaylistsStore] Using cached tracks for playlist ${playlistId}`);
      return;
    }

    console.log(`[PlaylistsStore] Fetching fresh tracks for playlist ${playlistId}`);

    try {
      const response = await fetch(
        `/api/spotify/playlistsongs?playlistId=${playlistId}&access_token=${accessToken}`
      );
      const data = await response.json();

      set((state) => ({
        playlistTracks: {
          ...state.playlistTracks,
          [playlistId]: data.items || [],
        },
        tracksFetchTime: {
          ...state.tracksFetchTime,
          [playlistId]: Date.now(),
        },
      }));
    } catch (error) {
      console.error(`[PlaylistsStore] Error fetching tracks for playlist ${playlistId}:`, error);
    }
  },

  clearPlaylists: () => {
    set({
      playlists: [],
      playlistTracks: {},
      lastFetch: null,
      tracksFetchTime: {},
      isLoading: false,
    });
  },
}));
