// View for playback of recommended songs
//  - Given a "seed" playlist, fetch recommended songs and playback
//  - View should have a container which serves to display the currently playing song
//    - Buttons: huge one for "like song" and small one to "skip"

import {StatusBar} from 'expo-status-bar';
import * as Linking from 'expo-linking';
import React, {Component} from 'react';
import {StyleSheet, Text, View, Button, FlatList} from 'react-native';

import loginHandler from '../utils/loginUtils.js';
import { setUserData, getUserData } from '../utils/storageUtils.js';
import { getPlaylists } from '../utils/spotifyUtils.js'

class PlaybackView extends Component {

  state = this.props.parentState; // inherit state from PlaylistView (parent)

  updateState = async () => {
    this.state.accessToken = await getUserData('accessToken');
    this.state.refreshToken = await getUserData('refreshToken');
    this.state.accessTokenExpirationDate = await getUserData('expirationTime');
  }

  componentDidMount = async () => {
    this._isMounted = true;
    await loginHandler.checkTokenExpiration(this.state);
    await this.updateState()
  }

  componentWillUnmount = () => {
    this._isMounted = false;
  }

  render() {
    console.log("In PlaybackView render()");
    return(
      <View style={styles.container}>
        <Text style={styles.title}>PLAYLIST NAME: {this.state.playlistName}</Text>
        <Text style={styles.title}>PLAYLIST ID: {this.state.playlistId}</Text>
      </View>
    )
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

export default PlaybackView;
