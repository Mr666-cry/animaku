import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface WatchHistoryItem {
  slug: string;
  title: string;
  poster: string;
  episodeSlug: string;
  episodeTitle: string;
  timestamp: number;
}

export interface FavoriteItem {
  slug: string;
  title: string;
  poster: string;
  type?: string;
  status?: string;
  rating?: string;
  episodeCount?: number;
  timestamp: number;
}

interface AnimeStore {
  watchHistory: WatchHistoryItem[];
  favorites: FavoriteItem[];
  addToWatchHistory: (item: Omit<WatchHistoryItem, 'timestamp'>) => void;
  removeFromWatchHistory: (slug: string, episodeSlug: string) => void;
  clearWatchHistory: () => void;
  addToFavorites: (item: Omit<FavoriteItem, 'timestamp'>) => void;
  removeFromFavorites: (slug: string) => void;
  clearFavorites: () => void;
  isFavorite: (slug: string) => boolean;
}

export const useAnimeStore = create<AnimeStore>()(
  persist(
    (set, get) => ({
      watchHistory: [],
      favorites: [],

      addToWatchHistory: (item) => {
        set((state) => {
          const filtered = state.watchHistory.filter(
            (h) => !(h.slug === item.slug && h.episodeSlug === item.episodeSlug)
          );
          return {
            watchHistory: [{ ...item, timestamp: Date.now() }, ...filtered].slice(0, 100),
          };
        });
      },

      removeFromWatchHistory: (slug, episodeSlug) => {
        set((state) => ({
          watchHistory: state.watchHistory.filter(
            (h) => !(h.slug === slug && h.episodeSlug === episodeSlug)
          ),
        }));
      },

      clearWatchHistory: () => set({ watchHistory: [] }),

      addToFavorites: (item) => {
        set((state) => {
          if (state.favorites.some((f) => f.slug === item.slug)) {
            return state;
          }
          return {
            favorites: [{ ...item, timestamp: Date.now() }, ...state.favorites],
          };
        });
      },

      removeFromFavorites: (slug) => {
        set((state) => ({
          favorites: state.favorites.filter((f) => f.slug !== slug),
        }));
      },

      clearFavorites: () => set({ favorites: [] }),

      isFavorite: (slug) => {
        return get().favorites.some((f) => f.slug === slug);
      },
    }),
    {
      name: 'anime-stream-storage',
    }
  )
);
