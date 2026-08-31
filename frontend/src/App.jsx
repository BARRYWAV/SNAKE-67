import { useGameSocket } from './hooks/useGameSocket';
import MainMenu  from './components/MainMenu';
import Lobby     from './components/Lobby';
import GameScreen from './components/GameScreen';
import GameOver  from './components/GameOver';

export default function App() {
  const {
    screen, myId, roomId, isHost, isSolo,
    gameState, lobbyPlayers, endData,
    quickPlay, playSolo, startGame, sendInput, rematch, backToMenu,
  } = useGameSocket();

  return (
    <div className="h-full">
      {screen === 'menu' && (
        <MainMenu
          onQuickPlay={quickPlay}
          onSolo={playSolo}
        />
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
