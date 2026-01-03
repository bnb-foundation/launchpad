'use client'

import { useParams } from 'next/navigation'
import { ConnectButton } from '@/components/ConnectButton'
import { ProgressBar } from '@/components/ProgressBar'
import { ContributionForm } from '@/components/ContributionForm'
import { ClaimButton } from '@/components/ClaimButton'
import { usePresaleParams, usePresaleState, useTotalRaised, useTokenInfo, usePresaleCreator } from '@/hooks/usePresale'
import { useContribution } from '@/hooks/useContribution'
import { PresaleState } from '@/lib/contracts'
import { formatEther } from 'viem'
import type { Address } from 'viem'
import { useState, useEffect } from 'react'

function CountdownTimer({ endTime }: { endTime: bigint }) {
  const [timeLeft, setTimeLeft] = useState('')

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = Math.floor(Date.now() / 1000)
      const end = Number(endTime)
      const diff = end - now

      if (diff <= 0) {
        setTimeLeft('Ended')
        return
      }

      const days = Math.floor(diff / 86400)
      const hours = Math.floor((diff % 86400) / 3600)
      const minutes = Math.floor((diff % 3600) / 60)
      const seconds = diff % 60

      setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`)
    }

    calculateTimeLeft()
    const interval = setInterval(calculateTimeLeft, 1000)
    return () => clearInterval(interval)
  }, [endTime])

  return <span className="font-mono">{timeLeft}</span>
}

export default function PresaleDetailPage() {
  const params = useParams()
  const address = params?.address as Address

  const { data: presaleParams } = usePresaleParams(address)
  const { data: state } = usePresaleState(address)
  const { data: totalRaised } = useTotalRaised(address)
  const { data: creator } = usePresaleCreator(address)
  const { contribution, hasClaimed } = useContribution(address)

  const tokenAddress = presaleParams?.[0] as Address | undefined
  const { name, symbol } = useTokenInfo(tokenAddress)

  if (!presaleParams || state === undefined) {
    return (
      <>
        <ConnectButton />
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-8 animate-pulse">
              <div className="h-8 bg-zinc-700 rounded w-1/2 mb-6"></div>
              <div className="h-4 bg-zinc-700 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-zinc-700 rounded w-2/3"></div>
            </div>
          </div>
        </div>
      </>
    )
  }

  const [token, rate, softCap, hardCap, minContribution, maxContribution, startTime, endTime, liquidityBps, lockDuration] = presaleParams
  const raised = totalRaised ?? BigInt(0)

  const getStatusBadge = () => {
    if (state === PresaleState.Cancelled) {
      return <span className="px-4 py-2 bg-red-500/20 text-red-400 rounded-full">Cancelled</span>
    }
    if (state === PresaleState.Finalized) {
      return <span className="px-4 py-2 bg-green-500/20 text-green-400 rounded-full">Finalized</span>
    }
    if (state === PresaleState.Active) {
      return <span className="px-4 py-2 bg-orange-500/20 text-orange-400 rounded-full">Active</span>
    }
    return <span className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-full">Pending</span>
  }

  const isActive = state === PresaleState.Active

  return (
    <>
      <ConnectButton />
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-4xl font-bold mb-2">
                  <span className="bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
                    {name || symbol || 'Token'} Presale
                  </span>
                </h1>
                <p className="text-zinc-400">Token: {symbol || 'N/A'}</p>
              </div>
              {getStatusBadge()}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-6">
                <h2 className="text-xl font-bold mb-6">Presale Progress</h2>
                <ProgressBar current={raised} target={hardCap} className="mb-6" />
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-zinc-900 rounded-lg p-4">
                    <p className="text-sm text-zinc-400 mb-1">Raised</p>
                    <p className="text-2xl font-bold text-orange-500">
                      {formatEther(raised).slice(0, 8)} BNB
                    </p>
                  </div>
                  <div className="bg-zinc-900 rounded-lg p-4">
                    <p className="text-sm text-zinc-400 mb-1">Target</p>
                    <p className="text-2xl font-bold">
                      {formatEther(hardCap).slice(0, 8)} BNB
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-6">
                <h2 className="text-xl font-bold mb-6">Presale Details</h2>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-zinc-700">
                    <span className="text-zinc-400">Token Address</span>
                    <span className="font-mono text-sm">{token.slice(0, 10)}...{token.slice(-8)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-zinc-700">
                    <span className="text-zinc-400">Rate</span>
                    <span>{formatEther(rate)} {symbol}/BNB</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-zinc-700">
                    <span className="text-zinc-400">Soft Cap</span>
                    <span>{formatEther(softCap)} BNB</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-zinc-700">
                    <span className="text-zinc-400">Hard Cap</span>
                    <span>{formatEther(hardCap)} BNB</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-zinc-700">
                    <span className="text-zinc-400">Min Contribution</span>
                    <span>{formatEther(minContribution)} BNB</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-zinc-700">
                    <span className="text-zinc-400">Max Contribution</span>
                    <span>{formatEther(maxContribution)} BNB</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-zinc-700">
                    <span className="text-zinc-400">Liquidity</span>
                    <span>{Number(liquidityBps) / 100}%</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-zinc-700">
                    <span className="text-zinc-400">Lock Duration</span>
                    <span>{Number(lockDuration) / 86400} days</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-zinc-700">
                    <span className="text-zinc-400">Start Time</span>
                    <span>{new Date(Number(startTime) * 1000).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-zinc-700">
                    <span className="text-zinc-400">End Time</span>
                    <span>{new Date(Number(endTime) * 1000).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-zinc-400">Creator</span>
                    <span className="font-mono text-sm">{creator?.slice(0, 10)}...{creator?.slice(-8)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {isActive && (
                <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-6">
                  <h3 className="text-lg font-bold mb-2">Time Remaining</h3>
                  <div className="text-2xl font-bold text-orange-500">
                    <CountdownTimer endTime={endTime} />
                  </div>
                </div>
              )}

              {isActive && (
                <ContributionForm
                  presaleAddress={address}
                  minContribution={minContribution}
                  maxContribution={maxContribution}
                  userContribution={contribution}
                />
              )}

              <ClaimButton
                presaleAddress={address}
                userContribution={contribution}
                hasClaimed={hasClaimed}
                presaleState={state}
                rate={rate}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
