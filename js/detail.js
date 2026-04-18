/**
 * CLOCKWATCH - Detail Page Logic
 * Dynamic detail page for Movies, TV Shows, and Anime
 */

const DetailPage = (() => {
    let contentType = '';
    let contentId = '';

    async function init() {
        UI.renderNav('');
        UI.renderFooter();
        UI.initBackToTop();

        const params = new URLSearchParams(window.location.search);
        contentType = params.get('type') || 'movie';
        contentId = params.get('id') || '';

        if (!contentId) {
            document.getElementById('detail-content').innerHTML = `
                <div class="error-display" style="padding-top:150px;">
                    <div class="error-icon">Error</div>
                    <p class="error-message">No content specified</p>
                    <a href="index.html" class="btn btn-primary">Go Home</a>
                </div>`;
            return;
        }

        switch (contentType) {
            case 'movie': await loadMovieDetail(); break;
            case 'tv': await loadTVDetailTMDB(); break;
            case 'tvmaze': await loadTVMazeDetail(); break;
            case 'anime': await loadAnimeDetail(); break;
            case 'anilist': await loadAniListDetail(); break;
            default: await loadMovieDetail();
        }

        // Reveal sections on scroll
        setTimeout(() => {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('revealed');
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.1 });
            document.querySelectorAll('.detail-section').forEach(s => observer.observe(s));
        }, 300);
    }

    // =============================================
    // Movie Detail (TMDB + OMDB)
    // =============================================
    async function loadMovieDetail() {
        const container = document.getElementById('detail-content');
        container.innerHTML = `<div class="loading-spinner" style="padding-top:200px;"><div class="spinner"></div></div>`;

        try {
            const movie = await API.TMDB.movieDetails(contentId);
            document.title = `${movie.title} - Dororo`;

            // Fetch OMDB data
            let omdbData = null;
            try {
                if (movie.external_ids?.imdb_id) {
                    omdbData = await API.OMDB.byImdbId(movie.external_ids.imdb_id);
                } else {
                    omdbData = await API.OMDB.byTitle(movie.title);
                }
                if (omdbData?.Response === 'False') omdbData = null;
            } catch { /* OMDB optional */ }

            const backdrop = API.TMDB.backdropUrl(movie.backdrop_path);
            const poster = API.TMDB.imgUrl(movie.poster_path, 'w500');
            const trailer = movie.videos?.results?.find(v => v.type === 'Trailer' && v.site === 'YouTube');
            const cast = (movie.credits?.cast || []).slice(0, 15);
            const similar = (movie.similar?.results || []).slice(0, 12);

            // Ratings
            const tmdbRating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';
            const imdbRating = omdbData?.imdbRating || 'N/A';
            const rtRating = omdbData?.Ratings?.find(r => r.Source === 'Rotten Tomatoes')?.Value || 'N/A';
            const boxOffice = omdbData?.BoxOffice || 'N/A';
            const awards = omdbData?.Awards || '';

            container.innerHTML = `
                <div class="detail-hero">
                    <div class="hero-backdrop" style="background-image:url('${backdrop}')"></div>
                    <div class="hero-gradient"></div>
                </div>
                <div class="detail-main">
                    <div class="detail-top">
                        <div class="detail-poster">
                            <img src="${poster}" alt="${movie.title}" onerror="this.src='${CONFIG.PLACEHOLDER_IMG}'" />
                        </div>
                        <div class="detail-info">
                            <h1 class="detail-title">${movie.title}</h1>
                            ${movie.tagline ? `<p class="detail-tagline">"${movie.tagline}"</p>` : ''}
                            <div class="detail-ratings">
                                <div class="rating-badge">
                                    <span style="color:var(--color-gold)">★</span>
                                    <span>${tmdbRating}</span>
                                    <span class="rating-label">TMDB</span>
                                </div>
                                ${imdbRating !== 'N/A' ? `
                                <div class="rating-badge">
                                    <span style="color:#f5c518">★</span>
                                    <span>${imdbRating}</span>
                                    <span class="rating-label">IMDb</span>
                                </div>` : ''}
                                ${rtRating !== 'N/A' ? `
                                <div class="rating-badge">
                                    <span>RT</span>
                                    <span>${rtRating}</span>
                                    <span class="rating-label"></span>
                                </div>` : ''}
                            </div>
                            <div class="detail-meta-row">
                                ${movie.release_date ? `<span class="meta-tag">Date: ${movie.release_date}</span>` : ''}
                                ${movie.runtime ? `<span class="meta-tag">Time: ${movie.runtime} min</span>` : ''}
                                ${movie.genres ? movie.genres.map(g => `<span class="meta-tag">${g.name}</span>`).join('') : ''}
                                ${omdbData?.Rated && omdbData.Rated !== 'N/A' ? `<span class="meta-tag">Rated: ${omdbData.Rated}</span>` : ''}
                            </div>
                            <p class="detail-overview">${movie.overview || ''}</p>
                            ${awards ? `<p style="color:var(--color-gold);margin-bottom:16px;">Awards: ${awards}</p>` : ''}
                            ${boxOffice !== 'N/A' ? `<p style="margin-bottom:16px;color:var(--color-text-muted);">Box Office: ${boxOffice}</p>` : ''}
                            <div class="detail-actions">
                                <button class="btn btn-primary" onclick="UI.openTrailerModal('https://vidsrc.to/embed/movie/${movie.id}', true, '${movie.title.replace(/'/g, "\\'")}')">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
                                    Play Movie
                                </button>
                                ${trailer ? `<button class="btn btn-secondary" onclick="UI.openTrailerModal('${trailer.key}')">
                                    Trailer
                                </button>` : ''}
                                <button class="btn btn-secondary" onclick="MyList.toggle({id:'${movie.id}',type:'movie',title:'${movie.title.replace(/'/g, "\\'")}',poster:'${poster}',rating:'${tmdbRating}',year:'${(movie.release_date||'').slice(0,4)}'}, this)">
                                    ${MyList.has(movie.id, 'movie') ? '✓ In My List' : '+ Add to List'}
                                </button>
                            </div>
                        </div>
                    </div>

                    ${cast.length > 0 ? `
                    <div class="detail-section">
                        <h2 class="detail-section-title">Cast</h2>
                        <div class="cast-list">
                            ${cast.map(c => `
                                <div class="cast-card">
                                    <img src="${API.TMDB.profileUrl(c.profile_path)}" alt="${c.name}" loading="lazy" onerror="this.src='${CONFIG.PLACEHOLDER_PROFILE}'" />
                                    <div class="cast-name">${c.name}</div>
                                    <div class="cast-character">${c.character || ''}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>` : ''}

                    ${similar.length > 0 ? `
                    <div class="detail-section">
                        <h2 class="detail-section-title">Similar Movies</h2>
                        <div class="content-grid">
                            ${similar.map(m => UI.createMovieCard(m, 'movie').outerHTML).join('')}
                        </div>
                    </div>` : ''}
                </div>
            `;
        } catch (err) {
            console.error('Movie detail error:', err);
            UI.showError(container, 'Failed to load movie details. Please try again.', () => loadMovieDetail());
        }
    }

    // =============================================
    // TV Detail (TMDB)
    // =============================================
    async function loadTVDetailTMDB() {
        const container = document.getElementById('detail-content');
        container.innerHTML = `<div class="loading-spinner" style="padding-top:200px;"><div class="spinner"></div></div>`;

        try {
            const show = await API.TMDB.tvDetails(contentId);
            document.title = `${show.name || show.title} - Dororo`;
            const backdrop = API.TMDB.backdropUrl(show.backdrop_path);
            const poster = API.TMDB.imgUrl(show.poster_path, 'w500');
            const rating = show.vote_average ? show.vote_average.toFixed(1) : 'N/A';
            const cast = (show.credits?.cast || []).slice(0, 15);
            const similar = (show.similar?.results || []).slice(0, 12);

            container.innerHTML = `
                <div class="detail-hero">
                    <div class="hero-backdrop" style="background-image:url('${backdrop}')"></div>
                    <div class="hero-gradient"></div>
                </div>
                <div class="detail-main">
                    <div class="detail-top">
                        <div class="detail-poster">
                            <img src="${poster}" alt="${show.name}" onerror="this.src='${CONFIG.PLACEHOLDER_IMG}'" />
                        </div>
                        <div class="detail-info">
                            <h1 class="detail-title">${show.name || show.title}</h1>
                            <div class="detail-ratings">
                                <div class="rating-badge"><span style="color:var(--color-gold)">★</span><span>${rating}</span><span class="rating-label">TMDB</span></div>
                            </div>
                            <div class="detail-meta-row">
                                ${show.first_air_date ? `<span class="meta-tag">Date: ${show.first_air_date}</span>` : ''}
                                ${show.genres ? show.genres.map(g => `<span class="meta-tag">${g.name}</span>`).join('') : ''}
                                ${show.status ? `<span class="meta-tag">${show.status}</span>` : ''}
                            </div>
                            <p class="detail-overview">${show.overview || ''}</p>
                            <div class="detail-actions">
                                <button class="btn btn-primary" onclick="UI.openTrailerModal('https://vidsrc.to/embed/tv/${show.id}', true, '${(show.name||show.title).replace(/'/g, "\\'")}')">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
                                    Play Show
                                </button>
                                <button class="btn btn-secondary" onclick="MyList.toggle({id:'${show.id}',type:'tv',title:'${(show.name||'').replace(/'/g, "\\'")}',poster:'${poster}',rating:'${rating}',year:'${(show.first_air_date||'').slice(0,4)}'}, this)">
                                    ${MyList.has(show.id, 'tv') ? '✓ In My List' : '+ Add to List'}
                                </button>
                            </div>
                        </div>
                    </div>
                    ${cast.length > 0 ? `
                    <div class="detail-section"><h2 class="detail-section-title">Cast</h2>
                        <div class="cast-list">${cast.map(c => `
                            <div class="cast-card">
                                <img src="${API.TMDB.profileUrl(c.profile_path)}" alt="${c.name}" loading="lazy" onerror="this.src='${CONFIG.PLACEHOLDER_PROFILE}'" />
                                <div class="cast-name">${c.name}</div><div class="cast-character">${c.character || ''}</div>
                            </div>`).join('')}
                        </div>
                    </div>` : ''}
                    ${similar.length > 0 ? `
                    <div class="detail-section"><h2 class="detail-section-title">Similar Shows</h2>
                        <div class="content-grid">${similar.map(m => UI.createMovieCard(m, 'tv').outerHTML).join('')}</div>
                    </div>` : ''}
                </div>`;
        } catch (err) {
            console.error('TV detail error:', err);
            UI.showError(container, 'Failed to load show details. Please try again.', () => loadTVDetailTMDB());
        }
    }

    // =============================================
    // TVMaze Detail
    // =============================================
    async function loadTVMazeDetail() {
        const container = document.getElementById('detail-content');
        container.innerHTML = `<div class="loading-spinner" style="padding-top:200px;"><div class="spinner"></div></div>`;

        try {
            const show = await API.TVMAZE.showDetails(contentId);
            document.title = `${show.name} - Dororo`;
            const backdrop = show.image ? (show.image.original || show.image.medium) : CONFIG.PLACEHOLDER_BACKDROP;
            const poster = show.image ? (show.image.medium || show.image.original) : CONFIG.PLACEHOLDER_IMG;
            const rating = show.rating?.average ? show.rating.average.toFixed(1) : 'N/A';
            const summary = show.summary ? show.summary.replace(/<[^>]+>/g, '') : '';
            const cast = show._embedded?.cast || [];
            const episodes = show._embedded?.episodes || [];

            // Group episodes by season
            const seasons = {};
            episodes.forEach(ep => {
                if (!seasons[ep.season]) seasons[ep.season] = [];
                seasons[ep.season].push(ep);
            });

            container.innerHTML = `
                <div class="detail-hero">
                    <div class="hero-backdrop" style="background-image:url('${backdrop}')"></div>
                    <div class="hero-gradient"></div>
                </div>
                <div class="detail-main">
                    <div class="detail-top">
                        <div class="detail-poster">
                            <img src="${poster}" alt="${show.name}" onerror="this.src='${CONFIG.PLACEHOLDER_IMG}'" />
                        </div>
                        <div class="detail-info">
                            <h1 class="detail-title">${show.name}</h1>
                            <div class="detail-ratings">
                                <div class="rating-badge"><span style="color:var(--color-gold)">★</span><span>${rating}</span><span class="rating-label">TVMaze</span></div>
                            </div>
                            <div class="detail-meta-row">
                                ${show.network?.name ? `<span class="meta-tag">Network: ${show.network.name}</span>` : ''}
                                ${show.premiered ? `<span class="meta-tag">Date: ${show.premiered}</span>` : ''}
                                ${show.status ? `<span class="meta-tag">${show.status}</span>` : ''}
                                ${show.runtime ? `<span class="meta-tag">Time: ${show.runtime} min</span>` : ''}
                                ${(show.genres || []).map(g => `<span class="meta-tag">${g}</span>`).join('')}
                            </div>
                            <p class="detail-overview">${summary}</p>
                            <div class="detail-actions">
                                ${show.externals?.imdb ? `
                                <button class="btn btn-primary" onclick="UI.openTrailerModal('https://vidsrc.to/embed/tv/${show.externals.imdb}', true, '${show.name.replace(/'/g, "\\'")}')">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
                                    Play Show
                                </button>` : ''}
                                <button class="btn btn-secondary" onclick="MyList.toggle({id:'${show.id}',type:'tvmaze',title:'${show.name.replace(/'/g, "\\'")}',poster:'${poster}',rating:'${rating}',year:'${(show.premiered||'').slice(0,4)}'}, this)">
                                    ${MyList.has(show.id, 'tvmaze') ? '✓ In My List' : '+ Add to List'}
                                </button>
                            </div>
                        </div>
                    </div>

                    ${cast.length > 0 ? `
                    <div class="detail-section">
                        <h2 class="detail-section-title">Cast</h2>
                        <div class="cast-list">${cast.slice(0, 15).map(c => `
                            <div class="cast-card">
                                <img src="${c.person?.image?.medium || CONFIG.PLACEHOLDER_PROFILE}" alt="${c.person?.name || ''}" loading="lazy" onerror="this.src='${CONFIG.PLACEHOLDER_PROFILE}'" />
                                <div class="cast-name">${c.person?.name || ''}</div>
                                <div class="cast-character">${c.character?.name || ''}</div>
                            </div>`).join('')}
                        </div>
                    </div>` : ''}

                    ${Object.keys(seasons).length > 0 ? `
                    <div class="detail-section">
                        <h2 class="detail-section-title">Episodes</h2>
                        ${Object.entries(seasons).map(([sNum, eps]) => `
                            <div class="season-accordion" onclick="this.classList.toggle('open')">
                                <div class="season-header">
                                    <h3>Season ${sNum} <span class="text-muted">(${eps.length} episodes)</span></h3>
                                    <span class="season-arrow">▼</span>
                                </div>
                                <div class="season-episodes">
                                    ${eps.map(ep => `
                                        <div class="episode-item">
                                            <span class="episode-number">${ep.number || '-'}</span>
                                            <div class="episode-info">
                                                <div class="episode-title">${ep.name || 'TBA'}</div>
                                                <div class="episode-date">${ep.airdate || ''}</div>
                                            </div>
                                        </div>`).join('')}
                                </div>
                            </div>`).join('')}
                    </div>` : ''}
                </div>
            `;
        } catch (err) {
            console.error('TVMaze detail error:', err);
            UI.showError(container, 'Failed to load show details. Please try again.', () => loadTVMazeDetail());
        }
    }

    // =============================================
    // Anime Detail (Jikan)
    // =============================================
    async function loadAnimeDetail() {
        const container = document.getElementById('detail-content');
        container.innerHTML = `<div class="loading-spinner" style="padding-top:200px;"><div class="spinner"></div></div>`;

        try {
            const res = await API.JIKAN.animeDetails(contentId);
            const anime = res.data;
            document.title = `${anime.title_english || anime.title} - Dororo`;

            const backdrop = anime.images?.jpg?.large_image_url || CONFIG.PLACEHOLDER_BACKDROP;
            const poster = anime.images?.jpg?.large_image_url || CONFIG.PLACEHOLDER_IMG;
            const score = anime.score ? anime.score.toFixed(1) : 'N/A';

            // Load characters
            let characters = [];
            try {
                await new Promise(r => setTimeout(r, 400)); // Jikan rate limit
                const charRes = await API.JIKAN.animeCharacters(contentId);
                characters = (charRes.data || []).slice(0, 15);
            } catch { /* optional */ }

            // Load recommendations
            let recommendations = [];
            try {
                await new Promise(r => setTimeout(r, 400));
                const recRes = await API.JIKAN.animeRecommendations(contentId);
                recommendations = (recRes.data || []).slice(0, 12);
            } catch { /* optional */ }

            container.innerHTML = `
                <div class="detail-hero">
                    <div class="hero-backdrop" style="background-image:url('${backdrop}')"></div>
                    <div class="hero-gradient"></div>
                </div>
                <div class="detail-main">
                    <div class="detail-top">
                        <div class="detail-poster">
                            <img src="${poster}" alt="${anime.title}" onerror="this.src='${CONFIG.PLACEHOLDER_IMG}'" />
                        </div>
                        <div class="detail-info">
                            <h1 class="detail-title">${anime.title_english || anime.title}</h1>
                            ${anime.title_japanese ? `<p class="detail-tagline">${anime.title_japanese}</p>` : ''}
                            <div class="detail-ratings">
                                <div class="rating-badge"><span style="color:var(--color-gold)">★</span><span>${score}</span><span class="rating-label">MAL</span></div>
                                ${anime.rank ? `<div class="rating-badge"><span>Rank:</span><span>#${anime.rank}</span><span class="rating-label"></span></div>` : ''}
                                ${anime.popularity ? `<div class="rating-badge"><span>Pop:</span><span>#${anime.popularity}</span><span class="rating-label"></span></div>` : ''}
                            </div>
                            <div class="detail-meta-row">
                                ${anime.type ? `<span class="meta-tag">${anime.type}</span>` : ''}
                                ${anime.episodes ? `<span class="meta-tag">Eps: ${anime.episodes}</span>` : ''}
                                ${anime.duration ? `<span class="meta-tag">Time: ${anime.duration}</span>` : ''}
                                ${anime.status ? `<span class="meta-tag">${anime.status}</span>` : ''}
                                ${anime.rating ? `<span class="meta-tag">Rated: ${anime.rating}</span>` : ''}
                                ${(anime.genres || []).map(g => `<span class="meta-tag">${g.name}</span>`).join('')}
                            </div>
                            <p class="detail-overview">${anime.synopsis || ''}</p>
                            ${anime.studios?.length ? `<p style="margin-bottom:12px;color:var(--color-text-muted);">Studio: ${anime.studios.map(s => s.name).join(', ')}</p>` : ''}
                            ${anime.producers?.length ? `<p style="margin-bottom:16px;color:var(--color-text-muted);">Producers: ${anime.producers.map(p => p.name).join(', ')}</p>` : ''}
                            <div class="detail-actions">
                                <button class="btn btn-primary" onclick="DetailPage.watchAnime('${(anime.title_english || anime.title).replace(/'/g, "\\'")}')">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
                                    Watch Anime
                                </button>
                                ${anime.trailer?.youtube_id ? `<button class="btn btn-secondary" onclick="UI.openTrailerModal('${anime.trailer.youtube_id}')">
                                    Trailer
                                </button>` : ''}
                                <button class="btn btn-secondary" onclick="MyList.toggle({id:'${anime.mal_id}',type:'anime',title:'${(anime.title_english || anime.title).replace(/'/g, "\\'")}',poster:'${poster}',rating:'${score}',year:'${anime.year || ''}'}, this)">
                                    ${MyList.has(anime.mal_id, 'anime') ? '✓ In My List' : '+ Add to List'}
                                </button>
                            </div>
                        </div>
                    </div>

                    ${characters.length > 0 ? `
                    <div class="detail-section">
                        <h2 class="detail-section-title">Characters</h2>
                        <div class="cast-list">${characters.map(c => `
                            <div class="cast-card">
                                <img src="${c.character?.images?.jpg?.image_url || CONFIG.PLACEHOLDER_PROFILE}" alt="${c.character?.name || ''}" loading="lazy" onerror="this.src='${CONFIG.PLACEHOLDER_PROFILE}'" />
                                <div class="cast-name">${c.character?.name || ''}</div>
                                <div class="cast-character">${c.role || ''}</div>
                            </div>`).join('')}
                        </div>
                    </div>` : ''}

                    ${recommendations.length > 0 ? `
                    <div class="detail-section">
                        <h2 class="detail-section-title">Recommendations</h2>
                        <div class="content-grid">${recommendations.map(r => {
                            const entry = r.entry;
                            return `<div class="content-card">
                                <a href="detail.html?type=anime&id=${entry.mal_id}" class="card-link">
                                    <div class="card-poster">
                                        <img src="${entry.images?.jpg?.large_image_url || CONFIG.PLACEHOLDER_IMG}" alt="${entry.title}" loading="lazy" onerror="this.src='${CONFIG.PLACEHOLDER_IMG}'" />
                                    </div>
                                    <div class="card-details">
                                        <h3 class="card-title">${entry.title}</h3>
                                    </div>
                                </a>
                            </div>`;
                        }).join('')}</div>
                    </div>` : ''}
                </div>
            `;
        } catch (err) {
            console.error('Anime detail error:', err);
            UI.showError(container, 'Failed to load anime details. MAL might be rate-limiting.', () => loadAnimeDetail());
        }
    }

    // =============================================
    // AniList Detail
    // =============================================
    async function loadAniListDetail() {
        const container = document.getElementById('detail-content');
        container.innerHTML = `<div class="loading-spinner" style="padding-top:200px;"><div class="spinner"></div></div>`;

        try {
            const res = await API.ANILIST.details(parseInt(contentId));
            const anime = res.data.Media;
            const title = API.ANILIST.titleText(anime);
            document.title = `${title} - Dororo`;

            const backdrop = API.ANILIST.bannerUrl(anime);
            const poster = API.ANILIST.imgUrl(anime);
            const score = anime.averageScore ? (anime.averageScore / 10).toFixed(1) : 'N/A';
            const year = anime.seasonYear || anime.startDate?.year || '';
            const studio = anime.studios?.nodes?.[0]?.name || '';
            const description = (anime.description || '').replace(/<[^>]+>/g, '');

            // Characters
            const characters = anime.characters?.nodes || [];
            const charEdges = anime.characters?.edges || [];

            // Recommendations
            const recs = (anime.recommendations?.nodes || []).filter(r => r.mediaRecommendation).slice(0, 12);

            container.innerHTML = `
                <div class="detail-hero">
                    <div class="hero-backdrop" style="background-image:url('${backdrop}')"></div>
                    <div class="hero-gradient"></div>
                </div>
                <div class="detail-main">
                    <div class="detail-top">
                        <div class="detail-poster">
                            <img src="${poster}" alt="${title}" onerror="this.src='${CONFIG.PLACEHOLDER_IMG}'" />
                        </div>
                        <div class="detail-info">
                            <h1 class="detail-title">${title}</h1>
                            ${anime.title?.native ? `<p class="detail-tagline">${anime.title.native}</p>` : ''}
                            <div class="detail-ratings">
                                <div class="rating-badge"><span style="color:var(--color-gold)">★</span><span>${score}</span><span class="rating-label">AniList</span></div>
                                ${anime.popularity ? `<div class="rating-badge"><span>Pop:</span><span>#${anime.popularity}</span><span class="rating-label"></span></div>` : ''}
                            </div>
                            <div class="detail-meta-row">
                                ${anime.format ? `<span class="meta-tag">${anime.format}</span>` : ''}
                                ${anime.episodes ? `<span class="meta-tag">Eps: ${anime.episodes}</span>` : ''}
                                ${anime.duration ? `<span class="meta-tag">Time: ${anime.duration} min</span>` : ''}
                                ${anime.status ? `<span class="meta-tag">${anime.status}</span>` : ''}
                                ${anime.season && year ? `<span class="meta-tag">${anime.season} ${year}</span>` : ''}
                                ${(anime.genres || []).map(g => `<span class="meta-tag">${g}</span>`).join('')}
                            </div>
                            <p class="detail-overview">${description}</p>
                            ${studio ? `<p style="margin-bottom:12px;color:var(--color-text-muted);">Studio: ${studio}</p>` : ''}
                            <div class="detail-actions">
                                <button class="btn btn-primary" onclick="DetailPage.watchAnime('${title.replace(/'/g, "\\'")}')">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
                                    Watch Anime
                                </button>
                                ${anime.trailer?.id && anime.trailer?.site === 'youtube' ? `<button class="btn btn-secondary" onclick="UI.openTrailerModal('${anime.trailer.id}')">
                                    Trailer
                                </button>` : ''}
                                <button class="btn btn-secondary" onclick="MyList.toggle({id:'${anime.id}',type:'anilist',title:'${title.replace(/'/g, "\\'")}',poster:'${poster}',rating:'${score}',year:'${year}'}, this)">
                                    ${MyList.has(anime.id, 'anilist') ? '✓ In My List' : '+ Add to List'}
                                </button>
                            </div>
                        </div>
                    </div>

                    ${characters.length > 0 ? `
                    <div class="detail-section">
                        <h2 class="detail-section-title">Characters</h2>
                        <div class="cast-list">${characters.map((c, i) => `
                            <div class="cast-card">
                                <img src="${c.image?.large || c.image?.medium || CONFIG.PLACEHOLDER_PROFILE}" alt="${c.name?.full || ''}" loading="lazy" onerror="this.src='${CONFIG.PLACEHOLDER_PROFILE}'" />
                                <div class="cast-name">${c.name?.full || ''}</div>
                                <div class="cast-character">${charEdges[i]?.role || ''}</div>
                            </div>`).join('')}
                        </div>
                    </div>` : ''}

                    ${recs.length > 0 ? `
                    <div class="detail-section">
                        <h2 class="detail-section-title">Recommendations</h2>
                        <div class="content-grid">${recs.map(r => {
                            const rec = r.mediaRecommendation;
                            return `<div class="content-card">
                                <a href="detail.html?type=anilist&id=${rec.id}" class="card-link">
                                    <div class="card-poster">
                                        <img src="${rec.coverImage?.large || CONFIG.PLACEHOLDER_IMG}" alt="${rec.title?.english || rec.title?.romaji}" loading="lazy" onerror="this.src='${CONFIG.PLACEHOLDER_IMG}'" />
                                    </div>
                                    <div class="card-details">
                                        <h3 class="card-title">${rec.title?.english || rec.title?.romaji}</h3>
                                    </div>
                                </a>
                            </div>`;
                        }).join('')}</div>
                    </div>` : ''}
                </div>
            `;
        } catch (err) {
            console.error('AniList detail error:', err);
            UI.showError(container, 'Failed to load anime details from AniList.', () => loadAniListDetail());
        }
    }

    // =============================================
    // Watch Anime - TMDB lookup + vidsrc embed
    // =============================================
    async function watchAnime(title) {
        try {
            // Search TMDB for the anime title (most anime are TV shows on TMDB)
            const results = await API.TMDB.searchMulti(title);
            const match = (results.results || []).find(r =>
                (r.media_type === 'tv' || r.media_type === 'movie') &&
                (r.genre_ids?.includes(16) || r.name?.toLowerCase().includes(title.toLowerCase().slice(0, 8)) || r.title?.toLowerCase().includes(title.toLowerCase().slice(0, 8)))
            ) || results.results?.[0];

            if (match) {
                const type = match.media_type === 'movie' ? 'movie' : 'tv';
                const embedUrl = `https://vidsrc.to/embed/${type}/${match.id}`;
                const displayTitle = match.title || match.name || title;
                UI.openTrailerModal(embedUrl, true, displayTitle);
            } else {
                // Fallback: try direct embed with title search
                UI.showToast('Anime not found on streaming database. Try the trailer instead.', 'error');
            }
        } catch (err) {
            console.error('Watch anime error:', err);
            UI.showToast('Failed to load anime stream. Please try again.', 'error');
        }
    }

    return { init, watchAnime };
})();

document.addEventListener('DOMContentLoaded', DetailPage.init);
