const SpotifyWebApi = require("spotify-web-api-node");

export default async function handler(req, res) {
  const code = req.query.code;

  if (!code) {
    return res.status(400).send("Authorization code not found.");
  }

  const spotifyApi = new SpotifyWebApi({
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    redirectUri: "https://spotify-liked-playlist-iota.vercel.app/api/callback",
  });

  try {
    const data = await spotifyApi.authorizationCodeGrant(code);
    const accessToken = data.body["access_token"];
    const refreshToken = data.body["refresh_token"];

    spotifyApi.setAccessToken(accessToken);
    spotifyApi.setRefreshToken(refreshToken);

    res.redirect("/api/create-playlist");
  } catch (err) {
    console.error("Error getting access token:", err);
    res.send("Failed to get access token.");
  }
}
