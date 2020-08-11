import { makeRedirectUri, useAuthRequest } from 'expo-auth-session';
import { encode } from 'base-64';
import { spotifyCredentials } from '../secrets.js';

import { setUserData, getUserData } from './storageUtils.js'

class loginUtils {

  _dev = true;

  constructor() {
    if(this._dev) {
      this.endpoint = 'http://localhost:3000/'
    } else {
      this.endpoint = 'https://serendipify-backend.herokuapp.com/'
    }
  }

  authRequest = async () => {
    try {
      const spotify_auth_url_response = await fetch(this.endpoint + 'api/login/auth_request', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      const spotify_auth_url_res = await spotify_auth_url_response.json()

      return spotify_auth_url_res;

    } catch (error) {
      console.log("Error with authRequest()");
      console.error(error);
    }
  }

  getTokens = async (code) => {
    try {
      console.log("Getting tokens")
      const response = await fetch(this.endpoint + 'api/login/get_tokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          auth_code: code,
        }),
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
      console.log('Error with getTokens()');
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
      console.log("Refreshing tokens...")
      const refreshToken = await getUserData('refreshToken');
      const response = await fetch(this.endpoint + 'api/login/refresh_tokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refresh_token: refreshToken,
        }),
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
