import React, {Component} from 'react';
import {StyleSheet, Text, View, Button, Linking} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import loginHandler from '../utils/loginUtils.js';
import { setUserData, getUserData } from '../utils/storageUtils.js';

class HomeScreen extends Component {

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
        if(!this.state.auth_url) {
          const auth_url = await loginHandler.authRequest();
          if(this._isMounted) {
            this.setState({auth_url: auth_url});
          }
        }
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
        var regex = /[?&]([^=#]+)=([^&#]*)/g;
        var params = {};
        var match;
        while (match = regex.exec(url)) {
          params[match[1]] = match[2];
        }
        console.log(params)
        const code = params.code;
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

  handleClick = () => {
    Linking.canOpenURL(this.state.auth_url).then(supported => {
      if (supported) {
        Linking.openURL(this.state.auth_url);
      } else {
        console.log("Don't know how to open URI: " + this.state.auth_url);
      }
    });
  };

  render() {
    console.log("Has logged in once? " + JSON.parse(this.state.hasLoggedInOnce));
    if(!this.state.hasLoggedInOnce) {
      // this.props.navigate('Login');
      return (
        <View style={styles.container}>
            <Button
            style={styles.title}
            //onPress={() => this.state.prompt()}
            onPress={() => this.handleClick()}
            title="Login with Spotify"/>
        </View>
      )
    }
    else {
      this.props.navigate('Playlist', {
        parentState: this.state,
      })
    }
    return null;
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

export default HomeScreen;
