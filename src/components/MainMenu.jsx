import React from 'react'

const isTouchDevice = typeof window !== 'undefined' && (
  'ontouchstart' in window || navigator.maxTouchPoints > 0
)

export default function MainMenu({ onStartLocal }) {
  return (
    <div className="flex flex-col items-center gap-6 sm:gap-8 select-none px-4">
      <div className="text-center">
        <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tighter">
          APEX <span className="text-red-500">NUKE</span>
        </h1>
        <p className="text-zinc-500 text-sm sm:text-lg mt-2 tracking-widest uppercase">
          Animal PVP Combat
        </p>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-64 mt-2 sm:mt-4">
        <button
          onClick={onStartLocal}
          className="bg-red-600 hover:bg-red-500 text-white font-bold py-4 sm:py-3 px-6 rounded-lg
                     transition-all duration-150 active:scale-95 text-lg tracking-wide"
        >
          LOCAL BATTLE
        </button>
        <button
          disabled
          className="bg-zinc-800 text-zinc-500 font-bold py-4 sm:py-3 px-6 rounded-lg
                     text-lg tracking-wide cursor-not-allowed opacity-60"
        >
          ONLINE BATTLE
          <span className="block text-xs font-normal text-zinc-600 mt-0.5">Coming Soon</span>
        </button>
      </div>

      <div className="text-zinc-700 text-xs mt-4 sm:mt-8 text-center">
        {isTouchDevice
          ? 'Joystick to move \u00B7 Tap right side to aim \u00B7 Release to fire'
          : 'WASD to move \u00B7 Mouse to aim \u00B7 Click to fire'}
      </div>
    </div>
  )
}
