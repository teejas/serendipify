import { spotifyCredentials } from '../secrets.js'

const router = require('express').Router()

router.get('/api/spotify-credentials', (req, res, next) => {
  const clientId = spotifyCredentials.clientId;
  const clientSecret = spotifyCredentials.clientSecret;
  const redirectUri = spotifyCredentials.redirectUri;
  const spotifyCredentials = { clientId, clientSecret, redirectUri };
  res.json(spotifyCredentials);
});
