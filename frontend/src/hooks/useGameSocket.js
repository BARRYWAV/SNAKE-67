/**
 * useGameSocket — WebSocket hook para Killer Snake
 */
import { useRef, useState, useCallback, useEffect } from 'react';

const WS_URL = import.meta.env.VITE_WS_URL || (
  window.location.protocol === 'https:' ? 'wss://' : 'ws://'
) + window.location.host + '/ws';

export function useGameSocket() {
  const wsRef      = useRef(null);
  const [connected, setConnected]   = useState(false);
  const [gameState, setGameState]   = useState(null);   // { players, food, zone, grid, ... }
  const [screen, setScreen]         = useState('menu'); // menu | lobby | game | gameover
  const [myId, setMyId]             = useState(null);
  const [roomId, setRoomId]         = useState(null);
  const [isHost, setIsHost]         = useState(false);
  const [isSolo, setIsSolo]         = useState(false);
  const [lobbyPlayers, setLobbyPlayers] = useState([]);
  const [endData, setEndData]       = useState(null);   // { winner, scores }

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

      case 'game_started':
        setScreen('game');
        setGameState(null);
        break;

      case 'game_state':
        setGameState(msg);
        break;

      case 'game_over':
        setEndData({ winner: msg.winner, scores: msg.scores });
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
  const rematch    = useCallback(() => send({ type: 'rematch' }), [send]);
  const backToMenu = useCallback(() => {
    wsRef.current?.close();
    setScreen('menu');
    setGameState(null);
    setEndData(null);
    setLobbyPlayers([]);
    setMyId(null);
    setRoomId(null);
    // Reconectar para siguiente partida
    setTimeout(connect, 200);
  }, [connect]);

  return {
    connected, screen, myId, roomId, isHost, isSolo,
    gameState, lobbyPlayers, endData,
    quickPlay, playSolo, startGame, sendInput, rematch, backToMenu,
  };
}
