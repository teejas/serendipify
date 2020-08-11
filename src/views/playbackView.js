import PlaybackScreen from '../components/playback.js';
import React, {Component} from 'react';

const PlaybackView = ({ route, navigation }) => {
  return <PlaybackScreen parentState={route.params.parentState} navigate={navigation.navigate}/>;
}

export default PlaybackView
