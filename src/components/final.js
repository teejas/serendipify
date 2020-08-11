/*
FinalView, called after PlaybackView from endSession button
Contains:
  - display of all songs liked from session
  - give option to save playlist of liked songs to Spotify
  - give option to return to PlaylistView to start a new session
*/
import React, {Component} from 'react';
import {StyleSheet, Text, View, Button, FlatList, Image} from 'react-native';

import loginHandler from '../utils/loginUtils.js';
import { setUserData, getUserData } from '../utils/storageUtils.js';
import { savePlaylist, addToPlaylist } from '../utils/spotifyUtils.js';

// import PlaylistView from './playlist.js';

class FinalView extends Component {

  _isMounted = false;

  state = this.props.parentState;

  componentDidMount = async () => {
    this._isMounted = true;
    await loginHandler.checkTokenExpiration(this.state);
    await this.updateState();
  }

  componentWillUnmount = () => {
    this._isMounted = false;
  }

  updateState = async () => {
    this.state.accessToken = await getUserData('accessToken');
    this.state.refreshToken = await getUserData('refreshToken');
    this.state.accessTokenExpirationDate = await getUserData('expirationTime');
  }

  render() {
    if(!this.state.new_session) {
      if(this.state.liked_songs) {
        if(this.state.liked_songs.length > 0) {
          console.log(this.state.liked_songs)
          return (
            <View style={styles.container}>
              <Text style={styles.title}>All liked songs from this session:</Text>
              <FlatList
              data={this.state.liked_songs}
              renderItem={
                ({item}) =>
                  <Text style={styles.header2}>{item.name}</Text>
              }
              keyExtractor={(item, index) => index.toString()}
              />
              <Button
                title="Save playlist"
                onPress={async () => {
                  await savePlaylist(this.state.accessToken, this.state.liked_songs);
                  if(this.state.playlist_id) {
                    await addToPlaylist(this.state.accessToken, this.state.playlist_id, this.state.liked_songs)
                  }
                }}
              />
              <Button
                title="Start new session"
                onPress={() => {this.setState({new_session: true})}}
              />
            </View>
          )
        }
      }
      return (
        <View style={styles.container}>
          <Button
            title="Start new session"
            onPress={() => {this.setState({new_session: true})}}
          />
        </View>
      )
    } else {
      this.props.navigate('Playlist', {
        parentState: null
      });
      //return <Text style={styles.title}>START A NEW SESSION</Text>
      return null
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
  }
});

export default FinalView;
