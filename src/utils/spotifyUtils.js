import { setUserData, getUserData } from './storageUtils.js';

// FETCH USAGE EXAMPLE
// const response = await fetch('https://accounts.spotify.com/api/token', {
//   method: 'POST',
//   headers: {
//     Authorization: `Basic ${creds}`,
//     'Content-Type': 'application/x-www-form-urlencoded',
//   },
//   body: `grant_type=refresh_token&refresh_token=${refreshToken}`,
// });
// const responseJson = await response.json();

export const getSpotifyUserId = async (accessToken) => {
  try {
    const response = await fetch("https://api.spotify.com/v1/me", {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + accessToken,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    });
    const res = await response.json();
    return res.id;
  } catch(error) {
    console.error(error);
  }
}

export const getPlaylists = async (accessToken) => {
  try {
    const userId = await getSpotifyUserId(accessToken)
    const response = await fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + accessToken,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    });
    const res = await response.json();
    const playlists = []
    for(const idx in res.items) {
      var playlistObj = res.items[idx]
      playlists.push(playlistObj.name + ':' + playlistObj.id)
    }
    return playlists;
  } catch(error) {
    console.error(error);
  }
}
