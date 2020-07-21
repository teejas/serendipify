import {StatusBar} from 'expo-status-bar';
import React, {Component} from 'react';
import {StyleSheet, Text, View} from 'react-native';

import LoginView from './views/login.js'

class App extends Component {
  render() {
    return <LoginView />;
  }
}

export default App;
