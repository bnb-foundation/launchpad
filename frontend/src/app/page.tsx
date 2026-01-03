'use client'

import { useState } from 'react'
import { PresaleCard } from '@/components/PresaleCard'
import { ConnectButton } from '@/components/ConnectButton'
import { useAllPresales } from '@/hooks/useFactory'
import { usePresaleState } from '@/hooks/usePresale'
import { PresaleState } from '@/lib/contracts'
import type { Address } from 'viem'

type FilterType = 'all' | 'upcoming' | 'active' | 'ended'

function PresaleWithFilter({ address, filter }: { address: Address; filter: FilterType }) {
  const { data: state } = usePresaleState(address)

  if (filter === 'all') return <PresaleCard address={address} />

  const now = Math.floor(Date.now() / 1000)

  if (filter === 'active' && state === PresaleState.Active) {
    return <PresaleCard address={address} />
  }

  if (filter === 'upcoming' && state === PresaleState.Pending) {
    return <PresaleCard address={address} />
  }

  if (filter === 'ended' && (state === PresaleState.Finalized || state === PresaleState.Cancelled)) {
    return <PresaleCard address={address} />
  }

  return null
}

export default function HomePage() {
  const [filter, setFilter] = useState<FilterType>('all')
  const { data: presales, isLoading } = useAllPresales()

  return (
    <>
      <ConnectButton />

      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
              Launch Your Token
            </span>
          </h1>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
            The premier decentralized launchpad on BNB Chain. Fair, transparent, and secure token presales.
          </p>
        </div>

        <div className="flex justify-center gap-4 mb-8 flex-wrap">
          <button
            onClick={() => setFilter('all')}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              filter === 'all'
                ? 'bg-gradient-to-r from-orange-500 to-orange-600'
                : 'bg-zinc-800 hover:bg-zinc-700'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              filter === 'active'
                ? 'bg-gradient-to-r from-orange-500 to-orange-600'
                : 'bg-zinc-800 hover:bg-zinc-700'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setFilter('upcoming')}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              filter === 'upcoming'
                ? 'bg-gradient-to-r from-orange-500 to-orange-600'
                : 'bg-zinc-800 hover:bg-zinc-700'
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setFilter('ended')}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              filter === 'ended'
                ? 'bg-gradient-to-r from-orange-500 to-orange-600'
                : 'bg-zinc-800 hover:bg-zinc-700'
            }`}
          >
            Ended
          </button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-6 animate-pulse">
                <div className="h-6 bg-zinc-700 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-zinc-700 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-zinc-700 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : presales && presales.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {presales.map((address) => (
              <PresaleWithFilter key={address} address={address as Address} filter={filter} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-zinc-400 text-lg">No presales found</p>
            <p className="text-zinc-500 mt-2">Be the first to create one!</p>
          </div>
        )}
      </div>
    </>
  )
}
