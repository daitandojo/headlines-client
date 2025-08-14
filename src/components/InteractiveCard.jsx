// src/components/InteractiveCard.jsx (version 1.0)
'use client'

import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'

export function InteractiveCard({ children, className }) {
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const springConfig = { damping: 25, stiffness: 200 }
  const mouseXSpring = useSpring(mouseX, springConfig)
  const mouseYSpring = useSpring(mouseY, springConfig)

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['6deg', '-6deg'])
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-6deg', '6deg'])

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const width = rect.width
    const height = rect.height
    const mouseXPos = e.clientX - rect.left
    const mouseYPos = e.clientY - rect.top

    // Normalize mouse position to a range of -0.5 to 0.5
    const normalizedX = mouseXPos / width - 0.5
    const normalizedY = mouseYPos / height - 0.5

    mouseX.set(normalizedX)
    mouseY.set(normalizedY)
  }

  const handleMouseLeave = () => {
    mouseX.set(0)
    mouseY.set(0)
  }

  // For the shine effect
  const shineX = useMotionValue(0)
  const shineY = useMotionValue(0)

  const handleShineMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    shineX.set(e.clientX - rect.left)
    shineY.set(e.clientY - rect.top)
  }

  return (
    <motion.div
      className={`relative w-full ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onPointerMove={handleShineMove}
      style={{
        transformStyle: 'preserve-3d',
        rotateX,
        rotateY,
      }}
      whileTap={{
        scale: 0.97,
        transition: { type: 'spring', stiffness: 400, damping: 17 },
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800/60 shadow-lg shadow-black/40 border border-slate-700 pointer-events-none" />
      <motion.div
        className="absolute inset-0 rounded-xl masked-gradient pointer-events-none"
        style={{
          '--x': shineX,
          '--y': shineY,
          background:
            'radial-gradient(circle at center, rgba(200, 200, 255, 0.25), transparent)',
          opacity: useTransform(mouseXSpring, [-0.5, 0.5], [0.5, 0.5]),
          transition: 'opacity 0.2s',
        }}
      />
      <div className="relative z-10">{children}</div>
    </motion.div>
  )
}
