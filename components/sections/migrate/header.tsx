'use client'

import { motion } from 'framer-motion'

export function Header() {
  return (
    <header className="flex justify-between items-center mb-8">
      <motion.div
        className="flex items-center space-x-2"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#FF2670] to-[#7916F3] flex items-center justify-center shadow-lg">
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
            <div className="w-6 h-6 rounded-full bg-gradient-to-r from-[#FF2670] to-[#7916F3]"></div>
          </div>
        </div>
        <span className="font-bold text-lg text-white">Polkadot Ledger Migration Assistant</span>
      </motion.div>
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
        {/* <User /> */}
      </motion.div>
    </header>
  )
}
