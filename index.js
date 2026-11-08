const express = require('express');
const cors = require('cors');
// You will need to add this package to your package.json
const { MusicKit } = require('musicstream-sdk'); 

const app = express();
app.use(cors());

// Initialize the SDK (No API key needed according to docs)
const mk = new MusicKit({
    language: 'ta', // Default to Tamil for your South Indian focus
    location: 'IN',
    sourceOrder: 'best'
});

app.get('/api/search', async (req, res) => {
    const query = req.query.q;
    if (!query) return res.status(400).json({ error: 'Query is required' });

    try {
        // 1. Search YouTube Music via the SDK
        const searchResults = await mk.search(query);
        
        // The SDK returns different types, we just want songs
        const songs = searchResults.items.filter(item => item.type === 'song');

        if (songs.length === 0) {
            return res.json({ tracks: [] });
        }

        // 2. Fetch the stream URL for the top result
        // Note: Streaming from YouTube requires yt-dlp on the server. 
        // Vercel might block this due to system dependencies. 
        // We will try to get the stream URL anyway.
        const topSong = songs[0];
        let streamUrl = '';
        
        try {
            const streamData = await mk.getStream(topSong.id, 'high');
            streamUrl = streamData.url;
        } catch (streamErr) {
            console.error('Could not get stream URL (yt-dlp missing?):', streamErr.message);
            // If stream fails, we still return metadata so you can see it works
        }

        // Format the response for your app
        const tracks = songs.map(song => ({
            id: song.id,
            title: song.title,
            artist: song.artist?.name || 'YouTube Music',
            album: song.album?.name || 'Single',
            duration: song.duration || 0,
            // If streamUrl is empty, the app will fail to play, but search will work
            audioUrl: song.id === topSong.id ? streamUrl : '', 
            image: song.thumbnail?.url || 'https://picsum.photos/seed/' + song.id + '/500/500'
        }));

        res.json({ tracks });

    } catch (error) {
        console.error('Backend fetch error:', error.message);
        res.status(500).json({ error: 'Failed to fetch YouTube Music data' });
    }
});

module.exports = app;
