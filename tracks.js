import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TrackPlayer from 'react-native-track-player';
import {useGlobalState, setGlobalState} from 'state.js';
import Toast from 'react-native-toast-message';

/* fire this on app startup to load stored tracks into the player */

export async function loadStoredTracks() {
  try {
    const loadedTracks = await AsyncStorage.getItem('@tracks');
    const tracks = JSON.parse(loadedTracks);
    const loadedCurrentIndex = await AsyncStorage.getItem('@currentIndex');
    const currentIndex = parseInt(loadedCurrentIndex);

    if (tracks && tracks.length > 0) {
      await TrackPlayer.reset();
      await TrackPlayer.add(tracks);
      await TrackPlayer.skip(currentIndex);
      const currentTrack = await TrackPlayer.getTrack(currentIndex);
      updatePlaylistCounter(tracks.length);
      setGlobalState('currentQueue', tracks);
      setGlobalState('currentIndex', currentIndex);
      setGlobalState('currentTrack', currentTrack);
    }
  } catch (e) {
    console.log('[tracks.js] loadStoredTracks Error: ', e);
  }
}

// this should run whenever an action happens on TrackPlayer:
// play, add, delete, next/prev (pause is not necessary)

export async function storeTracks() {
  try {
    const tracks = await TrackPlayer.getQueue();
    var currentIndex = null;
    var currentTrack = null;

    if (tracks && tracks.length) {
      currentIndex = await TrackPlayer.getCurrentTrack();
      currentTrack = await TrackPlayer.getTrack(currentIndex);
      const tracksStringify = JSON.stringify(tracks);
      const indexStringify = currentIndex.toString();
      await AsyncStorage.setItem('@tracks', tracksStringify);
      await AsyncStorage.setItem('@currentIndex', indexStringify);
    } else {
      await AsyncStorage.removeItem('@tracks');
      await AsyncStorage.removeItem('@currentIndex');
    }

    setGlobalState('currentQueue', tracks);
    setGlobalState('currentIndex', currentIndex);
    setGlobalState('currentTrack', currentTrack);
    setGlobalState('playlistCounter', tracks.length);
  } catch (e) {
    console.log('[tracks.js] Storing Data Error: ', e);
    
    //attempt to reset
    updatePlaylistCounter(0);
    await AsyncStorage.removeItem('@tracks');
    await AsyncStorage.removeItem('@currentIndex');
  }
}

/* returns status to our player based 
   on the current state of TrackPlayer */

export function getStatusText(playbackState, State) {
  switch (playbackState) {
    case State.Buffering:
      return 'BUFFERING...';
    case State.Loading:
      return 'LOADING...';
    case State.Connecting:
      return 'CONNECTING...';
    case State.Paused:
      return 'PAUSED (READY TO PLAY)';
    case State.Playing:
      return 'NOW PLAYING';
    default:
      return 'READY TO PLAY';
  }
}

/* desicdes what type of button to show */

export function buttonType(playbackState, State) {
  switch (playbackState) {
    case State.Buffering:
      return 'load';
    case State.Loading:
      return 'load';
    case State.Connecting:
      return 'load';
    case State.Paused:
      return 'pause';
    case State.Playing:
      return 'play';
    default:
      return 'pause';
  }
}

/*  this is how we add tracks. two actions:
    'play' - adds the track and immediately plays
    'atpl' - adds to playlist only
    
    you should pass the track, 
    all the current tracks and the action
*/

export async function addTrack(newTrack, tracks, action) {
  console.log('action:', action);
  console.log('newTrack:', newTrack);
  //console.log('tracks:', tracks);
  var inQueue = false;
  var i = 0;
  var indexMatch = 0;
  var numTracks = tracks.length;

  //check if track to add is already in the playlist
  //make sure you are passing an id of some sort
  
  for (const checktrack of tracks) {
    if (checktrack.id === newTrack.id) {
      inQueue = true;
      indexMatch = i;
    }
    i = i + 1;
  }

  if (inQueue === false) {
    console.log('[tracks.js] No match, adding track to playlist');
    TrackPlayer.add(newTrack);
    await storeTracks();

    if (action === 'play') {
      await TrackPlayer.skip(numTracks);
      await TrackPlayer.play();
    }
  }

  if (inQueue === true && action === 'play') {
    console.log('[tracks.js] Track already in playlist, playing:', indexMatch);
    await TrackPlayer.skip(indexMatch);
    await TrackPlayer.play();
  }

  if (action === 'atpl' && inQueue === true) {
    Toast.show({
      type: 'info',
      text1: 'Selection already in playlist.',
      topOffset: 60,
    });
  }

  if (action === 'atpl' && inQueue === false) {
    Toast.show({
      type: 'success',
      text1: 'Selection added to playlist.',
      topOffset: 60,
    });
  }
}
