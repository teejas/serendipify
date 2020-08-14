import React, {Component} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createAppContainer, createStackNavigator } from '@react-navigation/stack';

import loginHandler from './src/utils/loginUtils.js';
import { setUserData, getUserData } from './src/utils/storageUtils.js';

import HomeView from './src/views/homeView.js'
import LoginView from './src/views/loginView.js'
import PlaylistView from './src/views/playlistView.js'
import PlaybackView from './src/views/playbackView.js'
import FinalView from './src/views/finalView.js'

const Stack = createStackNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={HomeView} />
        <Stack.Screen name="Login" component={LoginView} />
        <Stack.Screen name="Playlist" component={PlaylistView} />
        <Stack.Screen name="Playback" component={PlaybackView} />
        <Stack.Screen name="Final" component={FinalView} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;
