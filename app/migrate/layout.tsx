import type React from 'react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Migrate - Polkadot Ledger Migration Assistant',
  description: 'Migrate your Polkadot accounts to the Universal Ledger App',
}

export default function MigrateLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return children
}
