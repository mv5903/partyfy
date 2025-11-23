import { create } from 'zustand';

export type QueueStatus = 'idle' | 'loading' | 'success' | 'error';

interface QueueStatusState {
  status: QueueStatus;
  songName: string | null;

  setLoading: (songName: string) => void;
  setSuccess: (songName: string) => void;
  setError: () => void;
  reset: () => void;
}

export const useQueueStatusStore = create<QueueStatusState>((set) => ({
  status: 'idle',
  songName: null,

  setLoading: (songName: string) => {
    set({ status: 'loading', songName });
  },

  setSuccess: (songName: string) => {
    set({ status: 'success', songName });
    // Auto-reset after 3 seconds
    setTimeout(() => {
      set({ status: 'idle', songName: null });
    }, 3000);
  },

  setError: () => {
    set({ status: 'error' });
    // Auto-reset after 3 seconds
    setTimeout(() => {
      set({ status: 'idle', songName: null });
    }, 3000);
  },

  reset: () => {
    set({ status: 'idle', songName: null });
  },
}));
