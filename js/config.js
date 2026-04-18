/**
 * Dororo - Configuration & Constants
 * Central configuration for all API keys, URLs, and app settings
 */

const CONFIG = {
    APP_NAME: 'Dororo',
    TAGLINE: 'Your Time to Watch',
    COPYRIGHT: 'Website created by Siam Hossain, AI help Claude',

    // TMDB API Configuration
    TMDB: {
        API_KEY: '7987df57a53a1a44a235b818ac8537de',
        BASE_URL: 'https://api.themoviedb.org/3',
        IMG_URL: 'https://image.tmdb.org/t/p',
        BACKDROP_URL: 'https://image.tmdb.org/t/p/original',
        POSTER_SM: 'https://image.tmdb.org/t/p/w342',
        POSTER_MD: 'https://image.tmdb.org/t/p/w500',
        POSTER_LG: 'https://image.tmdb.org/t/p/w780',
        PROFILE: 'https://image.tmdb.org/t/p/w185',
    },

    // OMDB API Configuration
    OMDB: {
        API_KEY: '32b825d8',
        BASE_URL: 'https://www.omdbapi.com',
    },

    // TVMaze API Configuration
    TVMAZE: {
        API_KEY: 'AQuYrD7nUj6sNOeyM3r9Rs3RvCWSHY6u',
        BASE_URL: 'https://api.tvmaze.com',
    },

    // Jikan API Configuration (MyAnimeList)
    JIKAN: {
        BASE_URL: 'https://api.jikan.moe/v4',
    },

    // AniList API Configuration (GraphQL)
    ANILIST: {
        BASE_URL: 'https://graphql.anilist.co',
    },

    // Cache settings
    CACHE: {
        EXPIRY: 60 * 60 * 1000, // 1 hour in ms
        PREFIX: 'cw_cache_',
    },

    // Rate limit delays (ms)
    RATE_LIMIT: {
        JIKAN_DELAY: 350,
        TVMAZE_DELAY: 250,
        TMDB_DELAY: 100,
    },

    // Debounce delay for search
    SEARCH_DEBOUNCE: 300,

    // TMDB Genre IDs
    GENRES: {
        ACTION: 28,
        ADVENTURE: 12,
        ANIMATION: 16,
        COMEDY: 35,
        CRIME: 80,
        DOCUMENTARY: 99,
        DRAMA: 18,
        FAMILY: 10751,
        FANTASY: 14,
        HISTORY: 36,
        HORROR: 27,
        MUSIC: 10402,
        MYSTERY: 9648,
        ROMANCE: 10749,
        SCIENCE_FICTION: 878,
        THRILLER: 53,
        WAR: 10752,
        WESTERN: 37,
    },

    // Local visual placeholders and empty-state artwork
    PLACEHOLDER_IMG: 'assets/placeholder-poster.svg',
    PLACEHOLDER_BACKDROP: 'assets/placeholder-backdrop.svg',
    PLACEHOLDER_PROFILE: 'assets/placeholder-profile.svg',
    EMPTY_SEARCH_ILLUSTRATION: 'assets/empty-search.svg',
    EMPTY_LIBRARY_ILLUSTRATION: 'assets/empty-library.svg',
    ERROR_ILLUSTRATION: 'assets/error-state.svg',
};
