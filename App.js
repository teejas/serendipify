import {StatusBar} from 'expo-status-bar';
import * as Linking from 'expo-linking';
import React, {Component} from 'react';
import {StyleSheet, Text, View} from 'react-native';

import loginHandler from './src/utils/loginUtils.js';
import { setUserData, getUserData } from './src/utils/storageUtils.js';

import LoginView from './src/views/login.js'
import PlaylistView from './src/views/playlist.js'

class App extends Component {

  _isMounted = false;

  state = {
    hasLoggedInOnce: false,
    accessToken: '',
    accessTokenExpirationDate: '',
    refreshToken: ''
  };

  componentDidMount = async () => {
    try {
      this._isMounted = true;
      const storedTokens = await loginHandler.loadTokens();
      if(!storedTokens) {
        const url = await Linking.getInitialURL();
        if(url) {
          await this.handleOpenURL(url)
        }
        Linking.addEventListener('url', async (url) => {await this.handleOpenURL(url.url)});
      } else {
        console.log("Tokens loaded from async storage")
        await this.loggedIn(storedTokens);
      }
    } catch(error) {
      console.log("ERROR IN App.componentDidMount()");
      console.error(error);
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

  loggedIn = async () => {
    try {
      await loginHandler.checkTokenExpiration()
      await this.updateState()
      if(this._isMounted) {
        this.setState({hasLoggedInOnce: true});
      }

    } catch(error) {
      console.log("ERROR IN App.loggedIn()");
      console.error(error);
    }
  }

  handleOpenURL = async (url) => {
    try {
      console.log(url);
      if(url.includes("code")) {
        const parseObj = Linking.parse(url)
        const code = parseObj.queryParams.code;
        const res = await loginHandler.getTokens(code);
        if(res) {
          const tokens = await loginHandler.loadTokens();
          await this.loggedIn(tokens);
        } else {
          if(this._isMounted) {
            this.setState({hasLoggedInOnce: false});
          }
        }
      } else {
        if(this._isMounted) {
          this.setState({hasLoggedInOnce: false});
        }
      }
    } catch(error) {
      console.error(error)
    }
  }

  render() {
    console.log("Has logged in once? " + JSON.parse(this.state.hasLoggedInOnce));
    if(!this.state.hasLoggedInOnce) {
      return <LoginView />
    }
    else {
      return <PlaylistView parentState={this.state} />
    }
  }

}

export default App;
