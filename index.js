const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors()); // Allow your app to access this backend

app.get('/api/search', async (req, res) => {
    const query = req.query.q;
    const language = req.query.lang || 'tamil,telugu,hindi'; // Default to South Indian
    if (!query) return res.status(400).json({ error: 'Query is required' });

    try {
        // Using a known unofficial JioSaavn endpoint structure
        // We append language to the query to filter results
        const searchUrl = `https://jiosaavn-api-private-production-6a4b.up.railway.app/search/songs?query=${encodeURIComponent(query)}&limit=30`;
        
        const response = await axios.get(searchUrl);
        const data = response.data;

        // Handle different response structures from the API
        let rawTracks = data.data?.results || data.data?.songs || data.results || [];
        
        if (!rawTracks || rawTracks.length === 0) {
            return res.json({ tracks: [] });
        }

        // Map the data to a clean format for your app
        const tracks = rawTracks.map(t => {
            const bestImage = t.image ? t.image[t.image.length - 1].url : 'https://picsum.photos/seed/' + t.id + '/500/500';
            const bestAudio = t.downloadUrl ? t.downloadUrl[t.downloadUrl.length - 1].url : t.url;
            return {
                id: t.id,
                title: t.name || t.title,
                artist: t.artists?.primary?.[0]?.name || t.subtitle || 'Various Artists',
                album: t.album?.name || 'Single',
                duration: t.duration || 0,
                audioUrl: bestAudio, // This is the full-length stream
                image: bestImage
            };
        }).filter(t => t.audioUrl);

        res.json({ tracks });

    } catch (error) {
        console.error('Backend fetch error:', error.message);
        res.status(500).json({ error: 'Failed to fetch music' });
    }
});

// For local testing
if (require.main === module) {
    app.listen(3000, () => console.log('Backend running on http://localhost:3000'));
}

module.exports = app;