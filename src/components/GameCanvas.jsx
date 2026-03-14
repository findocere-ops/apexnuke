import React, { useEffect, useRef } from 'react'
import Phaser from 'phaser'
import BattleScene from '../game/scenes/BattleScene'

export default function GameCanvas({ players, onGameOver }) {
  const containerRef = useRef(null)
  const gameRef = useRef(null)

  useEffect(() => {
    if (gameRef.current) return

    const config = {
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: '#0a0a0a',
      scene: BattleScene,
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 0 }, // we handle gravity manually
          debug: false,
        },
      },
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      render: {
        antialias: true,
        pixelArt: false,
      },
    }

    const game = new Phaser.Game(config)
    gameRef.current = game

    // Pass data to scene
    game.scene.start('BattleScene', {
      p1: players.p1,
      p2: players.p2,
      onGameOver,
    })

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true)
        gameRef.current = null
      }
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{ cursor: 'crosshair' }}
    />
  )
}
