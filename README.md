# Serendipify
A context aware mobile recommender for music with automatic playback

## The Problem

I love biking, and listening to music while I'm doing something active adds to the experience as a whole. One problem I face while trying to listen to music and bike is constantly having to skip songs until I find the right one. Even if I create playlists beforehand specifically for the coming bike ride I find myself skipping over songs which just don't fit the mood. Furthermore, I love discovering new music even if I have to be hands-free. This becomes frustrating, even dangerous, if you're focus (and hands) needs to be on the activity at hand, but you're constantly wanting to skip the song.

## The Solution

I came up with the idea of Serendipify to leverage the Spotify web API and context based recommendation systems so that I can still discover and listen to new music while I'm biking or running. It has automatic playback so that you don't have to worry about skipping songs physically. Recommended songs play in 30 second snippets, and if you don't like it or it isn't fitting the vibe just wait 30 seconds for the next song to come on. But if you like a song just give a single tap to either your headphones or phone screen and the song will be added to a playlist created specifically for the current listening session and the whole song will play.

## Development

I'm going to break development up in to two stages. Stage 1 is to create a working mobile app with automatic playback. Stage 2 is to add in the context awareness to adjust the recommendation parameters.

### Stage 1

Development here is going to be done more or less entirely in Expo + React. The functionality we require here can be described by the following flow:

Login using Spotify OAuth => Choose one of your playlists as the "seed" => Use the "seed" to get recommendations from Spotify => Playback using the recommended tracks, skipping every 10-30 seconds unless user says otherwise

### Stage 2

After we've finished the first iteration of the application we can move on to adding the context awareness. This is best described as a mathematical model which takes context features as input (i.e. weather, temperature, velocity, activity) and maps them to audio features (i.e. valence, positivity, speechiness, etc.). The generated audio features can then be passed to the Spotify get_recommendations() endpoint to generate more relevant recommendations.
