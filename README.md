# ⏱ Dororo

Streaming Discovery Platform

> A production-ready, Netflix-inspired responsive web application.

Dororo is a modern, responsive web application for discovering movies, TV shows, and anime. Built with pure HTML, CSS, and Vanilla JavaScript — no frameworks, no build step required.

![Dororo](https://img.shields.io/badge/Dororo-E50914?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48dGV4dCB5PSIuOWVtIiBmb250LXNpemU9IjkwIj7imLE8L3RleHQ+PC9zdmc+&logoColor=white)

---

## GitHub Setup

### Recommended Repository Name

`Dororo-streaming-platform`

### Repository Description (GitHub About)

Netflix-inspired streaming discovery web app built with HTML, CSS, and vanilla JavaScript. Browse movies, TV shows, and anime using TMDB, OMDB, TVMaze, and Jikan APIs.

### How to Run Locally

Option 1: Node local server (included in this project)

```bash
node server.js
```

Then open `http://localhost:8000`.

Option 2: Python local server

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

### Push to GitHub

Create a new repository in your GitHub account with the name above, then run:

```bash
git init
git add .
git commit -m "Initial commit: Dororo streaming platform"
git branch -M main
git remote add origin https://github.com/<your-username>/Dororo-streaming-platform.git
git push -u origin main
```

If the remote already exists:

```bash
git remote set-url origin https://github.com/<your-username>/Dororo-streaming-platform.git
git push -u origin main
```

## 🌟 Features

- **📱 Fully Responsive** — Mobile, tablet, and desktop optimized
- **🎬 Multi-API Integration** — TMDB, OMDB, TVMaze, and Jikan (MAL)
- **🔍 Universal Search** — Search across all APIs simultaneously
- **❤️ Watchlist** — Save favorites with localStorage persistence
- **🎥 Trailer Modal** — Watch YouTube trailers in-app
- **🎨 Netflix-inspired UI** — Dark theme, smooth animations, glassmorphism
- **⚡ Performance** — API response caching, lazy loading, rate limiting
- **♿ Accessible** — ARIA labels, keyboard navigation, semantic HTML

## 📄 Pages

| Page | File | Description |
|------|------|-------------|
| Home | `index.html` | Hero carousel, 10 content rows |
| Movies | `movies.html` | Browse movies with genre/year/sort filters |
| TV Shows | `tvshows.html` | Browse TV shows with genre/status filters |
| Anime | `anime.html` | Browse anime by category and genre |
| Detail | `detail.html` | Dynamic detail view for any content type |
| Search | `search.html` | Multi-API search with tab filters |
| My List | `mylist.html` | Saved watchlist with type filters |

## 🖼 Web Description Gallery

The screenshots below are included in the README so the project has a visual web description right in the repo page.

<div align="center">
    <table>
        <tr>
            <td><img src="screenshots/Screenshot%202026-04-17%20023151.png" alt="Clockwatch screenshot 1" width="100%" /></td>
            <td><img src="screenshots/Screenshot%202026-04-17%20023205.png" alt="Clockwatch screenshot 2" width="100%" /></td>
        </tr>
        <tr>
            <td><img src="screenshots/Screenshot%202026-04-17%20023231.png" alt="Clockwatch screenshot 3" width="100%" /></td>
            <td><img src="screenshots/Screenshot%202026-04-17%20023248.png" alt="Clockwatch screenshot 4" width="100%" /></td>
        </tr>
        <tr>
            <td><img src="screenshots/Screenshot%202026-04-17%20023256.png" alt="Clockwatch screenshot 5" width="100%" /></td>
            <td><img src="screenshots/Screenshot%202026-04-17%20023304.png" alt="Clockwatch screenshot 6" width="100%" /></td>
        </tr>
    </table>
</div>

## 🔌 APIs Used

| API | Purpose | Key Required |
|-----|---------|:---:|
| [TMDB](https://www.themoviedb.org) | Movie & TV data, posters, trailers | ✅ |
| [OMDB](https://www.omdbapi.com) | IMDb ratings, Rotten Tomatoes, box office | ✅ |
| [TVMaze](https://www.tvmaze.com) | TV show details, episodes, schedules | ⚡ |
| [Jikan](https://jikan.moe) | Anime data from MyAnimeList | ❌ |

## 📁 Project Structure

```
clockwatch/
├── index.html          # Homepage
├── movies.html         # Movies browse page
├── tvshows.html        # TV Shows page
├── anime.html          # Anime page
├── detail.html         # Detail page (all types)
├── search.html         # Search results
├── mylist.html         # Watchlist
├── screenshots/        # Saved UI screenshots
├── vercel.json         # Vercel deployment config
├── css/
│   ├── style.css       # Main styles (variables, components)
│   ├── animations.css  # Animations & transitions
│   └── responsive.css  # Media queries
└── js/
    ├── config.js       # API keys & constants
    ├── api.js          # Centralized API calls with caching
    ├── ui.js           # Shared UI components
    ├── mylist.js       # Watchlist module (localStorage)
    ├── app.js          # Homepage logic
    ├── search.js       # Search page logic
    └── detail.js       # Detail page logic
```

## 🚀 Deployment

### Vercel (Recommended)

1. Push or connect this repo to [Vercel](https://vercel.com)
2. No build command or framework configuration needed
3. Vercel will serve the static files automatically

### Any Static Host

This is a pure static site — just upload the files to any web server:
- Netlify
- GitHub Pages
- Cloudflare Pages
- Any Apache/Nginx server

### Local Development

Just open `index.html` in a browser, or use a local server:

```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve .

# Using PHP
php -S localhost:8000
```

## ⚙️ Configuration

API keys are stored in `js/config.js`. To use your own keys:

```javascript
const CONFIG = {
    TMDB: { API_KEY: 'your_tmdb_key', ... },
    OMDB: { API_KEY: 'your_omdb_key', ... },
    // ...
};
```

## 📊 Rate Limiting

Built-in rate limiting protects against API throttling:

| API | Limit | Built-in Delay |
|-----|-------|-------|
| TMDB | 40 req/10s | 100ms |
| OMDB | 1000 req/day | — |
| TVMaze | 20 req/10s | 250ms |
| Jikan | 3 req/s | 350ms |

## 🎨 Design System

- **Font:** Inter + Poppins (Google Fonts)
- **Background:** `#141414` (Netflix dark)
- **Primary:** `#E50914` (Netflix red)
- **Cards:** `#1e1e1e` with hover scale + glow
- **Ratings:** Green (7+), Yellow (5-7), Red (<5)
- **Animations:** Fade-in, stagger, skeleton shimmer, scroll reveal

## 📜 License

Website created by Siam Hossain, AI help Claude. All rights reserved.

This product uses the TMDB API but is not endorsed or certified by TMDB.
Data provided by OMDB API, TVMaze, and Jikan/MyAnimeList.
