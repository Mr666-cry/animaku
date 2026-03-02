// Otakudesu API Types

export interface OtakudesuAnime {
  title: string;
  slug: string;
  poster: string;
  current_episode?: string;
  rating?: string;
  day?: string;
  type?: string;
  status?: string;
}

export interface OtakudesuAnimeDetail {
  title: string;
  slug: string;
  poster: string;
  synopsis: string;
  status: string;
  type: string;
  rating: string;
  score: string;
  studio: string;
  released: string;
  duration: string;
  season: string;
  episode_list: EpisodeListItem[];
  genres: Genre[];
  batch_link?: {
    title: string;
    slug: string;
  };
}

export interface EpisodeListItem {
  title: string;
  slug: string;
}

export interface Genre {
  title: string;
  slug: string;
}

export interface OtakudesuEpisode {
  title: string;
  slug: string;
  anime: {
    title: string;
    slug: string;
    poster: string;
  };
  servers: Server[];
  prev_episode?: {
    title: string;
    slug: string;
  };
  next_episode?: {
    title: string;
    slug: string;
  };
}

export interface Server {
  name: string;
  server_id: string;
}

export interface OtakudesuServer {
  server: {
    name: string;
    url: string;
  };
}

export interface OtakudesuHome {
  ongoing: OtakudesuAnime[];
  complete: OtakudesuAnime[];
}

export interface OtakudesuSchedule {
  schedule: {
    day: string;
    anime_list: OtakudesuAnime[];
  }[];
}

export interface OtakudesuGenreList {
  genre_list: Genre[];
}

export interface OtakudesuGenreAnime {
  anime_list: OtakudesuAnime[];
  pagination: {
    current_page: number;
    last_page: number;
  };
}

export interface OtakudesuSearch {
  search_result: OtakudesuAnime[];
}

export interface OtakudesuPagination {
  current_page: number;
  last_page: number;
  anime_list: OtakudesuAnime[];
}
