import React from 'react'
import { ANIMAL_DEFS } from '../game/entities/AnimalDefs'

export default function GameOverScreen({ winner, players, onPlayAgain, onMenu }) {
  const winnerAnimal = winner === 1 ? ANIMAL_DEFS[players.p1] : ANIMAL_DEFS[players.p2]

  return (
    <div className="flex flex-col items-center gap-4 sm:gap-6 select-none px-4">
      <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
        PLAYER {winner} <span className="text-red-500">WINS</span>
      </h2>

      <div
        className="w-28 h-28 rounded-full flex items-center justify-center text-5xl mt-2"
        style={{ backgroundColor: winnerAnimal.color + '33', border: `3px solid ${winnerAnimal.color}` }}
      >
        {winnerAnimal.emoji}
      </div>

      <p className="text-zinc-400 text-lg">
        {winnerAnimal.name} is victorious!
      </p>

      <div className="flex gap-3 mt-4 sm:mt-6">
        <button
          onClick={onPlayAgain}
          className="bg-red-600 hover:bg-red-500 text-white font-bold py-4 sm:py-3 px-8
                     rounded-lg transition-all active:scale-95"
        >
          PLAY AGAIN
        </button>
        <button
          onClick={onMenu}
          className="px-6 py-4 sm:py-3 rounded-lg border border-zinc-700 text-zinc-400
                     hover:border-zinc-500 hover:text-zinc-300 transition-all"
        >
          Main Menu
        </button>
      </div>
    </div>
  )
}
