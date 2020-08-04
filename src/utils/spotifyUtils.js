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
    console.log('Getting spotify user id...')
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
    const user_id = await getSpotifyUserId(accessToken)
    console.log('Getting spotify playlists for user ' + user_id + '...')
    const response = await fetch(`https://api.spotify.com/v1/users/${user_id}/playlists`, {
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

export const getRecommendedSongs = async (accessToken, playlistId) => {
  try {
    console.log('Getting songs from playlist ' + playlistId + '...')
    const user_id = await getSpotifyUserId(accessToken);
    // fetch recommended songs using playlist as seed
    const tracks_response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + accessToken,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    });
    const tracks_res = await tracks_response.json();
    const tracks = [];
    console.log(tracks_res.items[0].track.uri)
    for(const idx in tracks_res.items) {
      var trackObj = tracks_res.items[idx];
      tracks.push(trackObj.track.uri);
    }
    /*
    how to get recommended songs if endpoint limits seed values to 5?
    IDEA: get top 5 most frequently cited artists from the playlist and use those as the seed values
      - reason being that seed_genres is too specific (many artists cross genres or fuse them) and
      seed_tracks is too general (too many tracks)
      - following the Goldilocks rule, seed_artists is just right
    */
    return tracks;

  } catch(error) {
    console.error(error)
  }
}

/*
Need to fetch player and load with songs from getRecommendedSongs()
clear queue, add song to queue, skip to added song
TO-DO: need a way to clear the queue before adding and skipping
  - could add song with specific uri, then skip tracks until that song is hit
    (so you know youre at the end of the queue)
*/
export const clearQueue = async (accessToken) => {
  try {
    var device_id = await getUserData('deviceId')
    if(!device_id) {
      device_id = await getDevice(accessToken)
    }
    // add Nahimana (or any obscure spotify track)
    const nahimana = 'spotify:track:7wYyyaeqoSegbLN5HGa6WD'
    const req_url = `https://api.spotify.com/v1/me/player/queue?uri=${nahimana}&device_id=${device_id}`
    const add_response = await fetch(req_url, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + accessToken,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    })
    if(!add_response.ok) {
      console.error("Error with adding song to Spotify queue")
    }

    // skip tracks until currently playing song uri matches Nahimana
    await skipSong(accessToken, device_id);
    var currplaying = await getPlayer(accessToken);
    while(currplaying.uri != nahimana) {
      await skipSong(accessToken, device_id);
      currplaying = await getPlayer(accessToken);
    }
    console.log("QUEUE CLEARED!")
  } catch(error) {
    console.error(error);
  }
}

export const getDevice = async (accessToken) => {
  console.log('Getting available devices...')
  const getdevices_response = await fetch('https://api.spotify.com/v1/me/player/devices', {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer ' + accessToken,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  })
  const getdevices_res = await getdevices_response.json()
  var device_id = '';
  if(getdevices_res) {
    for(var idx in getdevices_res.devices) {
      var device = getdevices_res.devices[idx];
      if(device.type == "Smartphone") {
        console.log(device)
        device_id = device.id;
        break;
      }
    }
    if(device_id == '') {
      device_id = getdevices_res.devices[0].id
    }
  }
  await setUserData('deviceId', device_id)
  return device_id;
}

export const addSong = async (accessToken, playlist_tracks, device_id) => {
  var track_arr = playlist_tracks.splice(Math.floor(Math.random()*playlist_tracks.length), 1);
  var track = track_arr[0]

  var is_local = (track.split(':')[1] == "local")
  while(is_local && playlist_tracks.length > 0) {
    track_arr = playlist_tracks.splice(Math.floor(Math.random()*playlist_tracks.length), 1);
    track = track_arr[0]
    is_local = (track.split(':')[1] == "local")
  }

  if(!is_local) {
    console.log('Adding song ' + track + ' to queue...')
    const req_url = (
      'https://api.spotify.com/v1/me/player/queue?uri=' +
      track +
      '&device_id=' +
      device_id
    )
    const add_response = await fetch(req_url, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + accessToken,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    })
    if(!add_response.ok) {
      console.error("Error with adding song to Spotify queue")
    }
    return track;
  }
  return null;
}

export const skipSong = async (accessToken, device_id) => {
  console.log('Skipping to added song...')
  const req_url = (
    'https://api.spotify.com/v1/me/player/next?device_id=' +
    device_id
  )
  const skip_response = await fetch(req_url, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + accessToken,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  })
  if(!skip_response.ok) {
    console.error("Error with skipping song in Spotify")
  }
}

export const getPlayer = async (accessToken) => {
  try {
    console.log('Getting currently playing state...')
    const currplaying_response = await fetch('https://api.spotify.com/v1/me/player', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + accessToken,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    })
    const currplaying_res = await currplaying_response.json();
    if(currplaying_res) {
      ret = {
        'uri': currplaying_res.item.uri,
        'item': currplaying_res.item,
        'is_playing': currplaying_res.is_playing,
        'progress_ms': currplaying_res.progress_ms,
      }
      return ret;
    } else {
      return null;
    }
  } catch(error) {
    console.error(error);
  }
}

export const loadPlayer = async (accessToken, playlist_tracks) => {
  try {
    const user_id = await getSpotifyUserId(accessToken);
    // add song to playback queue
    const device_id = await getDevice(accessToken);
    console.log("DEVICE: " + device_id)

    // add song to queue
    const track = await addSong(accessToken, playlist_tracks, device_id);
    if(!track) {
      return null;
    }

    // skip to added song
    await skipSong(accessToken, device_id)

    // Get currently playing state for player component
    var ret = {
      'uri': '',
      'item': null,
      'is_playing': null,
      'progress_ms': null,
    }
    while(ret.uri != track) {
      ret = await getPlayer(accessToken)
    }
    return ret;
  } catch(error) {
    console.error(error);
  }
}

/*
savePlaylist(), called from FinalView to save liked songs in a playlist for the listening session
*/
export const savePlaylist = async (accessToken, liked_songs) => {
  try {
    const user_id = await getSpotifyUserId(accessToken);

    const createplaylist_response = await fetch(`https://api.spotify.com/v1/users/${user_id}/playlists`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + accessToken,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        name: "Juko Listening Session"
      })
    });
    const cp_res = await createplaylist_response.json();
    //console.log(cp_res)
    const playlist_id = cp_res.id;

    var uris = []
    for(var idx in liked_songs) {
      uris.push(liked_songs[idx].uri)
    }
    const addtoplaylist_response = await fetch(`https://api.spotify.com/v1/playlists/${playlist_id}/tracks`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + accessToken,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        uris: uris
      })
    });
    const atp_res = await addtoplaylist_response.json()
    //console.log(atp_res)

  } catch(error) {
    console.error(error)
  }
}
