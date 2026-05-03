const searchInput = document.getElementById('searchInput');
const resultsDiv = document.getElementById('results');
const welcomeScreen = document.getElementById('welcomeScreen');
const playerScreen = document.getElementById('playerScreen');
const videoPlayer = document.getElementById('videoPlayer');
const movieTitle = document.getElementById('movieTitle');
const movieType = document.getElementById('movieType');
const movieYear = document.getElementById('movieYear');
const movieCast = document.getElementById('movieCast');
const moviePoster = document.getElementById('moviePoster');
const backBtn = document.getElementById('backBtn');

const ottControls = document.getElementById('ottControls');
const seasonDropdown = document.getElementById('seasonDropdown');
const episodesList = document.getElementById('episodesList');

let searchTimeout;
let currentMovie = null;
let showEpisodes = [];

// Event Listeners
searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    const query = e.target.value.trim();
    
    if (query.length < 2) {
        resultsDiv.classList.add('hidden');
        return;
    }

    searchTimeout = setTimeout(() => {
        performSearch(query);
    }, 400);
});

// Hide dropdown when clicking outside
document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !resultsDiv.contains(e.target)) {
        resultsDiv.classList.add('hidden');
    }
});

backBtn.addEventListener('click', () => {
    playerScreen.classList.add('hidden');
    welcomeScreen.classList.remove('hidden');
    videoPlayer.src = '';
    currentMovie = null;
    showEpisodes = [];
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

async function performSearch(query) {
    try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        
        if (data.d && data.d.length > 0) {
            renderResults(data.d);
        } else {
            resultsDiv.innerHTML = '<div class="result-item"><p>No results found</p></div>';
            resultsDiv.classList.remove('hidden');
        }
    } catch (error) {
        console.error('Search failed:', error);
    }
}

function renderResults(movies) {
    resultsDiv.innerHTML = '';
    
    // Filter out results that don't have an ID or aren't movies/TV series
    const filtered = movies.filter(m => m.id && m.id.startsWith('tt'));

    filtered.forEach(movie => {
        const item = document.createElement('div');
        item.className = 'result-item';
        
        const posterUrl = movie.i ? movie.i.imageUrl : 'https://via.placeholder.com/45x65?text=?';
        const year = movie.y || 'N/A';
        const title = movie.l || 'Unknown Title';
        const cast = movie.s || '';

        item.innerHTML = `
            <img src="${posterUrl}" alt="${title}">
            <div class="result-info">
                <h4>${title}</h4>
                <p>${movie.q || 'Movie'} • ${year}</p>
            </div>
        `;

        item.onclick = () => selectMovie(movie);
        resultsDiv.appendChild(item);
    });

    resultsDiv.classList.remove('hidden');
}

function selectMovie(movie) {
    currentMovie = movie;
    resultsDiv.classList.add('hidden');
    welcomeScreen.classList.add('hidden');
    playerScreen.classList.remove('hidden');

    const imdbId = movie.id;
    const isTvSeries = movie.qid === 'tvSeries' || movie.qid === 'tvMiniSeries';
    
    if (isTvSeries) {
        ottControls.classList.remove('hidden');
        renderTvControls(imdbId);
        videoPlayer.src = `https://vidsrc.me/embed/tv?imdb=${imdbId}&season=1&episode=1`;
    } else {
        ottControls.classList.add('hidden');
        videoPlayer.src = `https://streamimdb.me/embed/${imdbId}`;
    }
    
    movieTitle.textContent = movie.l;
    movieType.textContent = (movie.q || 'Movie').toUpperCase();
    movieYear.textContent = movie.y || '';
    movieCast.textContent = movie.s ? `Cast: ${movie.s}` : '';
    
    if (movie.i) {
        moviePoster.src = movie.i.imageUrl;
        moviePoster.classList.remove('hidden');
    } else {
        moviePoster.classList.add('hidden');
    }

    searchInput.value = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function fetchTvDetails(imdbId) {
    try {
        const lookupRes = await fetch(`https://api.tvmaze.com/lookup/shows?imdb=${imdbId}`);
        if (!lookupRes.ok) throw new Error('Show not found');
        const show = await lookupRes.json();
        
        const epRes = await fetch(`https://api.tvmaze.com/shows/${show.id}/episodes`);
        const episodes = await epRes.json();
        
        return episodes;
    } catch (e) {
        console.error("Error fetching episodes:", e);
        return [];
    }
}

async function renderTvControls(imdbId) {
    seasonDropdown.innerHTML = '<option>Loading episodes...</option>';
    episodesList.innerHTML = '';
    
    showEpisodes = await fetchTvDetails(imdbId);
    if (!showEpisodes || showEpisodes.length === 0) {
        seasonDropdown.innerHTML = '<option>No episodes found</option>';
        return;
    }
    
    // Extract unique seasons
    const seasons = [...new Set(showEpisodes.map(ep => ep.season))];
    
    seasonDropdown.innerHTML = seasons.map(s => `<option value="${s}">Season ${s}</option>`).join('');
    
    // Remove old event listener if exists to prevent duplicates (by cloning node)
    const newDropdown = seasonDropdown.cloneNode(true);
    seasonDropdown.parentNode.replaceChild(newDropdown, seasonDropdown);
    
    newDropdown.addEventListener('change', (e) => {
        renderEpisodes(parseInt(e.target.value));
    });
    
    // Initial render
    renderEpisodes(seasons[0], 1);
}

function renderEpisodes(season, defaultActiveEpisode = null) {
    const seasonEpisodes = showEpisodes.filter(ep => ep.season === season);
    const listHtml = document.getElementById('episodesList'); // Re-query just in case
    
    listHtml.innerHTML = seasonEpisodes.map(ep => {
        const isActive = (defaultActiveEpisode === ep.number) ? 'active' : '';
        return `
            <div class="episode-card ${isActive}" data-s="${ep.season}" data-e="${ep.number}">
                <div class="episode-number">Episode ${ep.number}</div>
                <div class="episode-title" title="${ep.name}">${ep.name}</div>
            </div>
        `;
    }).join('');
    
    document.querySelectorAll('.episode-card').forEach(card => {
        card.addEventListener('click', () => {
            document.querySelectorAll('.episode-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            
            const s = card.getAttribute('data-s');
            const e = card.getAttribute('data-e');
            videoPlayer.src = `https://vidsrc.me/embed/tv?imdb=${currentMovie.id}&season=${s}&episode=${e}`;
            
            // Scroll to top to see player (especially on mobile)
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });
}

