'use client'

import { motion } from 'framer-motion'

interface FloatingPathsProps {
  position: number
  density?: number
  speed?: number
}

// Floating paths component
export function FloatingPaths({ position, density = 24, speed = 1 }: FloatingPathsProps) {
  const paths = Array.from({ length: density }, (_, i) => ({
    id: i,
    d: `M-${380 - i * 5 * position} -${189 + i * 6}C-${380 - i * 5 * position} -${189 + i * 6} -${312 - i * 5 * position} ${216 - i * 6} ${
      152 - i * 5 * position
    } ${343 - i * 6}C${616 - i * 5 * position} ${470 - i * 6} ${
      684 - i * 5 * position
    } ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`,
    width: 0.3 + i * 0.02,
  }))

  return (
    <div className="absolute inset-0 pointer-events-none">
      <svg className="w-full h-full text-white/30" viewBox="0 0 696 316" fill="none">
        <title>Background Paths</title>
        {paths.map(path => (
          <motion.path
            key={path.id}
            d={path.d}
            stroke="currentColor"
            strokeWidth={path.width}
            strokeOpacity={0.1 + path.id * 0.01}
            initial={{ pathLength: 0.3, opacity: 0.6 }}
            animate={{
              pathLength: 1,
              opacity: [0.3, 0.6, 0.3],
              pathOffset: [0, 1, 0],
            }}
            transition={{
              duration: (20 + Math.random() * 10) / speed,
              repeat: Number.POSITIVE_INFINITY,
              ease: 'linear',
            }}
          />
        ))}
      </svg>
    </div>
  )
}

interface BlobProps {
  className: string
  style?: React.CSSProperties
  animate?: boolean
  intensity?: number
}

// Blob component
export function Blob({ className, style, animate = true, intensity = 1 }: BlobProps) {
  return (
    <motion.div
      className={`absolute rounded-full ${className}`}
      style={style}
      initial={animate ? { scale: 0.8, opacity: 0.8 } : {}}
      animate={
        animate
          ? {
              scale: [0.8, 1.1, 0.9],
              opacity: [0.7, 0.9, 0.7],
            }
          : {}
      }
      transition={{
        duration: 8 / intensity,
        repeat: Number.POSITIVE_INFINITY,
        repeatType: 'reverse',
        ease: 'easeInOut',
      }}
    />
  )
}

interface GradientBackgroundProps {
  showPaths?: boolean
  showBlobs?: boolean
  animationSpeed?: number
  className?: string
  color?: string
}

export function GradientBackground({
  showPaths = true,
  showBlobs = true,
  animationSpeed = 1,
  className = '',
  color = 'linear-gradient(to bottom right, #6B46C1, #9333EA, #FF2670)',
}: GradientBackgroundProps) {
  return (
    <div className={`absolute inset-0 -z-10 ${className}`} style={{ background: color }}>
      {/* Background blobs */}
      {showBlobs && (
        <div className="absolute inset-0 overflow-hidden">
          <Blob
            className="w-[40%] h-[40%] -left-[5%] -top-[5%]"
            style={{ backgroundColor: 'rgba(255, 38, 112, 0.6)' }}
            intensity={animationSpeed}
          />
          <Blob className="w-[35%] h-[35%] right-[10%] top-[15%]" style={{ backgroundColor: 'rgba(255, 38, 112, 0.5)' }} animate={false} />
          <Blob
            className="w-[25%] h-[25%] right-[5%] bottom-[25%]"
            style={{ backgroundColor: 'rgba(255, 38, 112, 0.4)' }}
            intensity={animationSpeed}
          />
          <Blob className="w-[30%] h-[30%] left-[20%] bottom-[5%]" style={{ backgroundColor: 'rgba(255, 38, 112, 0.6)' }} animate={false} />
          <Blob
            className="w-[45%] h-[45%] right-[0%] bottom-[0%]"
            style={{ backgroundColor: 'rgba(255, 38, 112, 0.3)' }}
            intensity={animationSpeed}
          />
        </div>
      )}

      {/* Animated flowing lines */}
      {showPaths && (
        <>
          <FloatingPaths position={1} speed={animationSpeed} />
          <FloatingPaths position={-1} speed={animationSpeed} />
        </>
      )}
    </div>
  )
}
