import { useEffect } from 'react';

export const audioContext = {
  tap: typeof window !== 'undefined' ? new Audio('/sounds/tap.wav') : null,
  point: typeof window !== 'undefined' ? new Audio('/sounds/point.wav') : null,
  dead: typeof window !== 'undefined' ? new Audio('/sounds/dead.wav') : null,
  game_over: typeof window !== 'undefined' ? new Audio('/sounds/game_over.wav') : null,
  menu_song: typeof window !== 'undefined' ? new Audio('/sounds/menu_song.wav') : null,
  game_song: typeof window !== 'undefined' ? new Audio('/sounds/game_song.wav') : null,
};

if (typeof window !== 'undefined') {
  if (audioContext.menu_song) {
    audioContext.menu_song.loop = true;
    audioContext.menu_song.volume = 0.5;
  }
  if (audioContext.game_song) {
    audioContext.game_song.loop = true;
    audioContext.game_song.volume = 0.5;
  }
}

export const playSound = (name) => {
  const snd = audioContext[name];
  if (snd) {
    snd.currentTime = 0;
    snd.play().catch(e => console.warn("Audio play failed, waiting for user interaction:", e));
  }
};

export const stopSound = (name) => {
  const snd = audioContext[name];
  if (snd) {
    snd.pause();
  }
};

export const useAudioController = (screen) => {
  useEffect(() => {
    // Background music logic
    if (screen === 'menu' || screen === 'lobby' || screen === 'records') {
      stopSound('game_song');
      playSound('menu_song');
    } else if (screen === 'game') {
      stopSound('menu_song');
      playSound('game_song');
    } else if (screen === 'gameover') {
      stopSound('game_song');
      stopSound('menu_song');
      playSound('game_over');
    }
  }, [screen]);
};
