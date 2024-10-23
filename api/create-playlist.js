const SpotifyWebApi = require("spotify-web-api-node");
const axios = require("axios");

export default async function handler(req, res) {
  const playlistName = req.query.name || "Liked Songs Playlist";
  const accessToken = req.query.accessToken; // Access token passed from the previous step

  if (!accessToken) {
    return res.status(401).send("Access token is missing");
  }

  const spotifyApi = new SpotifyWebApi({
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    redirectUri: "https://spotify-liked-playlist-nu.vercel.app/api/callback",
  });

  // Set the access token
  spotifyApi.setAccessToken(accessToken);

  try {
    let trackUris = [];
    let offset = 0;
    let limit = 50;
    let total = 1;

    while (trackUris.length < total) {
      const likedTracks = await spotifyApi.getMySavedTracks({ limit, offset });
      trackUris.push(...likedTracks.body.items.map((item) => item.track.uri));
      total = likedTracks.body.total;
      offset += limit;
    }

    const user = await spotifyApi.getMe();

    const playlist = await axios.post(
      `https://api.spotify.com/v1/users/${user.body.id}/playlists`,
      {
        name: playlistName,
        public: false,
      },
      {
        headers: {
          Authorization: `Bearer ${spotifyApi.getAccessToken()}`,
          "Content-Type": "application/json",
        }
      }
    );

    await spotifyApi.addTracksToPlaylist(playlist.data.id, trackUris);

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
