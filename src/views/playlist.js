// Load user's playlists for them to select as the seed playlist
//  - list of playlists as Button
//    - onPress => load Playback view using selected playlist as "seed"

import {StatusBar} from 'expo-status-bar';
import * as Linking from 'expo-linking';
import React, {Component} from 'react';
import {StyleSheet, Text, View, Button, FlatList} from 'react-native';

import loginHandler from '../utils/loginUtils.js';
import { setUserData, getUserData, clearAll } from '../utils/storageUtils.js';
import { getPlaylists } from '../utils/spotifyUtils.js'

import PlaybackView from './playback.js'

class PlaylistView extends Component {

  _isMounted = false;

  state = this.props.parentState; // inherit state from parent

  componentDidMount = async () => {
    this._isMounted = true;
    await loginHandler.checkTokenExpiration();
    await this.updateState();
    this.state.playlistId = null;
    this.state.playlistName = null;
    const playlists = await getPlaylists(this.state.accessToken);
    if(this._isMounted) {
      this.setState({playlists: playlists});
    }
  }

  componentWillUnmount = () => {
    this._isMounted = false;
  }

  updateState = async () => {
    this.state.accessToken = await getUserData('accessToken');
    this.state.refreshToken = await getUserData('refreshToken');
    this.state.accessTokenExpirationDate = await getUserData('expirationTime');
  }

  setPlaybackState = (playlistObj) => {
    if(this._isMounted) {
      this.setState({playlistId: playlistObj.id});
      this.setState({playlistName: playlistObj.name})
    }
  }

  render() {
    if(!this.state.playlistId && this.state.playlists) {
      const playlistNames = []
      this.state.playlists.map(playlist => {
        const [playlistName, playlistId] = playlist.split(":");
        playlistNames.push({name: playlistName, id: playlistId});
      });
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Select a playlist to start your listening session:</Text>
          <FlatList
          data={playlistNames}
          renderItem={
            ({item}) =>
              <Button
              style={styles.title}
              title={item.name}
              onPress={() => this.setPlaybackState(item)}
              />
          }
          />
        </View>
      );
    } else if(this.state.playlistId) {
      return <PlaybackView parentState={this.state} />
    } else {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Loading playlists from Spotify</Text>
        </View>
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
    alignItems: "center"
  },
  title: {
    marginTop: 16,
    paddingVertical: 8,
    borderWidth: 4,
    borderColor: "black",
    borderRadius: 6,
    backgroundColor: "green",
    color: "black",
    textAlign: "center",
    fontSize: 30,
    fontWeight: "bold",
  }
});


export default PlaylistView;
