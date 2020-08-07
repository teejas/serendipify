// View for playback of recommended songs
//  - Given a "seed" playlist, fetch recommended songs and playback
//  - View should have a container which serves to display the currently playing song
//    - Buttons: huge one for "like song" and small one to "skip"

import {StatusBar} from 'expo-status-bar';
import * as Linking from 'expo-linking';
import React, {Component} from 'react';
import {StyleSheet, Text, View, Button, FlatList, Image} from 'react-native';

import { useRoute, useNavigation } from '@react-navigation/native';
import loginHandler from '../utils/loginUtils.js';
import { setUserData, getUserData } from '../utils/storageUtils.js';
import {
  getPlaylists, getRecsFromPlaylist, getRecs,
  getPlayer, loadPlayer, addSong, clearQueue,
  skipSong, addToPlaylist,
} from '../utils/spotifyUtils.js'

import FinalView from './final.js'

class PlaybackView extends Component {

  _isMounted = false;

  state = this.props.parentState; // inherit state from PlaylistView (parent)

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

  skipStateHelper = async () => {
    if(this.state.skip) {
      if(this.state.playlist_tracks) {
        var player_obj = await loadPlayer(this.state.accessToken, this.state.playlist_tracks);
        if(this._isMounted) {
          this.setState({player_obj: player_obj});
        }
        console.log('song skipped: ' + JSON.stringify(this.state.skip));
      } else {
        console.log("OUT OF SONGS TO PLAY!");
        this.state.playlist_tracks = await getRecsFromPlaylist(this.state.accessToken, this.state.playlist_id)
      }
    }
  }

  skipState = async () => {
    this.state.interval_id = setInterval(async () => {
      await this.skipStateHelper();
    }, 10000);
  }

  returnToSkip = async () => {
    console.log("Returning to skip state");
    clearInterval(this.state.interval_id);
    if(this.state.skip) {
      await this.skipStateHelper();
    } else {
      var player_obj = await getPlayer(this.state.accessToken);
      while(player_obj.uri != this.state.curr_playing_track) {
        player_obj = await getPlayer(this.state.accessToken);
      }
      if(this._isMounted) {
        this.setState({skip: true});
        this.setState({player_obj: player_obj})
      }
    }
    await this.skipState();
  }

  /*
  FUNCTION: add song and let play out, revert back to "skip" state after song is done
  TO-DO: need to figure out how to detect once the song is finished playing
   in order to revert to the "skip" state
   - maybe an event listener?
   - or just check the playerObj over an interval
   - save the song length (from playerObj? or get track data endpoint) and check after setTimeout({},song_length)
   */
  checkSongChanged = async () => {
    try {
      console.log("checking if song has changed")
      const player_obj = await getPlayer(this.state.accessToken);
      if(player_obj) {
        if(player_obj.uri != this.state.player_obj.uri) {
          // if(this._isMounted) {
          //   this.setState({player_obj: player_obj});
          // }
          await this.returnToSkip();
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

  likeSong = async () => {
     try {
      console.log("Song " + this.state.player_obj.item.name + " liked!");
      if(this._isMounted) {
        this.setState({skip: false});
      }
      // add to liked_songs (for new playlist) and if playing from seed playlist, add to that one as well
      // *check for duplicates before adding to existing playlist*
      this.state.liked_songs.push({
        name: this.state.player_obj.item.name,
        uri: this.state.player_obj.uri
      });
      // if(this.state.playlist_id) {
      //   await addToPlaylist(this.state.accessToken, this.state.playlist_id, [this.state.player_obj.uri])
      // }
      // regenerate playlist_tracks using liked song as seed
      this.state.playlist_tracks = await getRecs(this.state.accessToken, [this.state.player_obj.item.id]);

      var device_id = await getUserData('device_id')
      if(!device_id) {
        device_id = await getDevice(this.state.accessToken)
      }
      clearInterval(this.state.interval_id)
      const res = await addSong(this.state.accessToken, this.state.playlist_tracks, device_id);
      this.state.playlist_tracks = res.playlist;
      this.state.curr_playing_track = res.track;
      this.state.interval_id = setInterval(async () => {
        await this.checkSongChanged();
      }, 10000)
    } catch (error) {
      console.error(error);
    }
  }

  skipButtonPress = async () => {
    console.log("Skip button pressed");
    const device_id = await getUserData('device_id');
    if(!device_id) {
      device_id = await getDevice(this.state.accessToken)
    }
    if(!this.state.skip) {
      await skipSong(this.state.accessToken, device_id);
    }
    await this.returnToSkip();
  }

  endSession = () => {
    console.log("Session ended.");
    clearInterval(this.state.interval_id)
    this.setState({end_session: true})
  }

  componentDidMount = async () => {
    this._isMounted = true;
    await loginHandler.checkTokenExpiration(this.state);
    await this.updateState();
    await clearQueue(this.state.accessToken);
    if(!this.state.playlist_tracks || this.state.playlist_tracks.length == 0) {
      const playlist_tracks = await getRecsFromPlaylist(this.state.accessToken, this.state.playlist_id);
      if(this._isMounted) {
        this.setState({playlist_tracks: playlist_tracks})
      }
    }
    console.log(this.state.playlist_tracks);
    await this.skipStateHelper();
    await this.skipState();
  }

  componentWillUnmount = () => {
    this._isMounted = false;
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
              onPress={async () => await this.likeSong()}
            />
            <Button
              title="Skip song"
              onPress={async () => await this.skipButtonPress()}
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
            <Text style={styles.header1}>PLAYLIST NAME: {this.state.playlist_name}</Text>
            <Text style={styles.header2}>PLAYLIST ID: {this.state.playlist_id}</Text>
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

// export default function(props) {
//   const route = useRoute();
//   const navigation = useNavigation();
//
//   return <PlaybackView {...props} route={route} navigation={navigation} />;
// }
export default PlaybackView;
