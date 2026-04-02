'use client'

import React, { useEffect, useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface ConfettiProps {
  active: boolean
  onComplete?: () => void
}

export function Confetti({ active, onComplete }: ConfettiProps) {
  const [particles, setParticles] = useState<any[]>([])

  const fire = useCallback(() => {
    const colors = ['#8b5cf6', '#6366f1', '#ec4899', '#3b82f6', '#10b981', '#f59e0b']
    const newParticles = Array.from({ length: 50 }).map((_, i) => ({
      id: Math.random(),
      color: colors[Math.floor(Math.random() * colors.length)],
      angle: Math.random() * 360,
      velocity: 10 + Math.random() * 20,
      rotation: Math.random() * 360,
      size: 4 + Math.random() * 10,
      shape: Math.random() > 0.5 ? 'circle' : 'square'
    }))
    setParticles(newParticles)
    
    setTimeout(() => {
      setParticles([])
      if (onComplete) onComplete()
    }, 2000)
  }, [onComplete])

  useEffect(() => {
    if (active) fire()
  }, [active, fire])

  return (
    <div className="fixed inset-0 pointer-events-none z-[999] overflow-hidden">
      <AnimatePresence>
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ 
              x: '50vw', 
              y: '50vh', 
              scale: 0.2, 
              opacity: 1,
              rotate: 0 
            }}
            animate={{
              x: `calc(50vw + ${Math.cos((p.angle * Math.PI) / 180) * p.velocity * 20}px)`,
              y: `calc(50vh + ${Math.sin((p.angle * Math.PI) / 180) * p.velocity * 20 + 200}px)`,
              opacity: 0,
              scale: [0.2, 1, 0.5],
              rotate: p.rotation + 720,
            }}
            transition={{ duration: 1.5, ease: 'circOut' }}
            style={{
              position: 'absolute',
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
              borderRadius: p.shape === 'circle' ? '50%' : '2px',
              boxShadow: `0 0 10px ${p.color}44`
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}
