/**
 * CLOCKWATCH - Search Page Logic
 * Multi-API search across TMDB, TVMaze, and Jikan
 */

const SearchPage = (() => {
    let currentTab = 'all';
    let searchResults = { movies: [], tv: [], anime: [] };
    let lastQuery = '';

    function init() {
        UI.renderNav('search');
        UI.renderFooter();
        UI.initBackToTop();

        const params = new URLSearchParams(window.location.search);
        const query = params.get('q') || '';

        const searchInput = document.getElementById('searchPageInput');
        if (searchInput && query) {
            searchInput.value = query;
            performSearch(query);
        }

        // Search form submission
        document.getElementById('searchPageForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            const q = searchInput.value.trim();
            if (q) {
                window.history.replaceState({}, '', `search.html?q=${encodeURIComponent(q)}`);
                performSearch(q);
            }
        });

        // Tabs
        document.querySelectorAll('.search-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.search-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                currentTab = tab.dataset.tab;
                renderResults();
            });
        });
    }

    async function performSearch(query) {
        const resultsContainer = document.getElementById('searchResults');
        lastQuery = query;
        resultsContainer.innerHTML = `
            <div class="loading-spinner"><div class="spinner"></div></div>
        `;

        searchResults = { movies: [], tv: [], anime: [] };

        // Search all APIs in parallel
        const [tmdbRes, tvmazeRes, jikanRes] = await Promise.allSettled([
            API.TMDB.searchMovies(query),
            API.TVMAZE.search(query),
            API.JIKAN.searchAnime(query),
        ]);

        if (tmdbRes.status === 'fulfilled') {
            searchResults.movies = tmdbRes.value.results || [];
        }
        if (tvmazeRes.status === 'fulfilled') {
            searchResults.tv = (tvmazeRes.value || []).map(r => r.show).filter(Boolean);
        }
        if (jikanRes.status === 'fulfilled') {
            searchResults.anime = jikanRes.value.data || [];
        }

        renderResults();
    }

    function renderResults() {
        const container = document.getElementById('searchResults');
        container.innerHTML = '';

        const showMovies = currentTab === 'all' || currentTab === 'movies';
        const showTV = currentTab === 'all' || currentTab === 'tv';
        const showAnime = currentTab === 'all' || currentTab === 'anime';

        let hasResults = false;

        if (showMovies && searchResults.movies.length > 0) {
            hasResults = true;
            container.innerHTML += renderSection('Movies', searchResults.movies, 'movie');
        }

        if (showTV && searchResults.tv.length > 0) {
            hasResults = true;
            container.innerHTML += renderSection('TV Shows', searchResults.tv, 'tvmaze');
        }

        if (showAnime && searchResults.anime.length > 0) {
            hasResults = true;
            container.innerHTML += renderSection('Anime', searchResults.anime, 'anime');
        }

        if (!hasResults) {
            container.innerHTML = `
                <div class="empty-state mylist-empty">
                    <img class="empty-state-illustration" src="${CONFIG.EMPTY_SEARCH_ILLUSTRATION}" alt="" aria-hidden="true" />
                    <h2>No results found</h2>
                    <p class="text-muted">We couldn't find anything matching "${lastQuery}"</p>
                </div>
            `;
        }
    }

    function renderSection(title, items, type) {
        const cardsHtml = items.slice(0, 20).map(item => {
            const card = UI.createMovieCard(item, type);
            return card.outerHTML;
        }).join('');

        return `
            <div class="search-results-section">
                <h2 class="search-results-title">${title} <span class="text-muted">(${items.length})</span></h2>
                <div class="content-grid">${cardsHtml}</div>
            </div>
        `;
    }

    return { init };
})();

document.addEventListener('DOMContentLoaded', SearchPage.init);
