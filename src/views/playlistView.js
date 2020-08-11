import PlaylistScreen from '../components/playlist.js';
import React, {Component} from 'react';

const PlaylistView = ({ route, navigation }) => {
  return <PlaylistScreen parentState={route.params.parentState} navigate={navigation.navigate}/>;
}

export default PlaylistView;
