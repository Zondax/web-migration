'use client';

import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import Link from 'next/link';
import React from 'react';

function FloatingPaths({ position }: { position: number }) {
  const paths = Array.from({ length: 36 }, (_, i) => ({
    id: i,
    d: `M-${380 - i * 5 * position} -${189 + i * 6}C-${
      380 - i * 5 * position
    } -${189 + i * 6} -${312 - i * 5 * position} ${216 - i * 6} ${
      152 - i * 5 * position
    } ${343 - i * 6}C${616 - i * 5 * position} ${470 - i * 6} ${
      684 - i * 5 * position
    } ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`,
    width: 0.5 + i * 0.03
  }));

  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      <svg
        className="w-full h-full text-white/30"
        viewBox="0 0 696 316"
        fill="none"
      >
        <title>Background Paths</title>
        {paths.map((path) => (
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
              pathOffset: [0, 1, 0]
            }}
            transition={{
              duration: 20 + Math.random() * 10,
              repeat: Number.POSITIVE_INFINITY,
              ease: 'linear'
            }}
          />
        ))}
      </svg>
    </div>
  );
}

const Blob = ({
  className,
  animate = true,
  style
}: {
  className: string;
  animate?: boolean;
  style?: React.CSSProperties;
}) => {
  return (
    <motion.div
      className={`absolute rounded-full ${className}`}
      style={style}
      initial={animate ? { scale: 0.8, opacity: 0.8 } : {}}
      animate={
        animate
          ? {
              scale: [0.8, 1.1, 0.9],
              opacity: [0.7, 0.9, 0.7]
            }
          : {}
      }
      transition={{
        duration: 8,
        repeat: Number.POSITIVE_INFINITY,
        repeatType: 'reverse',
        ease: 'easeInOut'
      }}
    />
  );
};

export default function BackgroundPaths({
  title = 'Welcome to the Polkadot Ledger Migration Assistant',
  subtitle = 'Simplifying your journey to the new Polkadot Universal Ledger App'
}: {
  title?: string;
  subtitle?: string;
}) {
  const words = title.split(' ');

  return (
    <div
      className="relative min-h-screen w-full flex items-center justify-center overflow-hidden"
      style={{
        background:
          'linear-gradient(to bottom right, #6B46C1, #9333EA, #FF2670)'
      }}
    >
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden">
        <Blob
          className="w-[40%] h-[40%] -left-[5%] -top-[5%]"
          style={{ backgroundColor: 'rgba(255, 38, 112, 0.6)' }}
        />
        <Blob
          className="w-[35%] h-[35%] right-[10%] top-[15%]"
          style={{ backgroundColor: 'rgba(255, 38, 112, 0.5)' }}
          animate={false}
        />
        <Blob
          className="w-[25%] h-[25%] right-[5%] bottom-[25%]"
          style={{ backgroundColor: 'rgba(255, 38, 112, 0.4)' }}
        />
        <Blob
          className="w-[30%] h-[30%] left-[20%] bottom-[5%]"
          style={{ backgroundColor: 'rgba(255, 38, 112, 0.6)' }}
          animate={false}
        />
        <Blob
          className="w-[45%] h-[45%] right-[0%] bottom-[0%]"
          style={{ backgroundColor: 'rgba(255, 38, 112, 0.3)' }}
        />
      </div>

      {/* Animated flowing lines */}
      <FloatingPaths position={1} />
      <FloatingPaths position={-1} />

      <div className="relative z-20 container mx-auto px-4 md:px-6 text-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2 }}
          className="max-w-4xl mx-auto"
        >
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold mb-6 tracking-tighter">
            {words.map((word, wordIndex) => (
              <span key={wordIndex} className="inline-block mr-4 last:mr-0">
                {word.split('').map((letter, letterIndex) => (
                  <motion.span
                    key={`${wordIndex}-${letterIndex}`}
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{
                      delay: wordIndex * 0.1 + letterIndex * 0.03,
                      type: 'spring',
                      stiffness: 150,
                      damping: 25
                    }}
                    className="inline-block text-transparent bg-clip-text 
                    bg-gradient-to-r from-white to-white/80"
                  >
                    {letter}
                  </motion.span>
                ))}
              </span>
            ))}
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5, duration: 1 }}
            className="text-xl md:text-2xl text-white/90 mb-10 max-w-3xl mx-auto"
          >
            {subtitle}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2, duration: 1 }}
          >
            <div
              className="inline-block group relative p-px rounded-2xl backdrop-blur-lg 
                        overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300"
              style={{
                background:
                  'linear-gradient(to bottom, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.1))'
              }}
            >
              <Link href="/migrate">
                <Button
                  variant="ghost"
                  className="rounded-[1.15rem] px-8 py-6 text-lg font-semibold backdrop-blur-md 
                            bg-white/95 hover:bg-white/100 
                            border border-white/20 hover:shadow-md
                            group-hover:-translate-y-0.5 transition-all duration-300"
                  style={{ color: '#FF2670' }}
                >
                  <span className="opacity-90 group-hover:opacity-100 transition-opacity">
                    Start Migration
                  </span>
                  <span
                    className="ml-3 opacity-70 group-hover:opacity-100 group-hover:translate-x-1.5 
                              transition-all duration-300"
                  >
                    →
                  </span>
                </Button>
              </Link>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
