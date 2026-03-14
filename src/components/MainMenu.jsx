import React from 'react'

export default function MainMenu({ onStartLocal }) {
  return (
    <div className="flex flex-col items-center gap-8 select-none">
      <div className="text-center">
        <h1 className="text-6xl font-black text-white tracking-tighter">
          APEX <span className="text-red-500">NUKE</span>
        </h1>
        <p className="text-zinc-500 text-lg mt-2 tracking-widest uppercase">
          Animal PVP Combat
        </p>
      </div>

      <div className="flex flex-col gap-3 w-64 mt-4">
        <button
          onClick={onStartLocal}
          className="bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-6 rounded-lg
                     transition-all duration-150 active:scale-95 text-lg tracking-wide"
        >
          LOCAL BATTLE
        </button>
        <button
          disabled
          className="bg-zinc-800 text-zinc-500 font-bold py-3 px-6 rounded-lg
                     text-lg tracking-wide cursor-not-allowed opacity-60"
        >
          ONLINE BATTLE
          <span className="block text-xs font-normal text-zinc-600 mt-0.5">Coming Soon</span>
        </button>
      </div>

      <div className="text-zinc-700 text-xs mt-8">
        WASD to move &middot; Mouse to aim &middot; Click to fire
      </div>
    </div>
  )
}
