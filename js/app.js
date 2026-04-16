/**
 * WASUSANOCH - Main App Logic (Homepage)
 * Handles hero carousel, content rows, and page initialization
 */

const App = (() => {
    let heroItems = [];
    let currentHeroIndex = 0;
    let heroInterval = null;

    async function init() {
        UI.renderNav('home');
        UI.renderFooter();
        UI.initRowArrows();
        UI.initBackToTop();

        await loadHero();
        loadAllRows();

        // Start scroll reveal after rows are created
        setTimeout(() => UI.initScrollReveal(), 500);
    }

    // =============================================
    // Hero Banner with auto-rotation
    // =============================================
    async function loadHero() {
        const heroEl = document.getElementById('hero');
        if (!heroEl) return;
        try {
            const data = await API.TMDB.trending('day');
            heroItems = (data.results || []).filter(m => m.backdrop_path).slice(0, 5);
            if (heroItems.length === 0) return;

            renderHeroSlide(heroEl, 0);
            addHeroIndicators(heroEl);
            startHeroRotation(heroEl);
        } catch (err) {
            heroEl.innerHTML = `<div class="hero-content" style="padding-top:200px;"><h1 class="hero-title">Welcome to WASUSANOCH</h1><p class="hero-overview">${CONFIG.TAGLINE}</p></div>`;
        }
    }

    function renderHeroSlide(heroEl, index) {
        const item = heroItems[index];
        currentHeroIndex = index;
        UI.renderHero(heroEl, item, item.media_type || 'movie');
        updateHeroDots();
    }

    function addHeroIndicators(heroEl) {
        if (heroItems.length <= 1) return;
        const dots = document.createElement('div');
        dots.className = 'hero-indicators';
        dots.id = 'heroIndicators';
        heroItems.forEach((_, i) => {
            const dot = document.createElement('div');
            dot.className = `hero-dot ${i === 0 ? 'active' : ''}`;
            dot.addEventListener('click', () => {
                renderHeroSlide(heroEl, i);
                resetHeroRotation(heroEl);
            });
            dots.appendChild(dot);
        });
        heroEl.appendChild(dots);
    }

    function updateHeroDots() {
        document.querySelectorAll('.hero-dot').forEach((dot, i) => {
            dot.classList.toggle('active', i === currentHeroIndex);
        });
    }

    function startHeroRotation(heroEl) {
        heroInterval = setInterval(() => {
            const next = (currentHeroIndex + 1) % heroItems.length;
            renderHeroSlide(heroEl, next);
        }, 8000);
    }

    function resetHeroRotation(heroEl) {
        clearInterval(heroInterval);
        startHeroRotation(heroEl);
    }

    // =============================================
    // Content Rows
    // =============================================
    function loadAllRows() {
        const container = document.getElementById('content-rows');
        if (!container) return;

        container.innerHTML = [
            UI.createContentRow('Trending Now', 'row-trending'),
            UI.createContentRow('Popular Movies', 'row-popular'),
            UI.createContentRow('Popular TV Shows', 'row-tv'),
            UI.createContentRow('Top Anime', 'row-anime'),
            UI.createContentRow('Top Rated Movies', 'row-toprated'),
            UI.createContentRow('Action Movies', 'row-action'),
            UI.createContentRow('Comedy Movies', 'row-comedy'),
            UI.createContentRow('Horror Movies', 'row-horror'),
            UI.createContentRow('Seasonal Anime', 'row-seasonal'),
            UI.createContentRow('Airing Today', 'row-airing'),
        ].join('');

        // Load each row with proper rate limiting
        loadRow('row-trending', () => API.TMDB.trending('day'), 'movie');
        loadRow('row-popular', () => API.TMDB.popularMovies(), 'movie');
        loadRow('row-toprated', () => API.TMDB.topRatedMovies(), 'movie');

        // TV Shows
        setTimeout(() => loadTVRow('row-tv'), 400);

        // Anime
        setTimeout(() => loadAnimeRow('row-anime', () => API.JIKAN.topAnime()), 800);
        setTimeout(() => loadAnimeRow('row-seasonal', () => API.JIKAN.seasonNow()), 1200);

        // Genre rows
        setTimeout(() => loadRow('row-action', () => API.TMDB.moviesByGenre(CONFIG.GENRES.ACTION), 'movie'), 500);
        setTimeout(() => loadRow('row-comedy', () => API.TMDB.moviesByGenre(CONFIG.GENRES.COMEDY), 'movie'), 700);
        setTimeout(() => loadRow('row-horror', () => API.TMDB.moviesByGenre(CONFIG.GENRES.HORROR), 'movie'), 900);

        // Airing Today
        setTimeout(() => loadAiringRow('row-airing'), 1000);
    }

    async function loadRow(containerId, fetchFn, type) {
        try {
            const data = await fetchFn();
            const items = data.results || data;
            UI.populateRow(containerId, Array.isArray(items) ? items.slice(0, 20) : [], type);
        } catch (err) {
            console.error(`Failed to load ${containerId}:`, err);
            const container = document.getElementById(containerId);
            if (container) container.innerHTML = '<p class="row-empty">Failed to load content</p>';
        }
    }

    async function loadTVRow(containerId) {
        try {
            const shows = await API.TVMAZE.popular();
            UI.populateRow(containerId, shows.slice(0, 20), 'tvmaze');
        } catch (err) {
            console.error('Failed to load TV row:', err);
            const container = document.getElementById(containerId);
            if (container) container.innerHTML = '<p class="row-empty">Failed to load TV shows</p>';
        }
    }

    async function loadAnimeRow(containerId, fetchFn) {
        try {
            const data = await fetchFn();
            const items = data.data || [];
            UI.populateRow(containerId, items.slice(0, 20), 'anime');
        } catch (err) {
            console.error(`Failed to load anime row ${containerId}:`, err);
            const container = document.getElementById(containerId);
            if (container) container.innerHTML = '<p class="row-empty">Failed to load anime</p>';
        }
    }

    async function loadAiringRow(containerId) {
        try {
            const episodes = await API.TVMAZE.schedule();
            // Deduplicate by show ID
            const showMap = new Map();
            episodes.forEach(ep => {
                if (ep.show && !showMap.has(ep.show.id)) {
                    showMap.set(ep.show.id, ep.show);
                }
            });
            UI.populateRow(containerId, [...showMap.values()].slice(0, 20), 'tvmaze');
        } catch (err) {
            console.error('Failed to load airing row:', err);
            const container = document.getElementById(containerId);
            if (container) container.innerHTML = '<p class="row-empty">Failed to load schedule</p>';
        }
    }

    return { init };
})();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', App.init);
