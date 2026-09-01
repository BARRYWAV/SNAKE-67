/**
 * useGameSocket — WebSocket hook para Killer Snake
 */
import { useRef, useState, useCallback, useEffect } from 'react';
import { playSound } from './useAudio';

const WS_URL = import.meta.env.VITE_WS_URL || (
  window.location.protocol === 'https:' ? 'wss://' : 'ws://'
) + window.location.host + '/ws';

export function useGameSocket() {
  const wsRef      = useRef(null);
  const gameStateRef = useRef(null);
  const [connected, setConnected]   = useState(false);
  const [gameState, setGameState]   = useState(null);   // { players, food, zone, grid, ... }
  const [screen, setScreen]         = useState('menu'); // menu | lobby | game | gameover
  const [myId, setMyId]             = useState(null);
  const [roomId, setRoomId]         = useState(null);
  const [isHost, setIsHost]         = useState(false);
  const [isSolo, setIsSolo]         = useState(false);
  const [lobbyPlayers, setLobbyPlayers] = useState([]);
  const [endData, setEndData]       = useState(null);   // { winner, scores }
  const [countdown, setCountdown]   = useState(null);
  const [emotes, setEmotes]         = useState([]);

  // ── Connect ────────────────────────────────────────────────────────────────
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen  = () => setConnected(true);
    ws.onclose = () => { setConnected(false); };
    ws.onerror = (e) => console.error('[WS] error', e);

    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      handleMessage(msg);
    };
  }, []);

  // ── Message handler ────────────────────────────────────────────────────────
  const handleMessage = useCallback((msg) => {
    switch (msg.type) {
      case 'joined':
        setMyId(msg.playerId);
        setRoomId(msg.roomId);
        setIsHost(msg.isHost);
        setIsSolo(!!msg.solo);
        setScreen(msg.solo ? 'game' : 'lobby');
        break;

      case 'waiting':
        setLobbyPlayers(msg.players || []);
        break;

      case 'countdown':
        setScreen('game');
        setCountdown(msg.value);
        if (msg.value === 'KILL') {
          setTimeout(() => setCountdown(null), 1000);
        }
        break;

      case 'game_started':
        setScreen('game');
        setGameState(null);
        gameStateRef.current = null;
        setCountdown(null);
        break;

      case 'game_state':
        // Sound logic
        setMyId(currentMyId => {
          if (currentMyId) {
            const prevMe = gameStateRef.current?.players?.find(p => p.id === currentMyId);
            const nextMe = msg.players?.find(p => p.id === currentMyId);
            if (prevMe && nextMe) {
               if (nextMe.score > prevMe.score) playSound('point');
               if (prevMe.alive && !nextMe.alive) playSound('dead');
            }
          }
          return currentMyId;
        });
        
        setGameState(msg);
        gameStateRef.current = msg;
        break;
        
      case 'emote':
        const emoteObj = { playerId: msg.playerId, emote: msg.emote, id: Date.now() };
        setEmotes(prev => [...prev, emoteObj]);
        setTimeout(() => {
          setEmotes(prev => prev.filter(e => e.id !== emoteObj.id));
        }, 2000);
        break;

      case 'game_over':
        setEndData({ winner: msg.winner, scores: msg.scores });
        // Don't change screen to gameover if we are a spectator in VS mode
        // Wait, we need to know if we died. We can check if myId is alive in gameState.
        // Or we handle that in App.jsx / GameScreen.jsx. For now, we will just pass it through.
        // Actually, the plan says: "Al morir en VS, el jugador no sale al menú. Se queda viendo la partida con un botón Salir."
        // That means we shouldn't show gameover screen for spectators, ONLY at the end of the game for everyone, OR we handle spectator in GameScreen.
        // The game_over message is sent at the VERY END of the game. So everyone sees the game over screen.
        // Wait, dying during the game (alive = false) does NOT trigger game_over. game_over is only triggered when 1 or 0 players remain.
        // So the spectator mode just works naturally! If you die, you stay in game_state until game_over!
        setScreen('gameover');
        break;

      case 'player_left':
        setLobbyPlayers(msg.players || []);
        break;

      default:
        break;
    }
  }, []);

  // ── Reconnect on mount ─────────────────────────────────────────────────────
  useEffect(() => {
    connect();
    return () => wsRef.current?.close();
  }, [connect]);

  // ── Send helpers ───────────────────────────────────────────────────────────
  const send = useCallback((obj) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(obj));
    }
  }, []);

  const quickPlay  = useCallback((name) => send({ type: 'quick_play', name }), [send]);
  const playSolo   = useCallback((name, difficulty) => send({ type: 'solo', name, difficulty }), [send]);
  const startGame  = useCallback(() => send({ type: 'start' }), [send]);
  const sendInput  = useCallback((key) => send({ type: 'input', key }), [send]);
  const sendEmote  = useCallback((emote) => send({ type: 'emote', emote }), [send]);
  const rematch    = useCallback(() => send({ type: 'rematch' }), [send]);
  const viewRecords = useCallback(() => setScreen('records'), []);
  const backToMenu = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN && screen !== 'records') {
        wsRef.current.close();
    }
    setScreen('menu');
    setGameState(null);
    setEndData(null);
    setLobbyPlayers([]);
    setMyId(null);
    setRoomId(null);
    setCountdown(null);
    setEmotes([]);
    if (screen !== 'records') {
        setTimeout(connect, 200);
    }
  }, [connect, screen]);

  return {
    connected, screen, myId, roomId, isHost, isSolo,
    gameState, lobbyPlayers, endData, countdown, emotes,
    quickPlay, playSolo, startGame, sendInput, sendEmote, rematch, backToMenu, viewRecords,
  };
}
