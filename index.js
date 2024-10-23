const express = require("express");
const request = require("request");
const querystring = require("querystring");
const SpotifyWebApi = require("spotify-web-api-node");
const axios = require("axios");
const dotenv = require("dotenv").config();
const app = express();
const path = require("path");

// Spotify API credentials
const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const redirectUri = "https://spotify-liked-playlist-iota.vercel.app/callback";

const spotifyApi = new SpotifyWebApi({
  clientId: clientId,
  clientSecret: clientSecret,
  redirectUri: redirectUri,
});

const scopes = [
  "user-library-read",
  "playlist-modify-public",
  "playlist-modify-private",
];

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/login", (req, res) => {
  const authorizeURL = spotifyApi.createAuthorizeURL(scopes);
  res.redirect(authorizeURL);
});

// app.get('/login', (req, res) => {
//     const playlistName = req.query.name; // Capture the playlist name from the form
//     const authorizeURL = spotifyApi.createAuthorizeURL(scopes) + '&playlist_name=' + playlistName;
//     res.redirect(authorizeURL);
// });

app.get("/callback", async (req, res) => {
  const code = req.query.code; // Ensure the code is being captured from query params
  console.log("code in callback is ", code);
  if (!code) {
    return res.status(400).send("Authorization code not found.");
  }

  try {
    const data = await spotifyApi.authorizationCodeGrant(code);
    const accessToken = data.body["access_token"];
    const refreshToken = data.body["refresh_token"];

    spotifyApi.setAccessToken(accessToken);
    spotifyApi.setRefreshToken(refreshToken);

    res.redirect("/create-playlist");
  } catch (err) {
    console.error("Error getting access token:", err);
    res.send("Failed to get access token.");
  }
});

app.get("/create-playlist", async (req, res) => {
  try {
    // Get the playlist name from the query params
    const playlistName = req.query.name || "Liked Songs Playlist";

    // Fetch liked songs
    // const likedTracks = await spotifyApi.getMySavedTracks({ limit: 50 });
    // const trackUris = likedTracks.body.items.map(item => item.track.uri);
    // console.log('tracked --->', trackUris);

    let trackUris = [];
    let offset = 0;
    let limit = 50;
    let total = 1; // Set initially to enter the loop

    // Loop to fetch all liked tracks in batches of 50
    while (trackUris.length < total) {
      const likedTracks = await spotifyApi.getMySavedTracks({ limit, offset });
      trackUris.push(...likedTracks.body.items.map((item) => item.track.uri));
      total = likedTracks.body.total; // Total number of liked tracks
      offset += limit; // Move to the next set of tracks
    }

    console.log(`Fetched ${trackUris.length} liked tracks in total.`);

    // Get user information
    const user = await spotifyApi.getMe();
    console.log("user is ", user);

    // Create a new playlist using axios with user-provided name
    const playlist = await axios.post(
      `https://api.spotify.com/v1/users/${user.body.id}/playlists`,
      {
        name: playlistName, // Use the playlist name from the query
        public: false,
      },
      {
        headers: {
          Authorization: `Bearer ${spotifyApi.getAccessToken()}`,
          "Content-Type": "application/json",
        },
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
    console.error("Error creating playlist:", err);
    res.send("Failed to create playlist");
  }
});

app.listen(process.env.PORT, () => {
  console.log(`app is running at port ${process.env.PORT}`);
});
