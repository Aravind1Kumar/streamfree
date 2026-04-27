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

let searchTimeout;

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
    resultsDiv.classList.add('hidden');
    welcomeScreen.classList.add('hidden');
    playerScreen.classList.remove('hidden');

    const imdbId = movie.id;
    const streamUrl = `https://streamimdb.me/embed/${imdbId}`;
    
    videoPlayer.src = streamUrl;
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
