import { useGameSocket } from './hooks/useGameSocket';
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
