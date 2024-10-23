const SpotifyWebApi = require("spotify-web-api-node");
const axios = require("axios");

export default async function handler(req, res) {
  try {
    const playlistName = req.query.name || "Liked Songs Playlist";
    const accessToken = req.query.accessToken;

    if (!accessToken) {
      console.error("Access token is missing");
      return res.status(401).send("Access token is missing");
    }

    const spotifyApi = new SpotifyWebApi({
      clientId: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      redirectUri: "https://spotify-liked-playlist-nu.vercel.app/api/callback",
    });

    // Set the access token
    spotifyApi.setAccessToken(accessToken);

    // Logging access token for debugging (Be careful to remove in production)
    console.log("Access token:", accessToken);

    let trackUris = [];
    let offset = 0;
    let limit = 50;
    let total = 1;

    // Fetch liked tracks
    while (trackUris.length < total) {
      const likedTracks = await spotifyApi.getMySavedTracks({ limit, offset });
      trackUris.push(...likedTracks.body.items.map((item) => item.track.uri));
      total = likedTracks.body.total;
      offset += limit;

      console.log(`Fetched ${trackUris.length} liked tracks so far.`);
    }

    const user = await spotifyApi.getMe();
    console.log("User ID:", user.body.id);

    // Create a new playlist
    const playlist = await axios.post(
      `https://api.spotify.com/v1/users/${user.body.id}/playlists`,
      {
        name: playlistName,
        public: false,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        }
      }
    );

    console.log("Created playlist:", playlist.data.id);

    // Add tracks to the playlist
    await spotifyApi.addTracksToPlaylist(playlist.data.id, trackUris);

    console.log(`Added ${trackUris.length} tracks to the playlist`);

    res.send(`
      <html>
        <body>
          <h1>Playlist Created!</h1>
          <a href="${playlist.data.external_urls.spotify}" target="_blank">View Playlist</a>
        </body>
      </html>
    `);
  } catch (err) {
    console.error("Error creating playlist:", err);
    res.status(500).send("Failed to create playlist");
  }
}
