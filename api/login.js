const SpotifyWebApi = require("spotify-web-api-node");

export default function handler(req, res) {
  const scopes = ["user-library-read", "playlist-modify-public", "playlist-modify-private"];

  const spotifyApi = new SpotifyWebApi({
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    redirectUri: "https://spotify-liked-playlist-nu.vercel.app/api/callback",
  });

  const authorizeURL = spotifyApi.createAuthorizeURL(scopes);
  res.redirect(authorizeURL);
}
