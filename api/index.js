const express = require('express');
const axios = require('axios');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static('public'));

// API endpoint to proxy IMDb search suggestions
app.get('/api/search', async (req, res) => {
    const query = req.query.q;
    if (!query || query.trim() === '') {
        return res.status(400).json({ error: 'Query is required' });
    }

    try {
        const cleanQuery = query.trim().replace(/\s+/g, '_').toLowerCase();
        const firstChar = cleanQuery.charAt(0);
        
        // IMDb suggestion API URL pattern
        const url = `https://v3.sg.media-imdb.com/suggestion/${firstChar}/${encodeURIComponent(cleanQuery)}.json`;
        
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        
        res.json(response.data);
    } catch (error) {
        console.error('Search error:', error.message);
        res.status(500).json({ 
            error: 'Failed to fetch results from IMDb',
            details: error.message 
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;
