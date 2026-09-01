import { useEffect } from 'react';
import { useGameSocket } from './hooks/useGameSocket';
import { useAudioController, playSound } from './hooks/useAudio';
import MainMenu  from './components/MainMenu';
import Lobby     from './components/Lobby';
import GameScreen from './components/GameScreen';
import GameOver  from './components/GameOver';
import Records   from './components/Records';

export default function App() {
  const {
    screen, myId, roomId, isHost, isSolo,
    gameState, lobbyPlayers, endData, countdown, emotes,
    quickPlay, playSolo, startGame, sendInput, sendEmote, rematch, backToMenu, viewRecords,
  } = useGameSocket();

  useAudioController(screen);

  useEffect(() => {
    const handlePointerDown = (e) => {
      const target = e.target.closest('button, a, .clickable');
      if (target && !target.closest('.dpad-container')) {
        playSound('tap');
      }
    };
    document.addEventListener('pointerdown', handlePointerDown, true);
    return () => document.removeEventListener('pointerdown', handlePointerDown, true);
  }, []);

  return (
    <div className="h-full">
      {screen === 'menu' && (
        <MainMenu
          onQuickPlay={quickPlay}
          onSolo={playSolo}
          onRecords={viewRecords}
        />
      )}

      {screen === 'records' && (
        <Records onBack={backToMenu} />
      )}

      {screen === 'lobby' && (
        <Lobby
          roomId={roomId}
          players={lobbyPlayers}
          isHost={isHost}
          onStart={startGame}
        />
      )}

      {screen === 'game' && (
        <GameScreen
          gameState={gameState}
          myId={myId}
          isSolo={isSolo}
          sendInput={sendInput}
          countdown={countdown}
          emotes={emotes}
          sendEmote={sendEmote}
          backToMenu={backToMenu}
        />
      )}

      {screen === 'gameover' && (
        <GameOver
          endData={endData}
          isSolo={isSolo}
          onRematch={() => { rematch(); }}
          onMenu={backToMenu}
        />
      )}
    </div>
  );
}
