/**
 * CLOCKWATCH - Centralized API Module
 * Handles all API calls with caching, rate limiting, and error handling
 */

const API = (() => {
    // ----- Request Queue & Rate Limiting -----
    const queues = {
        jikan: { lastCall: 0, delay: CONFIG.RATE_LIMIT.JIKAN_DELAY, pending: [] },
        tvmaze: { lastCall: 0, delay: CONFIG.RATE_LIMIT.TVMAZE_DELAY, pending: [] },
        tmdb: { lastCall: 0, delay: CONFIG.RATE_LIMIT.TMDB_DELAY, pending: [] },
    };

    async function rateLimitedFetch(url, queueName) {
        const q = queues[queueName] || queues.tmdb;
        const now = Date.now();
        const elapsed = now - q.lastCall;
        if (elapsed < q.delay) {
            await new Promise(r => setTimeout(r, q.delay - elapsed));
        }
        q.lastCall = Date.now();
        return fetch(url);
    }

    // ----- Caching Layer -----
    function getCached(key) {
        try {
            const raw = sessionStorage.getItem(CONFIG.CACHE.PREFIX + key);
            if (!raw) return null;
            const data = JSON.parse(raw);
            if (Date.now() - data.ts > CONFIG.CACHE.EXPIRY) {
                sessionStorage.removeItem(CONFIG.CACHE.PREFIX + key);
                return null;
            }
            return data.value;
        } catch { return null; }
    }

    function setCache(key, value) {
        try {
            sessionStorage.setItem(CONFIG.CACHE.PREFIX + key, JSON.stringify({ value, ts: Date.now() }));
        } catch {
            // Storage full – clear old entries
            try {
                const toRemove = [];
                for (let i = 0; i < sessionStorage.length; i++) {
                    const k = sessionStorage.key(i);
                    if (k && k.startsWith(CONFIG.CACHE.PREFIX)) toRemove.push(k);
                }
                toRemove.slice(0, Math.ceil(toRemove.length / 2)).forEach(k => sessionStorage.removeItem(k));
                sessionStorage.setItem(CONFIG.CACHE.PREFIX + key, JSON.stringify({ value, ts: Date.now() }));
            } catch { /* give up */ }
        }
    }

    async function cachedFetch(url, queueName, cacheKey) {
        const key = cacheKey || url;
        const cached = getCached(key);
        if (cached) return cached;
        try {
            const res = await rateLimitedFetch(url, queueName);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            setCache(key, data);
            return data;
        } catch (err) {
            console.error(`[API] Fetch error (${url}):`, err);
            throw err;
        }
    }

    // =============================================
    // TMDB API
    // =============================================
    const tmdb = (endpoint, params = {}) => {
        params.api_key = CONFIG.TMDB.API_KEY;
        const qs = new URLSearchParams(params).toString();
        return cachedFetch(`${CONFIG.TMDB.BASE_URL}${endpoint}?${qs}`, 'tmdb');
    };

    const TMDB = {
        trending: (timeWindow = 'day') => tmdb(`/trending/movie/${timeWindow}`),
        trendingAll: (timeWindow = 'day') => tmdb(`/trending/all/${timeWindow}`),
        popularMovies: (page = 1) => tmdb('/movie/popular', { page }),
        topRatedMovies: (page = 1) => tmdb('/movie/top_rated', { page }),
        nowPlaying: (page = 1) => tmdb('/movie/now_playing', { page }),
        upcomingMovies: (page = 1) => tmdb('/movie/upcoming', { page }),
        movieDetails: (id) => tmdb(`/movie/${id}`, { append_to_response: 'videos,credits,similar,external_ids' }),
        movieCredits: (id) => tmdb(`/movie/${id}/credits`),
        movieVideos: (id) => tmdb(`/movie/${id}/videos`),
        movieSimilar: (id, page = 1) => tmdb(`/movie/${id}/similar`, { page }),
        searchMovies: (query, page = 1) => tmdb('/search/movie', { query, page }),
        searchMulti: (query, page = 1) => tmdb('/search/multi', { query, page }),
        discoverMovies: (params = {}) => tmdb('/discover/movie', params),
        genreList: () => tmdb('/genre/movie/list'),
        moviesByGenre: (genreId, page = 1) => tmdb('/discover/movie', { with_genres: genreId, sort_by: 'popularity.desc', page }),

        imgUrl: (path, size = 'w500') => path ? `${CONFIG.TMDB.IMG_URL}/${size}${path}` : CONFIG.PLACEHOLDER_IMG,
        backdropUrl: (path) => path ? `${CONFIG.TMDB.BACKDROP_URL}${path}` : CONFIG.PLACEHOLDER_BACKDROP,
        profileUrl: (path) => path ? `${CONFIG.TMDB.PROFILE}${path}` : CONFIG.PLACEHOLDER_PROFILE,
    };

    // =============================================
    // OMDB API
    // =============================================
    const omdb = (params = {}) => {
        params.apikey = CONFIG.OMDB.API_KEY;
        const qs = new URLSearchParams(params).toString();
        return cachedFetch(`${CONFIG.OMDB.BASE_URL}?${qs}`, 'tmdb', `omdb_${JSON.stringify(params)}`);
    };

    const OMDB = {
        byTitle: (title) => omdb({ t: title }),
        byImdbId: (imdbId) => omdb({ i: imdbId }),
        search: (query, page = 1) => omdb({ s: query, page }),
    };

    // =============================================
    // TVMaze API
    // =============================================
    const tvmaze = (endpoint) => {
        return cachedFetch(`${CONFIG.TVMAZE.BASE_URL}${endpoint}`, 'tvmaze');
    };

    const TVMAZE = {
        allShows: (page = 0) => tvmaze(`/shows?page=${page}`),
        showDetails: (id) => tvmaze(`/shows/${id}?embed[]=episodes&embed[]=cast`),
        search: (query) => tvmaze(`/search/shows?q=${encodeURIComponent(query)}`),
        episodes: (id) => tvmaze(`/shows/${id}/episodes`),
        cast: (id) => tvmaze(`/shows/${id}/cast`),
        schedule: (country = 'US') => tvmaze(`/schedule?country=${country}`),
        showIndex: (page = 0) => tvmaze(`/shows?page=${page}`),
        // Get "popular" shows (curated page of high-rated shows)
        popular: async () => {
            // TVMaze doesn't have a "popular" endpoint, use page 0 which has popular shows
            const shows = await tvmaze('/shows?page=0');
            return shows
                .filter(s => s.rating && s.rating.average)
                .sort((a, b) => (b.rating.average || 0) - (a.rating.average || 0))
                .slice(0, 20);
        },
    };

    // =============================================
    // Jikan API (MyAnimeList)
    // =============================================
    const jikan = (endpoint, params = {}) => {
        const qs = new URLSearchParams(params).toString();
        const url = qs ? `${CONFIG.JIKAN.BASE_URL}${endpoint}?${qs}` : `${CONFIG.JIKAN.BASE_URL}${endpoint}`;
        return cachedFetch(url, 'jikan');
    };

    const JIKAN = {
        topAnime: (page = 1, filter = '') => jikan('/top/anime', { page, ...(filter && { filter }) }),
        animeDetails: (id) => jikan(`/anime/${id}/full`),
        searchAnime: (query, page = 1) => jikan('/anime', { q: query, page }),
        seasonNow: (page = 1) => jikan('/seasons/now', { page }),
        seasonList: () => jikan('/seasons'),
        animeCharacters: (id) => jikan(`/anime/${id}/characters`),
        animeRecommendations: (id) => jikan(`/anime/${id}/recommendations`),
        animeByGenre: (genreId, page = 1) => jikan('/anime', { genres: genreId, page }),
        randomAnime: () => jikan('/random/anime'),
        animeGenres: () => jikan('/genres/anime'),
        seasonAnime: (year, season, page = 1) => jikan(`/seasons/${year}/${season}`, { page }),
    };

    // Public API
    return { TMDB, OMDB, TVMAZE, JIKAN };
})();
