import React, {Component} from 'react';
import * as WebBrowser from 'expo-web-browser';
import {StyleSheet, Button, View, Text, Linking} from 'react-native';
import loginHandler from '../utils/loginUtils.js';

class LoginView extends Component {

  _isMounted = false;

  state = {}

  handleClick = () => {
    Linking.canOpenURL(this.state.auth_url).then(supported => {
      if (supported) {
        Linking.openURL(this.state.auth_url);
      } else {
        console.log("Don't know how to open URI: " + this.state.auth_url);
      }
    });
  };

  componentDidMount = async () => {
    this._isMounted = true;
    const url = await loginHandler.authRequest();
    if(this._isMounted) {
      this.setState({auth_url: url});
    }
  }

  componentWillUnmount = () => {
    this._isMounted = false;
  }

  render() {
    return (
      <View style={styles.container}>
          <Button
          style={styles.title}
          //onPress={() => this.state.prompt()}
          onPress={() => this.handleClick()}
          title="Login with Spotify"/>
      </View>
    );
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

export default LoginView;
