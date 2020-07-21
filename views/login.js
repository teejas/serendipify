import * as React from 'react';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri, useAuthRequest } from 'expo-auth-session';
import {StyleSheet, Button, View} from 'react-native';
import { spotifyCredentials } from '../secrets.js';

WebBrowser.maybeCompleteAuthSession();

// Endpoint
const discovery = {
  authorizationEndpoint: 'https://accounts.spotify.com/authorize',
  tokenEndpoint: 'https://accounts.spotify.com/api/token',
};

export default function LoginView() {
  const redirectUri = makeRedirectUri({
    // For usage in bare and standalone
    native: spotifyCredentials.redirectUri, // Redirect to playlist view
  });
  console.log(redirectUri)
  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: spotifyCredentials.clientId,
      clientSecret: spotifyCredentials.clientSecret,
      scopes: [
        'playlist-read-private',
        'playlist-modify-public',
        'playlist-modify-private',
        'user-library-read',
        'user-library-modify',
        'user-top-read',
        'user-read-playback-state',
        'streaming'
      ],
      // In order to follow the "Authorization Code Flow" to fetch token after authorizationEndpoint
      // this must be set to false
      usePKCE: false,
      // For usage in managed apps using the proxy
      redirectUri: redirectUri,
    },
    discovery
  );

  React.useEffect(() => {
    if (response?.type === 'success') {
      const { code } = response.params;
      }
  }, [response]);

  return (
    <View style={styles.container}>
        <Button disabled={!request} style={styles.title} onPress={() => promptAsync()} title="Login with Spotify"/>
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
