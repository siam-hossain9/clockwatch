/**
 * Dororo - UI Components & Helpers
 * Shared UI generation functions: cards, rows, skeletons, modals, nav, footer
 */

const UI = (() => {
    // =============================================
    // Authentication (Mock)
    // =============================================
    const Auth = {
        getUser: () => JSON.parse(localStorage.getItem('Dororo_USER')),
        login: (username) => {
            localStorage.setItem('Dororo_USER', JSON.stringify({ username }));
            document.dispatchEvent(new Event('authChanged'));
        },
        logout: () => {
            localStorage.removeItem('Dororo_USER');
            document.dispatchEvent(new Event('authChanged'));
            window.location.href = 'index.html';
        }
    };

    document.addEventListener('authChanged', () => {
        // Re-render nav if a page doesn't entirely reload
        const activeNav = document.querySelector('.nav-links .active');
        const p = activeNav ? activeNav.textContent.toLowerCase().replace(' ', '') : 'home';
        renderNav(p);
    });


    // =============================================
    // Navigation
    // =============================================
    function renderNav(activePage = 'home') {
        const nav = document.getElementById('main-nav');
        if (!nav) return;
        nav.innerHTML = `
            <div class="nav-container">
                <a href="index.html" class="nav-logo" aria-label="Dororo Home">
                    <span class="logo-icon">D</span>
                    <span class="logo-text">Dororo</span>
                </a>
                <ul class="nav-links" id="navLinks">
                    <li><a href="index.html" class="${activePage === 'home' ? 'active' : ''}">Home</a></li>
                    <li><a href="movies.html" class="${activePage === 'movies' ? 'active' : ''}">Movies</a></li>
                    <li><a href="tvshows.html" class="${activePage === 'tvshows' ? 'active' : ''}">TV Shows</a></li>
                    <li><a href="anime.html" class="${activePage === 'anime' ? 'active' : ''}">Anime</a></li>
                    <li><a href="mylist.html" class="${activePage === 'mylist' ? 'active' : ''}">My List</a></li>
                </ul>
                <div class="nav-actions">
                    <button class="nav-search-btn" id="navSearchBtn" aria-label="Search">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                        </svg>
                    </button>
                    <div class="nav-profile-container">
                        ${Auth.getUser() ? `
                            <button class="nav-profile-btn has-user" aria-label="Profile Menu">
                                <span class="profile-initial">${Auth.getUser().username.charAt(0).toUpperCase()}</span>
                            </button>
                            <div class="nav-profile-dropdown">
                                <div class="dropdown-header">Hi, ${Auth.getUser().username.split('@')[0]}!</div>
                                <ul>
                                    <li><a href="mylist.html">My List</a></li>
                                    <li><button class="btn-logout" id="navLogoutBtn">Sign Out</button></li>
                                </ul>
                            </div>
                        ` : `
                            <button class="nav-login-btn btn btn-primary" id="navLoginBtn">Sign In</button>
                        `}
                    </div>
                    <button class="nav-hamburger" id="navHamburger" aria-label="Menu">
                        <span></span><span></span><span></span>
                    </button>
                </div>
            </div>
            <div class="nav-search-overlay" id="navSearchOverlay">
                <form class="nav-search-form" id="navSearchForm" action="search.html">
                    <input type="text" name="q" id="navSearchInput" placeholder="Search movies, TV shows, anime..." autocomplete="off" />
                    <button type="submit" aria-label="Search">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                        </svg>
                    </button>
                    <button type="button" class="search-close-btn" id="searchCloseBtn" aria-label="Close search">✕</button>
                </form>
                <div class="search-suggestions" id="searchSuggestions"></div>
            </div>
        `;

        // Scroll behavior — transparent to solid
        const handleScroll = () => {
            nav.classList.toggle('nav-scrolled', window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();

        // Hamburger menu
        const hamburger = document.getElementById('navHamburger');
        const links = document.getElementById('navLinks');
        hamburger?.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            links.classList.toggle('mobile-open');
        });

        // Search overlay
        const searchBtn = document.getElementById('navSearchBtn');
        const overlay = document.getElementById('navSearchOverlay');
        const closeBtn = document.getElementById('searchCloseBtn');
        const searchInput = document.getElementById('navSearchInput');

        searchBtn?.addEventListener('click', () => {
            overlay.classList.add('active');
            searchInput.focus();
        });
        closeBtn?.addEventListener('click', () => {
            overlay.classList.remove('active');
            document.getElementById('searchSuggestions').innerHTML = '';
        });

        // Live search suggestions
        let debounceTimer;
        searchInput?.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            const q = searchInput.value.trim();
            if (q.length < 2) {
                document.getElementById('searchSuggestions').innerHTML = '';
                return;
            }
            debounceTimer = setTimeout(() => showSearchSuggestions(q), CONFIG.SEARCH_DEBOUNCE);
        });

        // Submit search
        document.getElementById('navSearchForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            const q = searchInput.value.trim();
            if (q) window.location.href = `search.html?q=${encodeURIComponent(q)}`;
        });

        // Auth listeners
        document.getElementById('navLoginBtn')?.addEventListener('click', openLoginModal);
        document.getElementById('navLogoutBtn')?.addEventListener('click', Auth.logout);

        // Profile Dropdown Desktop logic
        const profileBtn = document.querySelector('.nav-profile-btn.has-user');
        const dropdown = document.querySelector('.nav-profile-dropdown');
        if (profileBtn && dropdown) {
            profileBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdown.classList.toggle('active');
            });
            document.addEventListener('click', (e) => {
                if (!profileBtn.contains(e.target) && !dropdown.contains(e.target)) {
                    dropdown.classList.remove('active');
                }
            });
        }
    }

    // =============================================
    // Login Modal
    // =============================================
    function openLoginModal() {
        const existing = document.getElementById('loginModal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'loginModal';
        modal.className = 'modal-overlay auth-modal-overlay';
        modal.innerHTML = `
            <div class="modal-content auth-modal">
                <button class="modal-close" aria-label="Close">&times;</button>
                <div class="auth-header">
                    <h2>Sign In</h2>
                </div>
                <form id="authForm" class="auth-form">
                    <div class="form-group">
                        <input type="email" id="authEmail" placeholder="Email or mobile number" required>
                    </div>
                    <div class="form-group">
                        <input type="password" id="authPassword" placeholder="Password" required value="password123">
                    </div>
                    <button type="submit" class="btn btn-primary btn-block">Sign In</button>
                    <div class="auth-help">
                        <label><input type="checkbox" checked> Remember me</label>
                        <a href="#">Need help?</a>
                    </div>
                </form>
                <div class="auth-footer">
                    <p>New to Dororo? <b class="auth-signup-link" style="cursor:pointer;">Sign up now.</b></p>
                    <p class="auth-recaptcha">This page is protected by Google reCAPTCHA to ensure you're not a bot.</p>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
        requestAnimationFrame(() => modal.classList.add('active'));

        modal.querySelector('.modal-close').addEventListener('click', () => closeModal(modal));
        modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(modal); });

        document.getElementById('authForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('authEmail').value;
            Auth.login(email);
            closeModal(modal);
            UI.showToast('Successfully signed in!', 'success');
        });

        // Wire "Sign up now" link
        modal.querySelector('.auth-signup-link')?.addEventListener('click', (e) => {
            e.preventDefault();
            closeModal(modal);
            openSignUpModal();
        });
    }

    // =============================================
    // Sign Up Modal
    // =============================================
    function openSignUpModal() {
        const existing = document.getElementById('signupModal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'signupModal';
        modal.className = 'modal-overlay auth-modal-overlay';
        modal.innerHTML = `
            <div class="modal-content auth-modal">
                <button class="modal-close" aria-label="Close">&times;</button>
                <div class="auth-header">
                    <h2>Sign Up</h2>
                </div>
                <form id="signupForm" class="auth-form">
                    <div class="form-group">
                        <input type="text" id="signupName" placeholder="Username" required minlength="2">
                    </div>
                    <div class="form-group">
                        <input type="email" id="signupEmail" placeholder="Email address" required>
                    </div>
                    <div class="form-group">
                        <input type="password" id="signupPassword" placeholder="Password" required minlength="6">
                    </div>
                    <div class="form-group">
                        <input type="password" id="signupConfirm" placeholder="Confirm password" required minlength="6">
                    </div>
                    <div id="signupError" style="color:var(--color-red);font-size:0.85rem;margin-bottom:10px;display:none;"></div>
                    <button type="submit" class="btn btn-primary btn-block">Create Account</button>
                </form>
                <div class="auth-footer">
                    <p>Already have an account? <b class="auth-login-link" style="cursor:pointer;">Sign in</b></p>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
        requestAnimationFrame(() => modal.classList.add('active'));

        modal.querySelector('.modal-close').addEventListener('click', () => closeModal(modal));
        modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(modal); });

        document.getElementById('signupForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('signupName').value.trim();
            const email = document.getElementById('signupEmail').value.trim();
            const pass = document.getElementById('signupPassword').value;
            const confirm = document.getElementById('signupConfirm').value;
            const errEl = document.getElementById('signupError');

            if (pass !== confirm) {
                errEl.textContent = 'Passwords do not match.';
                errEl.style.display = 'block';
                return;
            }
            if (pass.length < 6) {
                errEl.textContent = 'Password must be at least 6 characters.';
                errEl.style.display = 'block';
                return;
            }

            Auth.login(email);
            closeModal(modal);
            UI.showToast(`Welcome, ${name}! Account created successfully.`, 'success');
        });

        // Wire "Sign in" link
        modal.querySelector('.auth-login-link')?.addEventListener('click', (e) => {
            e.preventDefault();
            closeModal(modal);
            openLoginModal();
        });
    }

    async function showSearchSuggestions(query) {
        const container = document.getElementById('searchSuggestions');
        if (!container) return;
        container.innerHTML = '<div class="suggestion-loading">Searching...</div>';
        try {
            const data = await API.TMDB.searchMulti(query);
            const results = (data.results || []).slice(0, 8);
            if (results.length === 0) {
                container.innerHTML = '<div class="suggestion-empty">No results found</div>';
                return;
            }
            container.innerHTML = results.map(item => {
                const title = item.title || item.name || 'Unknown';
                const year = (item.release_date || item.first_air_date || '').slice(0, 4);
                const type = item.media_type === 'movie' ? 'Movie' : item.media_type === 'tv' ? 'TV' : 'Person';
                const poster = item.poster_path || item.profile_path;
                const img = poster ? API.TMDB.imgUrl(poster, 'w92') : CONFIG.PLACEHOLDER_IMG;
                const href = item.media_type === 'person' ? '#' : `detail.html?type=${item.media_type === 'movie' ? 'movie' : 'tv'}&id=${item.id}`;
                return `
                    <a href="${href}" class="suggestion-item">
                        <img src="${img}" alt="${title}" loading="lazy" />
                        <div class="suggestion-info">
                            <span class="suggestion-title">${title}</span>
                            <span class="suggestion-meta">${type} ${year ? '• ' + year : ''}</span>
                        </div>
                    </a>
                `;
            }).join('');
        } catch {
            container.innerHTML = '<div class="suggestion-empty">Search failed</div>';
        }
    }

    // =============================================
    // Footer
    // =============================================
    function renderFooter() {
        const footer = document.getElementById('main-footer');
        if (!footer) return;
        footer.innerHTML = `
            <div class="footer-container">
                <div class="footer-top">
                    <div class="footer-brand">
                        <a href="index.html" class="footer-logo">
                            <span class="logo-icon">D</span>
                            <span class="logo-text">Dororo</span>
                        </a>
                        <p class="footer-tagline">${CONFIG.TAGLINE}</p>
                        <p class="footer-about">Dororo is your ultimate destination to discover movies, TV shows, and anime. Find what to watch next!</p>
                    </div>
                    <div class="footer-links-group">
                        <h4>Navigation</h4>
                        <ul>
                            <li><a href="index.html">Home</a></li>
                            <li><a href="movies.html">Movies</a></li>
                            <li><a href="tvshows.html">TV Shows</a></li>
                            <li><a href="anime.html">Anime</a></li>
                        </ul>
                    </div>
                    <div class="footer-links-group">
                        <h4>Features</h4>
                        <ul>
                            <li><a href="search.html">Search</a></li>
                            <li><a href="mylist.html">My List</a></li>
                        </ul>
                    </div>
                    <div class="footer-links-group">
                        <h4>APIs Powered By</h4>
                        <ul>
                            <li><a href="https://www.themoviedb.org" target="_blank" rel="noopener">TMDB</a></li>
                            <li><a href="https://www.omdbapi.com" target="_blank" rel="noopener">OMDB</a></li>
                            <li><a href="https://www.tvmaze.com" target="_blank" rel="noopener">TVMaze</a></li>
                            <li><a href="https://jikan.moe" target="_blank" rel="noopener">Jikan (MAL)</a></li>
                        </ul>
                    </div>
                </div>
                <div class="footer-bottom">
                    <p>Website created by Siam Hossain, AI help Claude</p>
                    <div class="footer-social">
                        <a href="#" aria-label="Twitter">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                        </a>
                        <a href="#" aria-label="GitHub">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                        </a>
                    </div>
                </div>
            </div>
        `;
    }

    // =============================================
    // Movie / Content Cards
    // =============================================
    function createMovieCard(item, type = 'movie') {
        const card = document.createElement('div');
        card.className = 'content-card';
        card.setAttribute('data-type', type);
        card.setAttribute('tabindex', '0');

        let posterUrl, title, year, rating, detailUrl, ratingColor;

        if (type === 'movie' || type === 'tv') {
            posterUrl = API.TMDB.imgUrl(item.poster_path);
            title = item.title || item.name || 'Unknown';
            year = (item.release_date || item.first_air_date || '').slice(0, 4);
            rating = item.vote_average ? item.vote_average.toFixed(1) : 'N/A';
            detailUrl = `detail.html?type=${type}&id=${item.id}`;
        } else if (type === 'tvmaze') {
            const img = item.image;
            posterUrl = img ? (img.medium || img.original) : CONFIG.PLACEHOLDER_IMG;
            title = item.name || 'Unknown';
            year = item.premiered ? item.premiered.slice(0, 4) : '';
            rating = item.rating?.average ? item.rating.average.toFixed(1) : 'N/A';
            detailUrl = `detail.html?type=tvmaze&id=${item.id}`;
        } else if (type === 'anime') {
            posterUrl = item.images?.jpg?.large_image_url || item.images?.jpg?.image_url || CONFIG.PLACEHOLDER_IMG;
            title = item.title_english || item.title || 'Unknown';
            year = item.year || (item.aired?.from ? new Date(item.aired.from).getFullYear() : '');
            rating = item.score ? item.score.toFixed(1) : 'N/A';
            detailUrl = `detail.html?type=anime&id=${item.mal_id}`;
        }

        ratingColor = getRatingColor(parseFloat(rating));

        card.innerHTML = `
            <a href="${detailUrl}" class="card-link" aria-label="${title}">
                <div class="card-poster">
                    <img src="${posterUrl}" alt="${title}" loading="lazy" onerror="this.src='${CONFIG.PLACEHOLDER_IMG}'" />
                    <div class="card-overlay">
                        <div class="card-play-btn" aria-label="View Details">
                            <svg width="30" height="30" viewBox="0 0 24 24" fill="white"><polygon points="5,3 19,12 5,21"/></svg>
                        </div>
                        <div class="card-info-overlay">
                            <div class="card-overlay-title">${title}</div>
                            <div class="card-overlay-meta">
                                <span class="card-rating" style="color:${ratingColor}">★ ${rating}</span>
                                ${year ? `<span class="card-year">${year}</span>` : ''}
                            </div>
                        </div>
                    </div>
                </div>
                <div class="card-details">
                    <h3 class="card-title">${title}</h3>
                    <div class="card-meta">
                        <span class="card-rating-sm" style="color:${ratingColor}">★ ${rating}</span>
                        ${year ? `<span class="card-year-sm">${year}</span>` : ''}
                    </div>
                </div>
            </a>
            <button class="card-bookmark" aria-label="Add to My List" onclick="event.preventDefault();event.stopPropagation();MyList.toggle({id:'${type === 'anime' ? item.mal_id : item.id}',type:'${type}',title:'${title.replace(/'/g, "\\'")}',poster:'${posterUrl.replace(/'/g, "\\'")}',rating:'${rating}',year:'${year}'}, this)">
                ${MyList.has(type === 'anime' ? item.mal_id : item.id, type) ? '✓' : '+'}
            </button>
        `;

        return card;
    }

    function getRatingColor(rating) {
        if (isNaN(rating)) return '#888';
        if (rating >= 7) return '#4caf50';
        if (rating >= 5) return '#ffc107';
        return '#f44336';
    }

    // =============================================
    // Content Row (Netflix-style horizontal scroll)
    // =============================================
    function createContentRow(title, containerId) {
        return `
            <section class="content-row" id="${containerId}-section">
                <div class="row-header">
                    <h2 class="row-title">${title}</h2>
                    <div class="row-nav">
                        <button class="row-arrow row-arrow-left" data-target="${containerId}" aria-label="Scroll left">‹</button>
                        <button class="row-arrow row-arrow-right" data-target="${containerId}" aria-label="Scroll right">›</button>
                    </div>
                </div>
                <div class="row-slider" id="${containerId}">
                    ${generateSkeletonCards(8)}
                </div>
            </section>
        `;
    }

    function populateRow(containerId, items, type = 'movie') {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = '';
        if (!items || items.length === 0) {
            container.innerHTML = '<p class="row-empty">No content available</p>';
            return;
        }
        items.forEach(item => {
            const card = createMovieCard(item, type);
            container.appendChild(card);
        });
    }

    // =============================================
    // Skeleton Loaders
    // =============================================
    function generateSkeletonCards(count = 6) {
        return Array(count).fill('').map(() => `
            <div class="skeleton-card">
                <div class="skeleton-poster skeleton-shimmer"></div>
                <div class="skeleton-title skeleton-shimmer"></div>
                <div class="skeleton-meta skeleton-shimmer"></div>
            </div>
        `).join('');
    }

    function generateSkeletonGrid(count = 12) {
        return Array(count).fill('').map(() => `
            <div class="skeleton-card grid-skeleton">
                <div class="skeleton-poster skeleton-shimmer"></div>
                <div class="skeleton-title skeleton-shimmer"></div>
                <div class="skeleton-meta skeleton-shimmer"></div>
            </div>
        `).join('');
    }

    // =============================================
    // Row Arrow Scrolling
    // =============================================
    function initRowArrows() {
        document.addEventListener('click', (e) => {
            const arrow = e.target.closest('.row-arrow');
            if (!arrow) return;
            const targetId = arrow.dataset.target;
            const slider = document.getElementById(targetId);
            if (!slider) return;
            const scrollAmount = slider.clientWidth * 0.8;
            slider.scrollBy({
                left: arrow.classList.contains('row-arrow-left') ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        });
    }

    // =============================================
    // Hero Banner
    // =============================================
    function renderHero(container, item, type = 'movie') {
        let backdrop, title, overview, rating, year, detailUrl;

        if (type === 'movie' || type === 'tv') {
            backdrop = API.TMDB.backdropUrl(item.backdrop_path);
            title = item.title || item.name || 'Unknown';
            overview = item.overview || '';
            rating = item.vote_average ? item.vote_average.toFixed(1) : '';
            year = (item.release_date || item.first_air_date || '').slice(0, 4);
            detailUrl = `detail.html?type=${type}&id=${item.id}`;
        } else if (type === 'anime') {
            backdrop = item.images?.jpg?.large_image_url || CONFIG.PLACEHOLDER_BACKDROP;
            title = item.title_english || item.title || 'Unknown';
            overview = item.synopsis || '';
            rating = item.score ? item.score.toFixed(1) : '';
            year = item.year || '';
            detailUrl = `detail.html?type=anime&id=${item.mal_id}`;
        } else if (type === 'tvmaze') {
            backdrop = item.image ? (item.image.original || item.image.medium) : CONFIG.PLACEHOLDER_BACKDROP;
            title = item.name || 'Unknown';
            overview = item.summary ? item.summary.replace(/<[^>]+>/g, '') : '';
            rating = item.rating?.average ? item.rating.average.toFixed(1) : '';
            year = item.premiered ? item.premiered.slice(0, 4) : '';
            detailUrl = `detail.html?type=tvmaze&id=${item.id}`;
        }

        if (overview.length > 200) overview = overview.slice(0, 200) + '...';

        container.innerHTML = `
            <div class="hero-backdrop" style="background-image: url('${backdrop}')"></div>
            <div class="hero-gradient"></div>
            <div class="hero-content">
                <h1 class="hero-title">${title}</h1>
                <div class="hero-meta">
                    ${rating ? `<span class="hero-rating">★ ${rating}</span>` : ''}
                    ${year ? `<span class="hero-year">${year}</span>` : ''}
                </div>
                <p class="hero-overview">${overview}</p>
                <div class="hero-actions">
                    <a href="${detailUrl}" class="btn btn-primary hero-btn">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
                        Watch Trailer
                    </a>
                    <button class="btn btn-secondary hero-btn" onclick="MyList.toggle({id:'${type === 'anime' ? item.mal_id : item.id}',type:'${type}',title:'${title.replace(/'/g, "\\'")}',poster:'${type === 'movie' || type === 'tv' ? API.TMDB.imgUrl(item.poster_path) : backdrop}',rating:'${rating}',year:'${year}'}, this)">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
                        My List
                    </button>
                </div>
            </div>
        `;
        container.classList.add('hero-loaded');
    }

    // =============================================
    // Trailer Modal
    // =============================================
    function openTrailerModal(videoKey, isEmbed = false, title = "Video") {
        const existing = document.getElementById('trailerModal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'trailerModal';
        modal.className = 'modal-overlay';

        let iframeSrc = isEmbed
            ? videoKey // Full embed URL passed
            : `https://www.youtube.com/embed/${videoKey}?autoplay=1&rel=0`;

        modal.innerHTML = `
            <div class="modal-content trailer-modal ${isEmbed ? 'full-playback-modal' : ''}">
                <button class="modal-close" aria-label="Close">&times;</button>
                ${isEmbed ? `<div class="playback-header"><h2>Now Playing: ${title}</h2></div>` : ''}
                <div class="trailer-wrapper">
                    <iframe src="${iframeSrc}" 
                        frameborder="0" allowfullscreen allow="autoplay; encrypted-media" title="${isEmbed ? 'Full Video' : 'Trailer'}"></iframe>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
        requestAnimationFrame(() => modal.classList.add('active'));

        modal.querySelector('.modal-close').addEventListener('click', () => closeModal(modal));
        modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(modal); });
        document.addEventListener('keydown', function handler(e) {
            if (e.key === 'Escape') { closeModal(modal); document.removeEventListener('keydown', handler); }
        });
    }

    function closeModal(modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        setTimeout(() => modal.remove(), 300);
    }

    // =============================================
    // Back to Top Button
    // =============================================
    function initBackToTop() {
        const btn = document.createElement('button');
        btn.id = 'backToTop';
        btn.className = 'back-to-top';
        btn.setAttribute('aria-label', 'Back to top');
        btn.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18,15 12,9 6,15"/></svg>`;
        document.body.appendChild(btn);

        window.addEventListener('scroll', () => {
            btn.classList.toggle('visible', window.scrollY > 500);
        }, { passive: true });

        btn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // =============================================
    // Scroll Reveal Animation
    // =============================================
    function initScrollReveal() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

        document.querySelectorAll('.content-row').forEach(row => observer.observe(row));
    }

    // =============================================
    // Toast Notification / Error Display
    // =============================================
    function showToast(message, type = 'info') {
        const existing = document.querySelector('.toast-notification');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = `toast-notification toast-${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    function showError(container, message = 'Something went wrong', retryFn = null) {
        container.innerHTML = `
            <div class="error-display">
                <img class="error-illustration" src="${CONFIG.ERROR_ILLUSTRATION}" alt="" aria-hidden="true" />
                <p class="error-message">${message}</p>
                ${retryFn ? '<button class="btn btn-primary error-retry">Retry</button>' : ''}
            </div>
        `;
        if (retryFn) {
            container.querySelector('.error-retry').addEventListener('click', retryFn);
        }
    }

    // =============================================
    // Lazy Load Images
    // =============================================
    function initLazyLoad() {
        if ('IntersectionObserver' in window) {
            const imgObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        if (img.dataset.src) {
                            img.src = img.dataset.src;
                            img.removeAttribute('data-src');
                        }
                        imgObserver.unobserve(img);
                    }
                });
            });
            document.querySelectorAll('img[data-src]').forEach(img => imgObserver.observe(img));
        }
    }

    // Public UI API
    return {
        renderNav,
        renderFooter,
        createMovieCard,
        createContentRow,
        populateRow,
        generateSkeletonCards,
        generateSkeletonGrid,
        getRatingColor,
        initRowArrows,
        renderHero,
        openTrailerModal,
        closeModal,
        initBackToTop,
        initScrollReveal,
        initLazyLoad,
        showError,
        showToast,
        Auth,
    };
})();
