import React, { useState } from 'react'
import GameCanvas from './components/GameCanvas'
import CharacterSelect from './components/CharacterSelect'
import MainMenu from './components/MainMenu'
import GameOverScreen from './components/GameOverScreen'

const SCREENS = {
  MENU: 'menu',
  SELECT: 'select',
  GAME: 'game',
  GAME_OVER: 'game_over',
}

export default function App() {
  const [screen, setScreen] = useState(SCREENS.MENU)
  const [players, setPlayers] = useState({ p1: null, p2: null })
  const [winner, setWinner] = useState(null)

  const handleStartLocal = () => setScreen(SCREENS.SELECT)

  const handleCharactersSelected = (p1Choice, p2Choice) => {
    setPlayers({ p1: p1Choice, p2: p2Choice })
    setScreen(SCREENS.GAME)
  }

  const handleGameOver = (winnerId) => {
    setWinner(winnerId)
    setScreen(SCREENS.GAME_OVER)
  }

  const handlePlayAgain = () => {
    setWinner(null)
    setPlayers({ p1: null, p2: null })
    setScreen(SCREENS.SELECT)
  }

  const handleBackToMenu = () => {
    setWinner(null)
    setPlayers({ p1: null, p2: null })
    setScreen(SCREENS.MENU)
  }

  return (
    <div className="w-screen h-screen bg-[#0a0a0a] flex items-center justify-center">
      {screen === SCREENS.MENU && (
        <MainMenu onStartLocal={handleStartLocal} />
      )}
      {screen === SCREENS.SELECT && (
        <CharacterSelect onSelect={handleCharactersSelected} onBack={handleBackToMenu} />
      )}
      {screen === SCREENS.GAME && (
        <GameCanvas
          players={players}
          onGameOver={handleGameOver}
        />
      )}
      {screen === SCREENS.GAME_OVER && (
        <GameOverScreen
          winner={winner}
          players={players}
          onPlayAgain={handlePlayAgain}
          onMenu={handleBackToMenu}
        />
      )}
    </div>
  )
}
