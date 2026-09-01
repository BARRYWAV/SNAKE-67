import { useEffect } from 'react';

export const audioContext = {
  tap: typeof window !== 'undefined' ? new Audio('/sounds/tap.wav') : null,
  point: typeof window !== 'undefined' ? new Audio('/sounds/point.wav') : null,
  dead: typeof window !== 'undefined' ? new Audio('/sounds/dead.wav') : null,
  game_over: typeof window !== 'undefined' ? new Audio('/sounds/game_over.wav') : null,
  menu_song: typeof window !== 'undefined' ? new Audio('/sounds/menu_song.wav') : null,
};

if (typeof window !== 'undefined') {
  if (audioContext.menu_song) {
    audioContext.menu_song.loop = true;
    audioContext.menu_song.volume = 1.0;
  }
}

let webAudioCtx = null;
let gameSongBuffer = null;
let gameSongNode = null;

if (typeof window !== 'undefined') {
  webAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
  
  fetch('/sounds/game_song.wav')
    .then(r => r.arrayBuffer())
    .then(buf => webAudioCtx.decodeAudioData(buf))
    .then(decoded => { gameSongBuffer = decoded; })
    .catch(e => console.error("Error loading game song", e));
}

export const playSound = (name, forceRestart = true) => {
  if (name === 'game_song') {
     if (!webAudioCtx || !gameSongBuffer) return;
     if (webAudioCtx.state === 'suspended') webAudioCtx.resume();
     
     if (gameSongNode) {
        if (!forceRestart) return;
        try { gameSongNode.stop(); } catch(e) {}
     }
     
     gameSongNode = webAudioCtx.createBufferSource();
     gameSongNode.buffer = gameSongBuffer;
     gameSongNode.loop = true;
     gameSongNode.connect(webAudioCtx.destination);
     gameSongNode.start(0);
     return;
  }

  const snd = audioContext[name];
  if (snd) {
    if (forceRestart) {
      snd.currentTime = 0;
    }
    if (snd.paused) {
      snd.play().catch(e => console.warn("Audio play failed:", e));
    }
  }
};

export const stopSound = (name) => {
  if (name === 'game_song') {
      if (gameSongNode) {
          try { gameSongNode.stop(); } catch(e) {}
          gameSongNode.disconnect();
          gameSongNode = null;
      }
      return;
  }
  
  const snd = audioContext[name];
  if (snd) {
    snd.pause();
  }
};

export const useAudioController = (screen) => {
  useEffect(() => {
    // Menu logic: play without forcing restart if it's already playing
    if (screen === 'menu' || screen === 'lobby' || screen === 'records') {
      stopSound('game_song');
      playSound('menu_song', false);
    } else if (screen === 'game') {
      stopSound('menu_song');
      playSound('game_song', true);
    } else if (screen === 'gameover') {
      stopSound('game_song');
      stopSound('menu_song');
      playSound('game_over', true);
    }
  }, [screen]);
};
