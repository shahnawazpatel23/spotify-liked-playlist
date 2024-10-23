const SpotifyWebApi = require("spotify-web-api-node");

export default async function handler(req, res) {
  const code = req.query.code;

  const spotifyApi = new SpotifyWebApi({
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    redirectUri: "https://spotify-liked-playlist-nu.vercel.app/api/callback",
  });

  try {
    
    const data = await spotifyApi.authorizationCodeGrant(code);
    const accessToken = data.body["access_token"];
    const refreshToken = data.body["refresh_token"];

   
    spotifyApi.setAccessToken(accessToken);
    spotifyApi.setRefreshToken(refreshToken);

    
    res.redirect(`/api/create-playlist?accessToken=${accessToken}`);
  } catch (err) {
    console.error("Error during authorization code grant:", err);
    res.status(500).send("Failed to authenticate");
  }
}
