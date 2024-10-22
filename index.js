const express = require('express');
const request = require('request'); 
const querystring = require('querystring');
const SpotifyWebApi = require('spotify-web-api-node'); 
const axios = require('axios');
const dotenv = require('dotenv').config();
const app = express();

// Spotify API credentials
const clientId = process.env.CLIENT_ID
const clientSecret = process.env.CLIENT_SECRET
const redirectUri = 'http://localhost:8888/callback'; 

const spotifyApi = new SpotifyWebApi({
    clientId: clientId,
    clientSecret: clientSecret,
    redirectUri: redirectUri,
});

const scopes = ['user-library-read', 'playlist-modify-public', 'playlist-modify-private'];

app.get('/login', (req, res) => {
    const authorizeURL = spotifyApi.createAuthorizeURL(scopes);
    res.redirect(authorizeURL);
});

app.get('/callback', async (req, res) => {
    const code = req.query.code;  // Ensure the code is being captured from query params
    console.log("code in callback is ", code)
    if (!code) {
        return res.status(400).send('Authorization code not found.');
    }

    try {
        const data = await spotifyApi.authorizationCodeGrant(code);
        const accessToken = data.body['access_token'];
        const refreshToken = data.body['refresh_token'];

        spotifyApi.setAccessToken(accessToken);
        spotifyApi.setRefreshToken(refreshToken);

        res.redirect('/playlist-form');
    } catch (err) {
        console.error('Error getting access token:', err);
        res.send('Failed to get access token.');
    }
});
app.get('/playlist-form', (req, res) => {
    res.send(`
        <html>
            <head>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        min-height: 100vh; /* Ensure the body takes up full viewport height */
                        margin: 0;
                        background-color: #f4f4f4;
                    }
                    
                    form {
                        display: flex;
                        flex-direction: column;
                        justify-content: space-between;
                        background-color: #fff;
                        padding: 20px;
                        border-radius: 10px;
                        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                        max-width: 400px;
                        width: 100%;
                        margin: auto;
                        box-sizing: border-box;
                    }
                    label {
                        display: block;
                        margin-bottom: 10px;
                        font-weight: bold;
                    }
                    input[type="text"] {
                        width: 100%;
                        padding: 10px;
                        margin-bottom: 20px;
                        border: 1px solid #ccc;
                        border-radius: 5px;
                        font-size: 16px;
                    }
                    button {
                        width: 100%;
                        padding: 10px;
                        background-color: #1DB954;
                        color: white;
                        border: none;
                        border-radius: 5px;
                        font-size: 16px;
                        cursor: pointer;
                    }
                    button:hover {
                        background-color: #1ed760;
                    }

                    /* Responsive Design */
                    @media (max-width: 600px) {
                        form {
                            width: 80%; /* Adjust form width for small screens */
                            padding: 15px;
                            margin: auto;
                        }
                        input[type="text"], button {
                            font-size: 16px; /* Maintain font size on small devices */
                        }
                    }

                    @media (max-width: 400px) {
                        form {
                            width: 70%; /* Adjust form width for very small screens */
                        }
                    }
                </style>
            </head>
            <body>
            
                <form action="/create-playlist" method="GET">
                    <label for="name">Enter playlist name:</label>
                    <input type="text" id="name" name="name" placeholder="Playlist Name">
                    <button type="submit">Create Playlist</button>
                </form>
                
            </body>
        </html>
    `);
});




// app.get('/create-playlist', async (req, res) => {
//     try {
//         // Fetch liked songs
//         const likedTracks = await spotifyApi.getMySavedTracks({ limit: 50 });
//         const trackUris = likedTracks.body.items.map(item => item.track.uri);
//         console.log('tracked --->', trackUris);

//         // Get user information
//         const user = await spotifyApi.getMe();
//         console.log("user is ", user);
        

//         // Create a new playlist using axios
//         const playlist = await axios.post(
//             `https://api.spotify.com/v1/users/${user.body.id}/playlists`,
//             {
//                 name: 'Liked Songs Playlist',
//                 public: false
//             },
//             {
//                 headers: {
//                     Authorization: `Bearer ${spotifyApi.getAccessToken()}`,
//                     'Content-Type': 'application/json',
//                 }
//             }
//         );
        

//         console.log("created playlist is ", playlist.data);

//         // Add tracks to the playlist
//         await spotifyApi.addTracksToPlaylist(playlist.data.id, trackUris);

//         res.send(`Playlist created! View it <a href="${playlist.data.external_urls.spotify}">here</a>`);
//     } catch (err) {
//         console.error('Error creating playlist:', err);
//         res.send('Failed to create playlist');
//     }
// });

app.get('/create-playlist', async (req, res) => {
    try {
        // Get the playlist name from the query params
        const playlistName = req.query.name || 'Liked Songs Playlist'; 

        // Fetch liked songs
        const likedTracks = await spotifyApi.getMySavedTracks({ limit: 50 });
        const trackUris = likedTracks.body.items.map(item => item.track.uri);
        console.log('tracked --->', trackUris);

        // Get user information
        const user = await spotifyApi.getMe();
        console.log("user is ", user);

        // Create a new playlist using axios with user-provided name
        const playlist = await axios.post(
            `https://api.spotify.com/v1/users/${user.body.id}/playlists`,
            {
                name: playlistName,  // Use the playlist name from the query
                public: false
            },
            {
                headers: {
                    Authorization: `Bearer ${spotifyApi.getAccessToken()}`,
                    'Content-Type': 'application/json',
                }
            }
        );

        console.log("created playlist is ", playlist.data);

        // Add tracks to the playlist
        await spotifyApi.addTracksToPlaylist(playlist.data.id, trackUris);

        res.send(`
            <html>
                <head>
                    <title>Playlist Created</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            min-height: 100vh;
                            margin: 0;
                            background-color: #f4f4f4;
                            text-align: center;
                        }
                        .container {
                            background-color: #fff;
                            padding: 20px;
                            border-radius: 10px;
                            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                            max-width: 400px;
                            width: 100%;
                        }
                        h1 {
                            font-size: 24px;
                            margin-bottom: 20px;
                        }
                        a {
                            display: inline-block;
                            margin-top: 20px;
                            padding: 10px 20px;
                            background-color: #1DB954;
                            color: white;
                            border-radius: 5px;
                            text-decoration: none;
                            font-size: 16px;
                        }
                        a:hover {
                            background-color: #1ed760;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>Playlist Created!</h1>
                        <p>Your playlist has been successfully created.</p>
                        <a href="${playlist.data.external_urls.spotify}" target="_blank">View Playlist</a>
                    </div>
                </body>
            </html>
        `);
        
    } catch (err) {
        console.error('Error creating playlist:', err);
        res.send('Failed to create playlist');
    }
});


app.listen(process.env.PORT, () => {
    console.log(`app is running at port ${process.env.PORT}`);
});
