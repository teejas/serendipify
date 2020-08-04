import * as AuthSession from 'expo-auth-session';
import * as Linking from 'expo-linking';
import { makeRedirectUri, useAuthRequest } from 'expo-auth-session';
import { encode } from 'base-64';
import { spotifyCredentials } from '../secrets.js';
import axios from 'axios';

import { setUserData, getUserData } from './storageUtils.js'

class loginUtils {

  constructor() {
    this.spotifyAuthConfig = {
      clientId: spotifyCredentials.clientId,
      clientSecret: spotifyCredentials.clientSecret,
      redirectUri: spotifyCredentials.redirectUri, // use localhost in development
      scopes: [
        'playlist-read-private',
        'playlist-modify-public',
        'playlist-modify-private',
        'user-library-read',
        'user-library-modify',
        'user-top-read',
        'streaming',
        'user-read-playback-state',
        'user-modify-playback-state',
      ],
      discovery: {
        authorizationEndpoint: 'https://accounts.spotify.com/authorize',
        tokenEndpoint: 'https://accounts.spotify.com/api/token',
      },
    };
  }

  // getSpotifyCredentials = async () => {
  //   try {
  //     const res = await axios.get('/api/spotify-credentials')
  //     console.log("SPOTIFY CREDENTIALS FETCHED: " + res.data)
  //     const spotifyCredentials = res.data;
  //     this.spotifyAuthConfig.clientId = spotifyCredentials.clientId;
  //     this.spotifyAuthConfig.clientSecret = spotifyCredentials.clientSecret;
  //     this.spotifyAuthConfig.redirectUri = spotifyCredentials.redirectUri;
  //   } catch(error) {
  //     console.log("ERROR WITH getSpotifyCredentials()");
  //     console.error(error)
  //   }
  // }

  authRequest = () => {
    try {
      // await this.getSpotifyCredentials();
      const [ request, response, promptAsync ] = useAuthRequest(
        {
          clientId: this.spotifyAuthConfig.clientId,
          clientSecret: this.spotifyAuthConfig.clientSecret,
          redirectUri: this.spotifyAuthConfig.redirectUri,
          scopes: this.spotifyAuthConfig.scopes,
          // In order to follow the "Authorization Code Flow" to fetch token after authorizationEndpoint
          // this must be set to false
          usePKCE: false,
        },
        this.spotifyAuthConfig.discovery
      );
      return [ request, response, promptAsync ];
    } catch (error) {
      console.error(JSON.stringify(error));
    }
  }

  getTokens = async (code) => {
    try {
      // await this.getSpotifyCredentials()
      console.log("Getting tokens")
      const authorizationCode = code;
      const creds = encode(`${this.spotifyAuthConfig.clientId}:${this.spotifyAuthConfig.clientSecret}`);
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          Authorization: `Basic ${creds}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `grant_type=authorization_code&code=${authorizationCode}&redirect_uri=${
          this.spotifyAuthConfig.redirectUri
        }`,
      });
      const responseJson = await response.json();
      if(!responseJson.error) {
        const {
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_in: expiresIn,
        } = responseJson;

        const expirationTime = new Date().getTime() + expiresIn * 1000;

        await setUserData('accessToken', accessToken);
        await setUserData('refreshToken', refreshToken);
        await setUserData('expirationTime', JSON.stringify(expirationTime));
        return 1;
      } else {
        console.log("AUTHORIZATION CODE EXPIRED");
        return null;
      }
    } catch (error) {
      console.error(error);
    }
  }

  loadTokens = async () => {
    try {
      console.log("Loading tokens...")
      const accessToken = await getUserData('accessToken');
      const refreshToken = await getUserData('refreshToken');
      const expireTime = await getUserData('expirationTime');
      if(accessToken && refreshToken && expireTime) {
        const res = {
          'body': [ accessToken, refreshToken, expireTime ]
        }
        return res
      } else {
        console.log("Tokens not in user storage");
        return null
      }
    } catch(error) {
      console.error(error)
      return null
    }
  }

  refreshTokens = async () => {
    try {
      // await this.getSpotifyCredentials()
      console.log("Refreshing tokens...")
      const creds = encode(`${spotifyCredentials.clientId}:${spotifyCredentials.clientSecret}`);
      const refreshToken = await getUserData('refreshToken');
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          Authorization: `Basic ${creds}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `grant_type=refresh_token&refresh_token=${refreshToken}`,
      });
      const responseJson = await response.json();
      if (responseJson.error) {
        await this.getTokens();
      } else {
        const {
          access_token: newAccessToken,
          refresh_token: newRefreshToken,
          expires_in: expiresIn,
        } = responseJson;

        const expirationTime = new Date().getTime() + expiresIn * 1000;
        await setUserData('accessToken', newAccessToken);
        if (newRefreshToken) {
          await setUserData('refreshToken', newRefreshToken);
        }
        await setUserData('expirationTime', JSON.stringify(expirationTime));
      }
    } catch (err) {
      console.error(err)
    }
  }

  // updateState = async (state) => {
  //   state.accessToken = await getUserData('accessToken');
  //   state.refreshToken = await getUserData('refreshToken');
  //   state.accessTokenExpirationDate = await getUserData('expirationTime');
  // }

  checkTokenExpiration = async () => {
    console.log("Checking token expiration time...")
    const expirationTime = await getUserData('expirationTime');
    var tokenExpirationTime = null;
    if(expirationTime) {
      try {
        tokenExpirationTime = JSON.parse(expirationTime);
      } catch(error) {
        console.log("Error parsing value: " + expirationTime);
        tokenExpirationTime = null;
      }
    }
    if (!tokenExpirationTime || new Date().getTime() > tokenExpirationTime) {
      await this.refreshTokens(); // if expired: refresh tokens
    }
  }

}

const loginHandler = new loginUtils();

export default loginHandler;
