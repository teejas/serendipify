// Load user's playlists for them to select as the seed playlist
//  - list of playlists as Button
//    - onPress => load Playback view using selected playlist as "seed"

import {StatusBar} from 'expo-status-bar';
import * as Linking from 'expo-linking';
import React, {Component} from 'react';
import {StyleSheet, Text, View, Button, FlatList} from 'react-native';
import { useNavigation } from '@react-navigation/native';

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
    this.state.playlist_id = null;
    this.state.playlist_name = null;
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
      this.setState({playlist_id: playlistObj.id});
      this.setState({playlist_name: playlistObj.name})
    }
    // navigation.navigate('Playback', {parentState: this.state})
  }

  render() {
    if(!this.state.playlist_id && this.state.playlists) {
      // const { navigation } = this.props;
      const playlist_names = []
      this.state.playlists.map(playlist => {
        const [playlist_name, playlist_id] = playlist.split(":");
        playlist_names.push({name: playlist_name, id: playlist_id});
      });
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Select a playlist to start your listening session:</Text>
          <FlatList
          data={playlist_names}
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
    } else if(this.state.playlist_id) {
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

// export default function(props) {
//   const navigation = useNavigation();
//
//   return <PlaylistView {...props} navigation={navigation} />;
// }
export default PlaylistView;
