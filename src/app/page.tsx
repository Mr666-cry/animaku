"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Home,
  Grid3X3,
  Clock,
  Heart,
  User,
  Play,
  ChevronLeft,
  ChevronRight,
  X,
  Moon,
  Sun,
  Plus,
  Check,
  Film,
  Tv,
  Calendar,
  Clock4,
  ArrowLeft,
  Star,
  ExternalLink,
  Monitor,
  Trash2,
  LogIn,
  LogOut,
  Users,
  Bell,
  Newspaper,
  PieChart,
  Send,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useAnimeStore } from "@/lib/store/anime-store";
import type { 
  OtakudesuAnime, 
  OtakudesuAnimeDetail, 
  OtakudesuEpisode,
  OtakudesuServer,
  Genre,
  EpisodeListItem,
  Server
} from "@/lib/types/anime";
import Image from "next/image";
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

// Types
type TabType = "anime" | "update" | "history" | "favorite" | "developer";

interface NewsItem {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

interface NotificationItem {
  id: string;
  message: string;
  expiresAt: string;
  isActive: boolean;
}

interface VisitorData {
  visitors: { ipAddress: string; createdAt: string; userAgent?: string }[];
  uniqueIPs: number;
  totalVisitors: number;
  visitorsByDay: Record<string, number>;
}

export default function AnimeStreamingApp() {
  const [activeTab, setActiveTab] = useState<TabType>("anime");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchResults, setSearchResults] = useState<OtakudesuAnime[]>([]);
  
  // Home data
  const [ongoingAnime, setOngoingAnime] = useState<OtakudesuAnime[]>([]);
  const [completeAnime, setCompleteAnime] = useState<OtakudesuAnime[]>([]);
  
  // Genres
  const [genres, setGenres] = useState<Genre[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<Genre | null>(null);
  const [genreAnime, setGenreAnime] = useState<OtakudesuAnime[]>([]);
  
  // Anime detail
  const [selectedAnime, setSelectedAnime] = useState<OtakudesuAnimeDetail | null>(null);
  
  // Episode
  const [watchingEpisode, setWatchingEpisode] = useState<{
    anime: OtakudesuAnimeDetail;
    episode: EpisodeListItem;
    servers: Server[];
    streamUrl?: string;
  } | null>(null);
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);
  
  // Pagination
  const [ongoingPage, setOngoingPage] = useState(1);
  const [completePage, setCompletePage] = useState(1);
  const [genrePage, setGenrePage] = useState(1);
  const [hasMoreOngoing, setHasMoreOngoing] = useState(true);
  const [hasMoreComplete, setHasMoreComplete] = useState(true);
  
  // Loading states
  const [loading, setLoading] = useState({
    home: true,
    genres: true,
    search: false,
    detail: false,
    episode: false,
    server: false,
    genre: false,
    moreOngoing: false,
    moreComplete: false,
  });
  
  // Theme
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  
  // Carousel
  const [carouselIndex, setCarouselIndex] = useState(0);
  
  // Delete selection mode
  const [deleteModeHistory, setDeleteModeHistory] = useState(false);
  const [deleteModeFavorite, setDeleteModeFavorite] = useState(false);
  const [selectedToDelete, setSelectedToDelete] = useState<Set<string>>(new Set());
  
  // Admin state
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminError, setAdminError] = useState("");
  
  // Admin data
  const [visitorData, setVisitorData] = useState<VisitorData | null>(null);
  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [notificationList, setNotificationList] = useState<NotificationItem[]>([]);
  
  // News form
  const [newsTitle, setNewsTitle] = useState("");
  const [newsContent, setNewsContent] = useState("");
  
  // Notification form
  const [notificationMessage, setNotificationMessage] = useState("");
  const [notificationDuration, setNotificationDuration] = useState(60); // minutes
  
  // Active notifications for display
  const [activeNotifications, setActiveNotifications] = useState<NotificationItem[]>([]);
  
  const { watchHistory, favorites, addToWatchHistory, addToFavorites, removeFromFavorites, removeFromWatchHistory, isFavorite } = useAnimeStore();

  // Track visitor on mount
  useEffect(() => {
    fetch('/api/visitor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: window.location.pathname }),
    }).catch(() => {});
  }, []);

  // Theme effect
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  // Fetch active notifications periodically
  useEffect(() => {
    const interval = setInterval(fetchActiveNotifications, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, [activeNotifications]);

  // Fetch news on mount and when switching to Update page
  useEffect(() => {
    fetchNewsList();
  }, []);

  // Fetch active notifications periodically
  useEffect(() => {
    const interval = setInterval(fetchActiveNotifications, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Carousel auto-play
  useEffect(() => {
    if (ongoingAnime.length > 0) {
      const interval = setInterval(() => {
        setCarouselIndex((prev) => (prev + 1) % Math.min(5, ongoingAnime.length));
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [ongoingAnime.length]);

  // Check admin auth on mount
  useEffect(() => {
    checkAdminAuth();
  }, []);

  // Fetch anime data on mount
  useEffect(() => {
    fetchHomeData();
    fetchGenres();
    fetchActiveNotifications();
  }, []);

  const checkAdminAuth = async () => {
    try {
      const res = await fetch('/api/admin/check-auth');
      const data = await res.json();
      setIsAdmin(data.authenticated);
    } catch {
      setIsAdmin(false);
    }
  };

  const handleAdminLogin = async () => {
    console.log('Attempting login with:', { username: adminUsername, password: adminPassword ? '***' : 'empty' });
    
    if (!adminUsername.trim() || !adminPassword) {
      setAdminError("Username dan password harus diisi!");
      return;
    }
    
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: adminUsername.trim(), password: adminPassword }),
      });
      
      console.log('Response status:', res.status);
      const data = await res.json();
      console.log('Response data:', data);
      
      if (res.ok && data.success) {
        setIsAdmin(true);
        setShowAdminLogin(false);
        setAdminUsername("");
        setAdminPassword("");
        setAdminError("");
        fetchVisitorData();
        fetchNewsList();
        fetchNotificationList();
      } else {
        setAdminError(data.error || "Username atau password salah!");
      }
    } catch (err) {
      console.error('Login error:', err);
      setAdminError("Terjadi kesalahan!");
    }
  };

  const handleAdminLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    setIsAdmin(false);
  };

  const fetchVisitorData = async () => {
    try {
      const res = await fetch('/api/admin/visitors');
      const data = await res.json();
      setVisitorData(data);
    } catch (error) {
      console.error('Error fetching visitor data:', error);
    }
  };

  const fetchNewsList = async () => {
    try {
      // Use public API so all users can see news
      const res = await fetch('/api/news');
      const data = await res.json();
      setNewsList(data.news || []);
    } catch (error) {
      console.error('Error fetching news:', error);
    }
  };

  const fetchNotificationList = async () => {
    try {
      // Admin only - manage notifications
      const res = await fetch('/api/admin/notifications');
      const data = await res.json();
      setNotificationList(data.notifications || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const fetchActiveNotifications = async () => {
    try {
      // Public - show active notifications to all users
      const res = await fetch('/api/notifications/active');
      const data = await res.json();
      setActiveNotifications(data.notifications || []);
    } catch {
      setActiveNotifications([]);
    }
  };

  const handleAddNews = async () => {
    if (!newsTitle.trim() || !newsContent.trim()) return;
    
    try {
      const res = await fetch('/api/admin/news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newsTitle, content: newsContent }),
      });
      const data = await res.json();
      if (data.news) {
        setNewsList([data.news, ...newsList]);
        setNewsTitle("");
        setNewsContent("");
      }
    } catch (error) {
      console.error('Error adding news:', error);
    }
  };

  const handleDeleteNews = async (id: string) => {
    try {
      await fetch('/api/admin/news', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      setNewsList(newsList.filter(n => n.id !== id));
    } catch (error) {
      console.error('Error deleting news:', error);
    }
  };

  const handleSendNotification = async () => {
    if (!notificationMessage.trim()) return;
    
    const expiresAt = new Date(Date.now() + notificationDuration * 60 * 1000);
    
    try {
      const res = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: notificationMessage, expiresAt: expiresAt.toISOString() }),
      });
      const data = await res.json();
      if (data.notification) {
        setNotificationList([data.notification, ...notificationList]);
        setNotificationMessage("");
        fetchActiveNotifications();
      }
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      await fetch('/api/admin/notifications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      setNotificationList(notificationList.filter(n => n.id !== id));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const fetchHomeData = async () => {
    try {
      const res = await fetch("/api/anime/home");
      const json = await res.json();
      const apiData = json.data || json;
      
      const ongoing = (apiData.ongoing?.animeList || []).map((item: {
        title: string;
        poster: string;
        animeId: string;
        episodes?: number;
        releaseDay?: string;
        score?: string;
      }) => ({
        title: item.title,
        slug: item.animeId,
        poster: item.poster,
        current_episode: item.episodes?.toString(),
        day: item.releaseDay,
        rating: item.score,
      }));
      
      const completed = (apiData.completed?.animeList || []).map((item: {
        title: string;
        poster: string;
        animeId: string;
        episodes?: number;
        score?: string;
      }) => ({
        title: item.title,
        slug: item.animeId,
        poster: item.poster,
        current_episode: item.episodes?.toString(),
        rating: item.score,
        status: "Completed",
      }));
      
      setOngoingAnime(ongoing);
      setCompleteAnime(completed);
    } catch (error) {
      console.error("Error fetching home data:", error);
    } finally {
      setLoading((prev) => ({ ...prev, home: false }));
    }
  };

  const fetchGenres = async () => {
    try {
      const res = await fetch("/api/anime/genres");
      const json = await res.json();
      const genreList = json.data?.genreList || json.genreList || json.genre_list || [];
      
      const mappedGenres = genreList.map((g: {
        title: string;
        genreId?: string;
        slug?: string;
      }) => ({
        title: g.title,
        slug: g.genreId || g.slug,
      }));
      
      setGenres(mappedGenres);
    } catch (error) {
      console.error("Error fetching genres:", error);
    } finally {
      setLoading((prev) => ({ ...prev, genres: false }));
    }
  };

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    
    setLoading((prev) => ({ ...prev, search: true }));
    setShowSearchResults(true);
    
    try {
      const res = await fetch(`/api/anime/search/${encodeURIComponent(searchQuery)}`);
      const json = await res.json();
      const data = json.data || json;
      const results = data.animeList || data.search_result || [];
      
      const mappedResults = results.map((item: {
        title: string;
        poster: string;
        animeId: string;
        episodes?: number;
        score?: string;
        status?: string;
      }) => ({
        title: item.title,
        slug: item.animeId,
        poster: item.poster,
        current_episode: item.episodes?.toString(),
        rating: item.score,
        status: item.status,
      }));
      
      setSearchResults(mappedResults);
    } catch (error) {
      console.error("Error searching:", error);
    } finally {
      setLoading((prev) => ({ ...prev, search: false }));
    }
  }, [searchQuery]);

  const clearSearch = () => {
    setShowSearchResults(false);
    setSearchResults([]);
    setSearchQuery("");
  };

  const fetchAnimeDetail = async (slug: string) => {
    setLoading((prev) => ({ ...prev, detail: true }));
    try {
      const res = await fetch(`/api/anime/detail/${slug}`);
      const json = await res.json();
      const data = json.data || json;
      
      const episodeList = (data.episodeList || data.episode_list || []).map((ep: {
        title: string;
        episodeId?: string;
        slug?: string;
      }) => ({
        title: ep.title,
        slug: ep.episodeId || ep.slug,
      }));
      
      const genreList = (data.genreList || data.genres || []).map((g: {
        title: string;
        genreId?: string;
        slug?: string;
      }) => ({
        title: g.title,
        slug: g.genreId || g.slug,
      }));
      
      const mappedData: OtakudesuAnimeDetail = {
        title: data.title,
        slug: data.animeId || slug,
        poster: data.poster,
        synopsis: typeof data.synopsis === 'string' 
          ? data.synopsis 
          : (data.synopsis?.paragraphs?.join('\n\n') || ''),
        status: data.status,
        type: data.type,
        rating: data.rating,
        score: data.score,
        studio: data.studios || data.studio,
        released: data.released,
        duration: data.duration,
        season: data.season,
        episode_list: episodeList,
        genres: genreList,
      };
      
      setSelectedAnime(mappedData);
    } catch (error) {
      console.error("Error fetching anime detail:", error);
    } finally {
      setLoading((prev) => ({ ...prev, detail: false }));
    }
  };

  const fetchEpisode = async (episodeSlug: string) => {
    if (!selectedAnime) return;
    
    setLoading((prev) => ({ ...prev, episode: true }));
    try {
      const res = await fetch(`/api/anime/episode/${episodeSlug}`);
      const json = await res.json();
      const data = json.data || json;
      
      const episode: EpisodeListItem = {
        title: data.title,
        slug: data.episodeId || episodeSlug,
      };
      
      const servers: Server[] = [];
      const qualities = data.server?.qualities || [];
      
      qualities.forEach((quality: {
        title: string;
        serverList: {
          title: string;
          serverId: string;
        }[];
      }) => {
        quality.serverList.forEach((s) => {
          servers.push({
            name: `${s.title.trim()} (${quality.title})`,
            server_id: s.serverId,
          });
        });
      });
      
      const defaultUrl = data.defaultStreamingUrl;
      
      setWatchingEpisode({
        anime: selectedAnime,
        episode,
        servers: servers,
        streamUrl: defaultUrl || "",
      });
      
      addToWatchHistory({
        slug: selectedAnime.slug,
        title: selectedAnime.title,
        poster: selectedAnime.poster,
        episodeSlug: episodeSlug,
        episodeTitle: data.title,
      });
      
    } catch (error) {
      console.error("Error fetching episode:", error);
    } finally {
      setLoading((prev) => ({ ...prev, episode: false }));
    }
  };

  const handleSelectServer = async (server: Server) => {
    setSelectedServer(server);
    setLoading((prev) => ({ ...prev, server: true }));
    
    try {
      const res = await fetch(`/api/anime/server/${server.server_id}`);
      const json = await res.json();
      const data = json.data || json;
      
      if (watchingEpisode) {
        setWatchingEpisode({
          ...watchingEpisode,
          streamUrl: data.server?.url || data.url || "",
        });
      }
    } catch (error) {
      console.error("Error fetching server URL:", error);
    } finally {
      setLoading((prev) => ({ ...prev, server: false }));
    }
  };

  const fetchGenreAnime = async (genreSlug: string, page: number = 1) => {
    setLoading((prev) => ({ ...prev, genre: true }));
    try {
      const res = await fetch(`/api/anime/genre/${genreSlug}?page=${page}`);
      const json = await res.json();
      const data = json.data || json;
      
      const animeList = (data.animeList || data.anime_list || []).map((item: {
        title: string;
        poster: string;
        animeId: string;
        episodes?: number;
        score?: string;
        status?: string;
      }) => ({
        title: item.title,
        slug: item.animeId,
        poster: item.poster,
        current_episode: item.episodes?.toString(),
        rating: item.score,
        status: item.status,
      }));
      
      if (page === 1) {
        setGenreAnime(animeList);
      } else {
        setGenreAnime((prev) => [...prev, ...animeList]);
      }
      
      setGenrePage(page);
    } catch (error) {
      console.error("Error fetching genre anime:", error);
    } finally {
      setLoading((prev) => ({ ...prev, genre: false }));
    }
  };

  const loadMoreOngoing = async () => {
    setLoading((prev) => ({ ...prev, moreOngoing: true }));
    try {
      const nextPage = ongoingPage + 1;
      const res = await fetch(`/api/anime/ongoing?page=${nextPage}`);
      const json = await res.json();
      const data = json.data || json;
      
      const animeList = (data.animeList || data.anime_list || []).map((item: {
        title: string;
        poster: string;
        animeId: string;
        episodes?: number;
        releaseDay?: string;
        score?: string;
      }) => ({
        title: item.title,
        slug: item.animeId,
        poster: item.poster,
        current_episode: item.episodes?.toString(),
        day: item.releaseDay,
        rating: item.score,
      }));
      
      if (animeList.length > 0) {
        setOngoingAnime((prev) => [...prev, ...animeList]);
        setOngoingPage(nextPage);
      } else {
        setHasMoreOngoing(false);
      }
    } catch (error) {
      console.error("Error loading more ongoing:", error);
    } finally {
      setLoading((prev) => ({ ...prev, moreOngoing: false }));
    }
  };

  const loadMoreComplete = async () => {
    setLoading((prev) => ({ ...prev, moreComplete: true }));
    try {
      const nextPage = completePage + 1;
      const res = await fetch(`/api/anime/complete?page=${nextPage}`);
      const json = await res.json();
      const data = json.data || json;
      
      const animeList = (data.animeList || data.anime_list || []).map((item: {
        title: string;
        poster: string;
        animeId: string;
        episodes?: number;
        score?: string;
      }) => ({
        title: item.title,
        slug: item.animeId,
        poster: item.poster,
        current_episode: item.episodes?.toString(),
        rating: item.score,
        status: "Completed",
      }));
      
      if (animeList.length > 0) {
        setCompleteAnime((prev) => [...prev, ...animeList]);
        setCompletePage(nextPage);
      } else {
        setHasMoreComplete(false);
      }
    } catch (error) {
      console.error("Error loading more complete:", error);
    } finally {
      setLoading((prev) => ({ ...prev, moreComplete: false }));
    }
  };

  const handleAnimeClick = (anime: OtakudesuAnime) => {
    fetchAnimeDetail(anime.slug);
    clearSearch();
  };

  const handleToggleFavorite = (anime: OtakudesuAnimeDetail) => {
    if (isFavorite(anime.slug)) {
      removeFromFavorites(anime.slug);
    } else {
      addToFavorites({
        slug: anime.slug,
        title: anime.title,
        poster: anime.poster,
        type: anime.type,
        status: anime.status,
        rating: anime.rating,
        episodeCount: anime.episode_list?.length,
      });
    }
  };

  const handleGenreClick = (genre: Genre) => {
    setSelectedGenre(genre);
    setGenrePage(1);
    fetchGenreAnime(genre.slug, 1);
  };

  // Anime Card Component
  const AnimeCard = ({ anime }: { anime: OtakudesuAnime }) => (
    <motion.div
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      className="relative group cursor-pointer"
      onClick={() => handleAnimeClick(anime)}
    >
      <div className="relative overflow-hidden rounded-lg bg-zinc-800 aspect-[2/3]">
        <Image
          src={anime.poster}
          alt={anime.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-110"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="absolute bottom-0 left-0 right-0 p-2 transform translate-y-full group-hover:translate-y-0 transition-transform">
          <Button size="sm" className="w-full gap-1 bg-rose-600 hover:bg-rose-700">
            <Play className="w-4 h-4" /> Tonton
          </Button>
        </div>
        {anime.rating && (
          <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm rounded-md px-1.5 py-0.5 flex items-center gap-1">
            <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
            <span className="text-xs font-medium">{anime.rating}</span>
          </div>
        )}
        {anime.status && (
          <div className="absolute top-2 left-2">
            <Badge variant={anime.status.includes("Ongoing") ? "default" : "secondary"} className="text-xs">
              {anime.status.includes("Ongoing") ? "Ongoing" : "Complete"}
            </Badge>
          </div>
        )}
      </div>
      <h3 className="mt-2 text-sm font-medium line-clamp-2 text-zinc-200">
        {anime.title}
      </h3>
      {anime.current_episode && (
        <p className="text-xs text-zinc-400">Episode {anime.current_episode}</p>
      )}
    </motion.div>
  );

  // Skeleton Card
  const SkeletonCard = () => (
    <div className="space-y-2">
      <Skeleton className="aspect-[2/3] rounded-lg" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );

  // Render Notifications Banner
  const renderNotificationsBanner = () => {
    if (activeNotifications.length === 0 || selectedAnime || watchingEpisode) return null;
    
    return (
      <AnimatePresence>
        {activeNotifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="bg-gradient-to-r from-rose-600 to-pink-600 mx-4 mt-4 rounded-lg p-4 shadow-lg"
          >
            <div className="flex items-start gap-3">
              <Bell className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
              <p className="text-white font-medium flex-1">{notification.message}</p>
              <button
                onClick={() => setActiveNotifications(prev => prev.filter(n => n.id !== notification.id))}
                className="text-white/80 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    );
  };

  // Render Home View
  const renderHomeView = () => (
    <div className="space-y-8 pb-20">
      {renderNotificationsBanner()}
      
      {/* Hero Carousel */}
      {ongoingAnime.length > 0 && (
        <div className="relative h-[50vh] md:h-[60vh] overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={carouselIndex}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0"
            >
              <Image
                src={ongoingAnime[carouselIndex].poster}
                alt={ongoingAnime[carouselIndex].title}
                fill
                className="object-cover"
                priority
                unoptimized
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/50 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12">
                <Badge className="mb-2 bg-rose-500">Ongoing</Badge>
                <h1 className="text-2xl md:text-4xl font-bold mb-2 line-clamp-2">
                  {ongoingAnime[carouselIndex].title}
                </h1>
                <div className="flex gap-3 mb-4">
                  {ongoingAnime[carouselIndex].rating && (
                    <span className="flex items-center gap-1 text-yellow-400">
                      <Star className="w-4 h-4 fill-yellow-500" />
                      {ongoingAnime[carouselIndex].rating}
                    </span>
                  )}
                  {ongoingAnime[carouselIndex].current_episode && (
                    <span className="text-zinc-300">Episode {ongoingAnime[carouselIndex].current_episode}</span>
                  )}
                </div>
                <Button
                  className="gap-2 bg-rose-600 hover:bg-rose-700"
                  onClick={() => handleAnimeClick(ongoingAnime[carouselIndex])}
                >
                  <Play className="w-4 h-4" /> Tonton Sekarang
                </Button>
              </div>
            </motion.div>
          </AnimatePresence>
          
          {/* Carousel Navigation */}
          <div className="absolute bottom-4 right-4 flex gap-2">
            <Button
              size="icon"
              variant="ghost"
              className="bg-black/30 hover:bg-black/50"
              onClick={() => setCarouselIndex((prev) => (prev - 1 + Math.min(5, ongoingAnime.length)) % Math.min(5, ongoingAnime.length))}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="bg-black/30 hover:bg-black/50"
              onClick={() => setCarouselIndex((prev) => (prev + 1) % Math.min(5, ongoingAnime.length))}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Carousel Dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1">
            {ongoingAnime.slice(0, 5).map((_, i) => (
              <button
                key={i}
                onClick={() => setCarouselIndex(i)}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === carouselIndex ? "bg-rose-500 w-4" : "bg-white/50"
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Ongoing Anime */}
      <section className="px-4 md:px-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Tv className="w-5 h-5 text-rose-500" /> Anime Ongoing
          </h2>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-4">
          {loading.home
            ? Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)
            : ongoingAnime.map((anime) => <AnimeCard key={anime.slug} anime={anime} />)}
        </div>
        {!loading.home && hasMoreOngoing && (
          <div className="mt-6 text-center">
            <Button 
              variant="outline" 
              onClick={loadMoreOngoing}
              disabled={loading.moreOngoing}
            >
              {loading.moreOngoing ? "Memuat..." : "Lihat Lebih Banyak"}
            </Button>
          </div>
        )}
      </section>

      {/* Complete Anime */}
      <section className="px-4 md:px-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Film className="w-5 h-5 text-rose-500" /> Anime Tamat
          </h2>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-4">
          {loading.home
            ? Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)
            : completeAnime.map((anime) => <AnimeCard key={anime.slug} anime={anime} />)}
        </div>
        {!loading.home && hasMoreComplete && (
          <div className="mt-6 text-center">
            <Button 
              variant="outline" 
              onClick={loadMoreComplete}
              disabled={loading.moreComplete}
            >
              {loading.moreComplete ? "Memuat..." : "Lihat Lebih Banyak"}
            </Button>
          </div>
        )}
      </section>
    </div>
  );

  // Render Update View (for users)
  const renderUpdateView = () => (
    <div className="px-4 md:px-6 py-4 pb-20">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Newspaper className="w-6 h-6 text-rose-500" /> Berita & Update
      </h1>
      
      {newsList.length === 0 ? (
        <div className="text-center py-20">
          <Newspaper className="w-16 h-16 mx-auto text-zinc-600 mb-4" />
          <p className="text-zinc-400">Belum ada berita atau update</p>
        </div>
      ) : (
        <div className="space-y-4">
          {newsList.map((news) => (
            <motion.div
              key={news.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-zinc-800 rounded-lg p-4"
            >
              <h3 className="font-semibold text-lg mb-2">{news.title}</h3>
              <p className="text-zinc-400 text-sm whitespace-pre-wrap">{news.content}</p>
              <p className="text-zinc-500 text-xs mt-3">
                {new Date(news.createdAt).toLocaleDateString("id-ID", {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );

  // Render History View
  const renderHistoryView = () => {
    const toggleSelectForDelete = (key: string) => {
      setSelectedToDelete(prev => {
        const newSet = new Set(prev);
        if (newSet.has(key)) {
          newSet.delete(key);
        } else {
          newSet.add(key);
        }
        return newSet;
      });
    };

    const deleteSelectedHistory = () => {
      selectedToDelete.forEach(key => {
        const [slug, episodeSlug] = key.split('|||');
        removeFromWatchHistory(slug, episodeSlug);
      });
      setSelectedToDelete(new Set());
      setDeleteModeHistory(false);
    };

    return (
      <div className="px-4 md:px-6 py-4 pb-20">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Clock4 className="w-6 h-6 text-rose-500" /> Riwayat Tontonan
          </h1>
          {watchHistory.length > 0 && (
            <div className="flex gap-2">
              {deleteModeHistory ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setDeleteModeHistory(false);
                      setSelectedToDelete(new Set());
                    }}
                  >
                    Batal
                  </Button>
                  {selectedToDelete.size > 0 && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={deleteSelectedHistory}
                    >
                      Hapus ({selectedToDelete.size})
                    </Button>
                  )}
                </>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteModeHistory(true)}
                  className="gap-1"
                >
                  <Trash2 className="w-4 h-4" /> Pilih
                </Button>
              )}
            </div>
          )}
        </div>
        
        {watchHistory.length === 0 ? (
          <div className="text-center py-20">
            <Clock className="w-16 h-16 mx-auto text-zinc-600 mb-4" />
            <p className="text-zinc-400">Belum ada riwayat tontonan</p>
            <p className="text-sm text-zinc-500 mt-2">Mulai menonton anime untuk melihat riwayat di sini</p>
          </div>
        ) : (
          <div className="space-y-3">
            {watchHistory.map((item) => {
              const itemKey = `${item.slug}|||${item.episodeSlug}`;
              const isSelected = selectedToDelete.has(itemKey);
              
              return (
                <motion.div
                  key={`${item.slug}-${item.episodeSlug}-${item.timestamp}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-4 p-3 rounded-lg transition-colors cursor-pointer ${
                    deleteModeHistory 
                      ? isSelected 
                        ? 'bg-rose-900/50 border-2 border-rose-500' 
                        : 'bg-zinc-800 hover:bg-zinc-700'
                      : 'bg-zinc-800 hover:bg-zinc-700'
                  }`}
                  onClick={() => {
                    if (deleteModeHistory) {
                      toggleSelectForDelete(itemKey);
                    } else {
                      fetchAnimeDetail(item.slug);
                    }
                  }}
                >
                  <div className="relative w-20 h-28 flex-shrink-0">
                    <Image
                      src={item.poster}
                      alt={item.title}
                      fill
                      className="object-cover rounded"
                      unoptimized
                    />
                    {deleteModeHistory && (
                      <div className={`absolute inset-0 flex items-center justify-center rounded ${isSelected ? 'bg-rose-500/30' : 'bg-black/30'}`}>
                        {isSelected ? (
                          <Check className="w-8 h-8 text-white" />
                        ) : (
                          <div className="w-6 h-6 rounded-full border-2 border-white/50" />
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium line-clamp-1">{item.title}</h3>
                    <p className="text-sm text-zinc-400 mt-1">{item.episodeTitle}</p>
                    <p className="text-xs text-zinc-500 mt-1">
                      {new Date(item.timestamp).toLocaleDateString("id-ID")}
                    </p>
                  </div>
                  {!deleteModeHistory && (
                    <Button size="sm" className="self-center bg-rose-600 hover:bg-rose-700">
                      <Play className="w-4 h-4" />
                    </Button>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // Render Favorites View
  const renderFavoriteView = () => {
    const toggleSelectForDelete = (slug: string) => {
      setSelectedToDelete(prev => {
        const newSet = new Set(prev);
        if (newSet.has(slug)) {
          newSet.delete(slug);
        } else {
          newSet.add(slug);
        }
        return newSet;
      });
    };

    const deleteSelectedFavorites = () => {
      selectedToDelete.forEach(slug => {
        removeFromFavorites(slug);
      });
      setSelectedToDelete(new Set());
      setDeleteModeFavorite(false);
    };

    return (
      <div className="px-4 md:px-6 py-4 pb-20">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Heart className="w-6 h-6 text-rose-500" /> Anime Favorit
          </h1>
          {favorites.length > 0 && (
            <div className="flex gap-2">
              {deleteModeFavorite ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setDeleteModeFavorite(false);
                      setSelectedToDelete(new Set());
                    }}
                  >
                    Batal
                  </Button>
                  {selectedToDelete.size > 0 && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={deleteSelectedFavorites}
                    >
                      Hapus ({selectedToDelete.size})
                    </Button>
                  )}
                </>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteModeFavorite(true)}
                  className="gap-1"
                >
                  <Trash2 className="w-4 h-4" /> Pilih
                </Button>
              )}
            </div>
          )}
        </div>
        
        {favorites.length === 0 ? (
          <div className="text-center py-20">
            <Heart className="w-16 h-16 mx-auto text-zinc-600 mb-4" />
            <p className="text-zinc-400">Belum ada anime favorit</p>
            <p className="text-sm text-zinc-500 mt-2">Tambahkan anime ke favorit untuk melihatnya di sini</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-4">
            {favorites.map((item) => {
              const isSelected = selectedToDelete.has(item.slug);
              
              return (
                <div key={item.slug} className="relative group">
                  <div
                    className={`cursor-pointer ${deleteModeFavorite && isSelected ? 'ring-2 ring-rose-500 rounded-lg' : ''}`}
                    onClick={() => {
                      if (deleteModeFavorite) {
                        toggleSelectForDelete(item.slug);
                      } else {
                        fetchAnimeDetail(item.slug);
                      }
                    }}
                  >
                    <div className="relative overflow-hidden rounded-lg bg-zinc-800 aspect-[2/3]">
                      <Image
                        src={item.poster}
                        alt={item.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-110"
                        unoptimized
                      />
                      {deleteModeFavorite && (
                        <div className={`absolute inset-0 flex items-center justify-center ${isSelected ? 'bg-rose-500/30' : 'bg-black/30'}`}>
                          {isSelected ? (
                            <Check className="w-8 h-8 text-white" />
                          ) : (
                            <div className="w-6 h-6 rounded-full border-2 border-white/50" />
                          )}
                        </div>
                      )}
                      {!deleteModeFavorite && item.rating && (
                        <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm rounded-md px-1.5 py-0.5 flex items-center gap-1">
                          <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                          <span className="text-xs font-medium">{item.rating}</span>
                        </div>
                      )}
                    </div>
                    <h3 className="mt-2 text-sm font-medium line-clamp-2 text-zinc-200">
                      {item.title}
                    </h3>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // Render Developer View with Admin
  const renderDeveloperView = () => (
    <div className="px-4 md:px-6 py-4 pb-20">
      <div className="max-w-2xl mx-auto">
        {/* Admin Login Button */}
        {!isAdmin && (
          <div className="mb-4 flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdminLogin(true)}
              className="gap-1"
            >
              <LogIn className="w-4 h-4" /> Admin Login
            </Button>
          </div>
        )}
        
        {/* Admin Dashboard */}
        {isAdmin && (
          <div className="mb-6 bg-zinc-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <User className="w-5 h-5 text-rose-500" /> Admin Dashboard
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAdminLogout}
                className="gap-1"
              >
                <LogOut className="w-4 h-4" /> Logout
              </Button>
            </div>
            
            {/* Visitor Stats */}
            <div className="mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchVisitorData}
                className="gap-1 mb-3"
              >
                <Users className="w-4 h-4" /> Lihat Statistik Pengunjung
              </Button>
              
              {visitorData && (
                <div className="bg-zinc-700/50 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-rose-500">{visitorData.totalVisitors}</p>
                      <p className="text-sm text-zinc-400">Total Kunjungan</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-green-500">{visitorData.uniqueIPs}</p>
                      <p className="text-sm text-zinc-400">IP Unik</p>
                    </div>
                  </div>
                  
                  {/* Pie Chart */}
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={[
                            { name: 'IP Unik', value: visitorData.uniqueIPs, color: '#10b981' },
                            { name: 'Pengunjung', value: visitorData.totalVisitors - visitorData.uniqueIPs, color: '#f43f5e' },
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={70}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          <Cell fill="#10b981" />
                          <Cell fill="#f43f5e" />
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {/* Recent Visitors */}
                  <div className="mt-4 max-h-40 overflow-y-auto">
                    <p className="text-sm font-medium mb-2">Pengunjung Terakhir:</p>
                    {visitorData.visitors.slice(0, 5).map((v, i) => (
                      <div key={i} className="text-xs text-zinc-400 flex justify-between py-1">
                        <span className="font-mono">{v.ipAddress}</span>
                        <span>{new Date(v.createdAt).toLocaleString("id-ID")}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Add News */}
            <div className="mb-4">
              <h3 className="font-medium mb-2 flex items-center gap-2">
                <Newspaper className="w-4 h-4" /> Tambah Berita/Update
              </h3>
              <Input
                placeholder="Judul..."
                value={newsTitle}
                onChange={(e) => setNewsTitle(e.target.value)}
                className="mb-2 bg-zinc-700 border-zinc-600"
              />
              <textarea
                placeholder="Isi berita..."
                value={newsContent}
                onChange={(e) => setNewsContent(e.target.value)}
                className="w-full bg-zinc-700 border border-zinc-600 rounded-md p-2 text-sm mb-2 min-h-[80px]"
              />
              <Button onClick={handleAddNews} className="gap-1 w-full">
                <Plus className="w-4 h-4" /> Tambahkan
              </Button>
              
              {/* News List */}
              {newsList.length > 0 && (
                <div className="mt-3 max-h-32 overflow-y-auto space-y-2">
                  {newsList.map((news) => (
                    <div key={news.id} className="bg-zinc-700/50 rounded p-2 flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{news.title}</p>
                        <p className="text-xs text-zinc-400 truncate">{news.content}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteNews(news.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Send Notification */}
            <div>
              <h3 className="font-medium mb-2 flex items-center gap-2">
                <Bell className="w-4 h-4" /> Kirim Notifikasi
              </h3>
              <Input
                placeholder="Pesan notifikasi..."
                value={notificationMessage}
                onChange={(e) => setNotificationMessage(e.target.value)}
                className="mb-2 bg-zinc-700 border-zinc-600"
              />
              <div className="flex gap-2 mb-2">
                <select
                  value={notificationDuration}
                  onChange={(e) => setNotificationDuration(Number(e.target.value))}
                  className="bg-zinc-700 border border-zinc-600 rounded-md p-2 text-sm flex-1"
                >
                  <option value={5}>5 menit</option>
                  <option value={15}>15 menit</option>
                  <option value={30}>30 menit</option>
                  <option value={60}>1 jam</option>
                  <option value={120}>2 jam</option>
                  <option value={360}>6 jam</option>
                  <option value={720}>12 jam</option>
                  <option value={1440}>24 jam</option>
                </select>
                <Button onClick={handleSendNotification} className="gap-1">
                  <Send className="w-4 h-4" /> Kirim
                </Button>
              </div>
              
              {/* Notification List */}
              {notificationList.length > 0 && (
                <div className="max-h-32 overflow-y-auto space-y-2">
                  {notificationList.map((notif) => (
                    <div key={notif.id} className="bg-zinc-700/50 rounded p-2 flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{notif.message}</p>
                        <p className="text-xs text-zinc-400">
                          Sampai: {new Date(notif.expiresAt).toLocaleString("id-ID")}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteNotification(notif.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        
        <div className="bg-zinc-800 rounded-xl overflow-hidden">
          {/* Banner */}
          <div className="h-48 relative">
            <Image
              src="https://files.catbox.moe/i9bfn9.jpg"
              alt="Banner"
              fill
              className="object-cover"
              unoptimized
            />
            <div className="absolute inset-0 bg-black/30" />
          </div>
          
          {/* Profile */}
          <div className="relative px-6 pb-6">
            <div className="absolute -top-14 left-6">
              <div className="w-28 h-28 rounded-full border-4 border-zinc-800 overflow-hidden shadow-xl">
                <Image
                  src="https://files.catbox.moe/vc966c.jpg"
                  alt="SamuDev"
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            </div>
            
            <div className="pt-20">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold">SamuDev</h1>
                <Badge className="bg-rose-600">Full Stack Developer</Badge>
              </div>
              <p className="text-zinc-400 text-sm">@samudev</p>
              
              <p className="mt-4 text-zinc-300 leading-relaxed">
                Passionate full stack developer yang suka membuat aplikasi web modern dan interaktif. 
                Fokus pada pengalaman pengguna yang baik dan kode yang bersih.
              </p>
              
              {/* Contact Info */}
              <div className="mt-4 flex flex-col gap-2">
                <a 
                  href="https://wa.me/6289518217767" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-green-400 hover:text-green-300 transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  <span className="text-sm">WhatsApp: 089518217767</span>
                </a>
                <a 
                  href="https://t.me/SamuDev" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                  <span className="text-sm">Telegram: @SamuDev</span>
                </a>
              </div>
            </div>
          </div>
          
          {/* About Website */}
          <div className="px-6 pb-6 space-y-4">
            <div className="p-5 bg-gradient-to-br from-zinc-700/50 to-zinc-800/50 rounded-xl border border-zinc-700">
              <div className="flex items-center gap-2 mb-3">
                <Film className="w-5 h-5 text-rose-500" />
                <h3 className="font-semibold text-lg">Tentang Website</h3>
              </div>
              <p className="text-zinc-300 leading-relaxed">
                <strong className="text-white">AnimeStream</strong> adalah platform streaming anime Indonesia yang menyediakan 
                koleksi anime lengkap dengan subtitle Indonesia.
              </p>
            </div>
            
            <div className="p-5 bg-gradient-to-br from-zinc-700/50 to-zinc-800/50 rounded-xl border border-zinc-700">
              <div className="flex items-center gap-2 mb-3">
                <Star className="w-5 h-5 text-yellow-500" />
                <h3 className="font-semibold text-lg">Fitur Unggulan</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-2 text-zinc-300">
                  <Play className="w-4 h-4 text-rose-500" />
                  <span className="text-sm">Streaming multiple server</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-300">
                  <Search className="w-4 h-4 text-rose-500" />
                  <span className="text-sm">Pencarian anime</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-300">
                  <Heart className="w-4 h-4 text-rose-500" />
                  <span className="text-sm">Simpan favorit</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-300">
                  <Clock className="w-4 h-4 text-rose-500" />
                  <span className="text-sm">Riwayat tontonan</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-300">
                  <Grid3X3 className="w-4 h-4 text-rose-500" />
                  <span className="text-sm">Kategori genre lengkap</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-300">
                  <Bell className="w-4 h-4 text-rose-500" />
                  <span className="text-sm">Notifikasi update</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Admin Login Modal */}
      <AnimatePresence>
        {showAdminLogin && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowAdminLogin(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-zinc-800 rounded-xl p-6 w-full max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <LogIn className="w-5 h-5" /> Admin Login
              </h2>
              
              {adminError && (
                <div className="bg-red-500/20 border border-red-500 text-red-400 p-2 rounded mb-4 text-sm">
                  {adminError}
                </div>
              )}
              
              <Input
                placeholder="Username"
                value={adminUsername}
                onChange={(e) => setAdminUsername(e.target.value)}
                className="mb-3 bg-zinc-700 border-zinc-600"
              />
              <Input
                placeholder="Password"
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="mb-4 bg-zinc-700 border-zinc-600"
                onKeyDown={(e) => e.key === 'Enter' && handleAdminLogin()}
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowAdminLogin(false)}
                >
                  Batal
                </Button>
                <Button
                  className="flex-1 bg-rose-600 hover:bg-rose-700"
                  onClick={handleAdminLogin}
                >
                  Login
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  // Render Anime Detail View
  const renderDetailView = () => (
    <div className="pb-20">
      <div className="px-4 md:px-6 py-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedAnime(null)}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Kembali
        </Button>
      </div>
      
      {/* Anime Poster & Info */}
      <div className="relative h-[40vh] md:h-[50vh]">
        <Image
          src={selectedAnime?.poster || ""}
          alt={selectedAnime?.title || ""}
          fill
          className="object-cover"
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/70 to-transparent" />
      </div>
      
      <div className="px-4 md:px-6 -mt-20 relative z-10">
        <div className="flex gap-4">
          <div className="w-32 md:w-40 flex-shrink-0">
            <div className="relative aspect-[2/3] rounded-lg overflow-hidden shadow-xl">
              <Image
                src={selectedAnime?.poster || ""}
                alt={selectedAnime?.title || ""}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          </div>
          
          <div className="flex-1 pt-24">
            <h1 className="text-xl md:text-2xl font-bold line-clamp-2">{selectedAnime?.title}</h1>
            
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedAnime?.status && (
                <Badge variant="secondary">{selectedAnime.status}</Badge>
              )}
              {selectedAnime?.type && (
                <Badge variant="outline">{selectedAnime.type}</Badge>
              )}
              {selectedAnime?.rating && (
                <Badge className="bg-rose-600">{selectedAnime.rating}</Badge>
              )}
            </div>
            
            {selectedAnime?.score && (
              <div className="flex items-center gap-1 mt-2">
                <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                <span className="font-semibold">{selectedAnime.score}</span>
              </div>
            )}
            
            <Button
              variant={isFavorite(selectedAnime?.slug || "") ? "default" : "outline"}
              size="sm"
              className="mt-3 gap-1"
              onClick={() => selectedAnime && handleToggleFavorite(selectedAnime)}
            >
              <Heart className={`w-4 h-4 ${isFavorite(selectedAnime?.slug || "") ? "fill-current" : ""}`} />
              {isFavorite(selectedAnime?.slug || "") ? "Hapus Favorit" : "Tambah Favorit"}
            </Button>
          </div>
        </div>
        
        {/* Info Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
          {selectedAnime?.studio && (
            <div className="bg-zinc-800 rounded-lg p-3">
              <p className="text-xs text-zinc-400">Studio</p>
              <p className="text-sm font-medium">{selectedAnime.studio}</p>
            </div>
          )}
          {selectedAnime?.released && (
            <div className="bg-zinc-800 rounded-lg p-3">
              <p className="text-xs text-zinc-400">Rilis</p>
              <p className="text-sm font-medium">{selectedAnime.released}</p>
            </div>
          )}
          {selectedAnime?.duration && (
            <div className="bg-zinc-800 rounded-lg p-3">
              <p className="text-xs text-zinc-400">Durasi</p>
              <p className="text-sm font-medium">{selectedAnime.duration}</p>
            </div>
          )}
          {selectedAnime?.season && (
            <div className="bg-zinc-800 rounded-lg p-3">
              <p className="text-xs text-zinc-400">Season</p>
              <p className="text-sm font-medium">{selectedAnime.season}</p>
            </div>
          )}
        </div>
        
        {/* Genres */}
        {selectedAnime?.genres && selectedAnime.genres.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {selectedAnime.genres.map((genre) => (
              <Badge key={genre.slug} variant="secondary">
                {genre.title}
              </Badge>
            ))}
          </div>
        )}
        
        {/* Synopsis */}
        {selectedAnime?.synopsis && (
          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-2">Sinopsis</h2>
            <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-line">
              {selectedAnime.synopsis}
            </p>
          </div>
        )}
        
        {/* Episodes */}
        {selectedAnime?.episode_list && selectedAnime.episode_list.length > 0 && (
          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-3">Daftar Episode</h2>
            <ScrollArea className="h-[50vh]">
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 pr-4">
                {selectedAnime.episode_list.map((ep, index) => (
                  <Button
                    key={ep.slug}
                    variant="outline"
                    size="sm"
                    onClick={() => fetchEpisode(ep.slug)}
                    className="h-10"
                  >
                    EP {index + 1}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  );

  // Render Watch View
  const renderWatchView = () => (
    <div className="pb-20">
      <div className="px-4 md:px-6 py-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setWatchingEpisode(null);
            setSelectedServer(null);
          }}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Kembali
        </Button>
      </div>
      
      {/* Video Player */}
      <div className="px-4 md:px-6">
        <div className="aspect-video bg-black rounded-lg overflow-hidden mb-4">
          {watchingEpisode?.streamUrl ? (
            <iframe
              src={watchingEpisode.streamUrl}
              className="w-full h-full"
              allowFullScreen
              allow="autoplay; fullscreen; picture-in-picture"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-400">
              <p>Pilih server untuk menonton</p>
            </div>
          )}
        </div>
        
        <h1 className="text-lg font-bold">{watchingEpisode?.episode.title}</h1>
        <p className="text-zinc-400">{watchingEpisode?.anime.title}</p>
        
        {/* Server Selection */}
        {watchingEpisode?.servers && watchingEpisode.servers.length > 0 && (
          <div className="mt-4">
            <h2 className="text-sm font-semibold mb-2">Pilih Server:</h2>
            <div className="flex flex-wrap gap-2">
              {watchingEpisode.servers.map((server) => (
                <Button
                  key={server.server_id}
                  variant={selectedServer?.server_id === server.server_id ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleSelectServer(server)}
                >
                  {server.name}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Render Search Results View
  const renderSearchResultsView = () => (
    <div className="px-4 md:px-6 py-4 pb-20">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" onClick={clearSearch}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Kembali
        </Button>
        <h2 className="text-xl font-bold">Hasil Pencarian: {searchQuery}</h2>
      </div>
      
      {loading.search ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-4">
          {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : searchResults.length === 0 ? (
        <div className="text-center py-20">
          <Search className="w-16 h-16 mx-auto text-zinc-600 mb-4" />
          <p className="text-zinc-400">Tidak ada hasil ditemukan</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-4">
          {searchResults.map((anime) => <AnimeCard key={anime.slug} anime={anime} />)}
        </div>
      )}
    </div>
  );

  return (
    <div className={`min-h-screen bg-zinc-900 text-zinc-100 ${theme === "dark" ? "dark" : ""}`}>
      {/* Header */}
      <nav className="sticky top-0 z-50 bg-zinc-900/95 backdrop-blur-sm border-b border-zinc-800">
        <div className="flex items-center justify-between px-4 h-14">
          <h1 className="text-lg font-bold text-rose-500">AnimeStream</h1>
          
          <div className="flex-1 max-w-md mx-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <Input
                placeholder="Cari anime..."
                className="pl-10 pr-10 bg-zinc-800 border-zinc-700"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSearch();
                }}
              />
              {showSearchResults && (
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                  onClick={clearSearch}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="min-h-[calc(100vh-7rem)]">
        {watchingEpisode ? (
          renderWatchView()
        ) : selectedAnime ? (
          renderDetailView()
        ) : showSearchResults ? (
          renderSearchResultsView()
        ) : (
          <>
            {activeTab === "anime" && renderHomeView()}
            {activeTab === "update" && renderUpdateView()}
            {activeTab === "history" && renderHistoryView()}
            {activeTab === "favorite" && renderFavoriteView()}
            {activeTab === "developer" && renderDeveloperView()}
          </>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 z-40">
        <div className="flex justify-around items-center h-16">
          {[
            { id: "anime", icon: Film, label: "Anime" },
            { id: "update", icon: Newspaper, label: "Update" },
            { id: "history", icon: Clock, label: "History" },
            { id: "favorite", icon: Heart, label: "Favorite" },
            { id: "developer", icon: User, label: "Developer" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id as TabType);
                setSelectedAnime(null);
                setWatchingEpisode(null);
                setDeleteModeHistory(false);
                setDeleteModeFavorite(false);
                setSelectedToDelete(new Set());
                if (item.id === "update") {
                  fetchNewsList();
                }
              }}
              className={`flex flex-col items-center justify-center py-2 px-3 transition-colors ${
                activeTab === item.id
                  ? "text-rose-500"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs mt-1 font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
