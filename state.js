import {createGlobalState} from 'react-hooks-global-state';

const {setGlobalState, useGlobalState} = createGlobalState({
  playlistCounter: 0,
  currentIndex: null,
  currentTrack: null,
  currentQueue: [],
});

export {useGlobalState, setGlobalState};
