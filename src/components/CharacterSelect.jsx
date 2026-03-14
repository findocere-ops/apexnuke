import React, { useState } from 'react'
import { ANIMAL_DEFS } from '../game/entities/AnimalDefs'

export default function CharacterSelect({ onSelect, onBack }) {
  const [p1Choice, setP1Choice] = useState(null)
  const [p2Choice, setP2Choice] = useState(null)
  const [selectingPlayer, setSelectingPlayer] = useState(1)

  const animals = Object.entries(ANIMAL_DEFS)

  const handlePick = (animalKey) => {
    if (selectingPlayer === 1) {
      setP1Choice(animalKey)
      setSelectingPlayer(2)
    } else {
      setP2Choice(animalKey)
    }
  }

  const handleConfirm = () => {
    if (p1Choice && p2Choice) {
      onSelect(p1Choice, p2Choice)
    }
  }

  const handleReset = () => {
    setP1Choice(null)
    setP2Choice(null)
    setSelectingPlayer(1)
  }

  return (
    <div className="flex flex-col items-center gap-6 select-none">
      <h2 className="text-3xl font-black text-white tracking-tight">
        CHOOSE YOUR ANIMAL
      </h2>
      <p className="text-zinc-400 text-sm">
        {selectingPlayer === 1 && !p2Choice
          ? 'Player 1 — Pick your fighter'
          : p1Choice && !p2Choice
          ? 'Player 2 — Pick your fighter'
          : 'Ready to battle!'}
      </p>

      <div className="flex gap-6 mt-4">
        {animals.map(([key, animal]) => {
          const isP1 = p1Choice === key
          const isP2 = p2Choice === key
          const isSelected = isP1 || isP2

          return (
            <button
              key={key}
              onClick={() => handlePick(key)}
              disabled={isSelected && selectingPlayer === 2 && isP1}
              className={`
                relative w-56 p-5 rounded-xl border-2 transition-all duration-150
                ${isP1
                  ? 'border-blue-500 bg-blue-500/10'
                  : isP2
                  ? 'border-red-500 bg-red-500/10'
                  : 'border-zinc-700 bg-zinc-900 hover:border-zinc-500 hover:bg-zinc-800'}
                ${isSelected && selectingPlayer === 2 && isP1 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-95'}
              `}
            >
              {isP1 && (
                <span className="absolute top-2 right-2 text-xs font-bold text-blue-400 bg-blue-500/20 px-2 py-0.5 rounded">
                  P1
                </span>
              )}
              {isP2 && (
                <span className="absolute top-2 right-2 text-xs font-bold text-red-400 bg-red-500/20 px-2 py-0.5 rounded">
                  P2
                </span>
              )}

              <div
                className="w-20 h-20 rounded-full mx-auto mb-3 flex items-center justify-center text-3xl"
                style={{ backgroundColor: animal.color + '33', border: `2px solid ${animal.color}` }}
              >
                {animal.emoji}
              </div>

              <h3 className="text-white font-bold text-lg">{animal.name}</h3>
              <p className="text-zinc-500 text-xs mt-1">{animal.className}</p>

              <div className="mt-3 space-y-1.5 text-left">
                <StatBar label="HP" value={animal.hp} max={150} color={animal.color} />
                <StatBar label="Speed" value={animal.speed} max={300} color={animal.color} />
                <StatBar label="Jump" value={animal.jumpForce} max={600} color={animal.color} />
              </div>

              <div className="mt-3 pt-3 border-t border-zinc-700">
                <p className="text-zinc-400 text-xs">
                  <span className="text-zinc-300 font-semibold">{animal.ability.name}</span>
                  {' — '}{animal.ability.description}
                </p>
              </div>
            </button>
          )
        })}
      </div>

      <div className="flex gap-3 mt-4">
        <button
          onClick={onBack}
          className="px-6 py-2 rounded-lg border border-zinc-700 text-zinc-400
                     hover:border-zinc-500 hover:text-zinc-300 transition-all text-sm"
        >
          Back
        </button>
        {p1Choice && p2Choice ? (
          <button
            onClick={handleConfirm}
            className="bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-8
                       rounded-lg transition-all active:scale-95 text-sm"
          >
            START BATTLE
          </button>
        ) : p1Choice ? (
          <button
            onClick={handleReset}
            className="px-6 py-2 rounded-lg border border-zinc-700 text-zinc-400
                       hover:border-zinc-500 hover:text-zinc-300 transition-all text-sm"
          >
            Reset
          </button>
        ) : null}
      </div>
    </div>
  )
}

function StatBar({ label, value, max, color }) {
  const pct = Math.min((value / max) * 100, 100)
  return (
    <div className="flex items-center gap-2">
      <span className="text-zinc-500 text-[10px] w-8 uppercase">{label}</span>
      <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}
