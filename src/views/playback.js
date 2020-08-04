// View for playback of recommended songs
//  - Given a "seed" playlist, fetch recommended songs and playback
//  - View should have a container which serves to display the currently playing song
//    - Buttons: huge one for "like song" and small one to "skip"

import {StatusBar} from 'expo-status-bar';
import * as Linking from 'expo-linking';
import React, {Component} from 'react';
import {StyleSheet, Text, View, Button, FlatList, Image} from 'react-native';

import loginHandler from '../utils/loginUtils.js';
import { setUserData, getUserData } from '../utils/storageUtils.js';
import { getPlaylists, getRecommendedSongs, getPlayer, loadPlayer, addSong, clearQueue } from '../utils/spotifyUtils.js'

import FinalView from './final.js'

class PlaybackView extends Component {

  _isMounted = false;

  state = this.props.parentState; // inherit state from PlaylistView (parent)

  componentDidMount = async () => {
    this._isMounted = true;
    await loginHandler.checkTokenExpiration(this.state);
    await this.updateState();
    await clearQueue(this.state.accessToken);
    if(!this.state.playlist_tracks) {
      const playlist_tracks = await getRecommendedSongs(this.state.accessToken, this.state.playlistId);
      if(this._isMounted) {
        this.setState({playlist_tracks: playlist_tracks})
      }
    }
    if(this.state.playlist_tracks) {
      await this.skipStateHelper(this.state.playlist_tracks);
      await this.skipState(this.state.playlist_tracks);
    }
  }

  componentWillUnmount = () => {
    this._isMounted = false;
  }

  updateState = async () => {
    this.state.accessToken = await getUserData('accessToken');
    this.state.refreshToken = await getUserData('refreshToken');
    this.state.accessTokenExpirationDate = await getUserData('expirationTime');
    if(!this.state.player_obj) {
      this.state.player_obj = null;
    }
    if(!this.state.skip) {
      this.state.skip = true;
    }
    if(!this.state.liked_songs) {
      this.state.liked_songs = [];
    }
  }

  skipStateHelper = async (playlist_tracks) => {
    if(this.state.skip) {
      if(playlist_tracks) {
        var player_obj = await loadPlayer(this.state.accessToken, playlist_tracks);
        if(this._isMounted) {
          this.setState({player_obj: player_obj});
          this.setState({playlist_tracks: playlist_tracks});
        }
        console.log('song skipped: ' + JSON.stringify(this.state.skip));
      } else {
        console.log("OUT OF SONGS TO PLAY!");
        playlist_tracks = await getRecommendedSongs(this.state.accessToken, this.state.playlistId)
      }
    }
  }

  checkSongChanged = async () => {
    try {
      console.log("checking if song has changed")
      const player_obj = await getPlayer(this.state.accessToken);
      if(player_obj) {
        if(player_obj.uri != this.state.player_obj.uri) {
          console.log("done with song, going back into skip state")
          if(this._isMounted) {
            this.setState({skip: true});
            this.setState({player_obj: player_obj});
          }
          clearInterval(this.state.interval_id);
          await this.skipState(this.state.playlist_tracks);
        } else {
          if(this._isMounted) {
            this.setState({player_obj: player_obj});
          }
        }
      }
    } catch (error) {
      console.error(error);
    }
  }

  skipState = async (playlist_tracks) => {
    this.state.interval_id = setInterval(async () => {
      await this.skipStateHelper(this.state.playlist_tracks);
    }, 10000);
  }

  likeSong = async (playlist_tracks) => {
    // add song and let play out, revert back to "skip" state after song is done
    /*
    TO-DO: need to figure out how to detect once the song is finished playing
     in order to revert to the "skip" state
     - maybe an event listener?
     - or just check the playerObj over an interval
     - save the song length (from playerObj? or get track data endpoint) and check after setTimeout({},song_length)
     */
     try {
      console.log("Song " + this.state.player_obj.item.name + " liked!");
      this.state.liked_songs.push({
        name: this.state.player_obj.item.name,
        uri: this.state.player_obj.uri
      });
      var device_id = await getUserData('deviceId')
      if(!device_id) {
        device_id = await getDevice(this.state.accessToken)
      }
      clearInterval(this.state.interval_id)
      const res = await addSong(this.state.accessToken, playlist_tracks, device_id);
      this.state.interval_id = setInterval(async () => {
        await this.checkSongChanged();
      }, 30000)
    } catch (error) {
      console.error(error);
    }
  }

  endSession = () => {
    console.log("Session ended.");
    clearInterval(this.state.interval_id)
    this.setState({end_session: true})
  }

  render() {
    if(!this.state.end_session) {
      if(this.state.player_obj) {
        // Provide user with ability to "like songs" or "end session"
        return(
          <View style={styles.container}>
            <Image
              style={styles.image}
              source={{
                uri: this.state.player_obj.item.album.images[0].url,
              }}
            />
            <Text style={styles.header1}>{this.state.player_obj.item.artists[0].name}</Text>
            <Text style={styles.header2}>{this.state.player_obj.item.name}</Text>
            <Button
              style={styles.likebutton}
              title="Like this song"
              onPress={async () => await this.likeSong(this.state.playlist_tracks)}
            />
            <Button
              style={styles.endbutton}
              title="End session"
              onPress={() => this.endSession()}
            />
          </View>
        )
      } else {
        return(
          <View style={styles.container}>
            <Text style={styles.header1}>PLAYLIST NAME: {this.state.playlistName}</Text>
            <Text style={styles.header2}>PLAYLIST ID: {this.state.playlistId}</Text>
            <Text style={styles.title}>PLAYER IS LOADING...</Text>
          </View>
        )
      }
    } else {
      return(
        <FinalView parentState={this.state} />
      )
    }
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: "black",
    justifyContent: "center",
    //alignItems: "center"
  },
  title: {
    marginTop: 16,
    paddingVertical: 8,
    borderWidth: 4,
    borderColor: "green",
    borderRadius: 6,
    backgroundColor: "black",
    color: "green",
    textAlign: "center",
    fontSize: 30,
    fontWeight: "bold",
  },
  header1: {
    marginTop: 16,
    paddingVertical: 6,
    borderWidth: 4,
    borderColor: "green",
    borderRadius: 10,
    backgroundColor: "black",
    color: "green",
    textAlign: "center",
    fontSize: 16,
  },
  header2: {
    marginTop: 16,
    paddingVertical: 4,
    borderWidth: 2,
    borderColor: "green",
    borderRadius: 10,
    backgroundColor: "black",
    color: "green",
    textAlign: "center",
    fontSize: 14,
  },
  image: {
    width: 200,
    height: 200,
  },
  likebutton: {
    marginTop: 16,
    paddingVertical: 7,
    borderWidth: 3,
    borderColor: "green",
    borderRadius: 6,
    backgroundColor: "blue",
    color: "green",
    textAlign: "center",
    fontSize: 20,
    fontWeight: "bold",
    height: 200
  },
  endbutton: {
    marginTop: 16,
    paddingVertical: 7,
    borderWidth: 3,
    borderColor: "green",
    borderRadius: 6,
    backgroundColor: "red",
    color: "green",
    textAlign: "center",
    fontSize: 20,
    fontWeight: "bold",
    height: 100
  }
});

export default PlaybackView;
