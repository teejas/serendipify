import React, {Component} from 'react';
import * as WebBrowser from 'expo-web-browser';
import {StyleSheet, Button, View} from 'react-native';
import loginHandler from '../utils/loginUtils.js';

export default function LoginView() {

  const [ request, response, promptAsync ] = loginHandler.authRequest();

  return (
    <View style={styles.container}>
        <Button
        style={styles.title}
        onPress={() => promptAsync()}
        title="Login with Spotify"/>
    </View>
  );
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
