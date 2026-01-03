'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { formatEther } from 'viem'
import type { Address } from 'viem'
import { BuyTokenForm } from '@/components/BuyTokenForm'
import { SellTokenForm } from '@/components/SellTokenForm'
import { GraduationProgress } from '@/components/GraduationProgress'
import { BondingCurveChart } from '@/components/BondingCurveChart'
import { DemoBanner } from '@/components/DemoBanner'
import {
  useLaunchConfig,
  useBondingCurvePrice,
  useMarketCap,
  useTokensSold,
  useTotalBnbRaised,
} from '@/hooks/useBondingCurve'

export default function TokenPage() {
  const params = useParams()
  const launchAddress = params.address as Address

  const { data: config } = useLaunchConfig(launchAddress)
  const { data: currentPrice } = useBondingCurvePrice(launchAddress)
  const { data: marketCap } = useMarketCap(launchAddress)
  const { data: tokensSold } = useTokensSold(launchAddress)
  const { data: totalBnbRaised } = useTotalBnbRaised(launchAddress)

  if (!config) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-white">
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-zinc-800 rounded w-1/4"></div>
              <div className="h-12 bg-zinc-800 rounded w-1/2"></div>
              <div className="h-64 bg-zinc-800 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const [
    creator,
    token,
    name,
    symbol,
    totalSupply,
    initialPrice,
    priceIncrement,
    graduationThreshold,
    creatorFeeBps,
    platformFeeBps,
    enableSell,
  ] = config

  const sold = tokensSold ?? 0n
  const cap = marketCap ?? 0n
  const price = currentPrice ?? initialPrice
  const raised = totalBnbRaised ?? 0n

  const progressPercentage =
    totalSupply > 0n ? Number((sold * 10000n) / totalSupply) / 100 : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-white">
      <DemoBanner />

      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-6"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to all launches
        </Link>

        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-8 mb-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-4xl font-bold mb-2">{symbol}</h1>
                <p className="text-xl text-zinc-400">{name}</p>
              </div>
              <div className="text-right">
                <div className="text-sm text-zinc-400 mb-1">Current Price</div>
                <div className="text-3xl font-bold text-orange-500">
                  {formatEther(price).slice(0, 12)} BNB
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-zinc-900/50 rounded-lg p-4">
                <div className="text-sm text-zinc-400 mb-1">Market Cap</div>
                <div className="text-lg font-bold">{formatEther(cap).slice(0, 10)} BNB</div>
              </div>
              <div className="bg-zinc-900/50 rounded-lg p-4">
                <div className="text-sm text-zinc-400 mb-1">Total Raised</div>
                <div className="text-lg font-bold">{formatEther(raised).slice(0, 10)} BNB</div>
              </div>
              <div className="bg-zinc-900/50 rounded-lg p-4">
                <div className="text-sm text-zinc-400 mb-1">Tokens Sold</div>
                <div className="text-lg font-bold">{progressPercentage.toFixed(1)}%</div>
              </div>
              <div className="bg-zinc-900/50 rounded-lg p-4">
                <div className="text-sm text-zinc-400 mb-1">Initial Price</div>
                <div className="text-lg font-bold">
                  {formatEther(initialPrice).slice(0, 10)} BNB
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Column - Trading */}
            <div className="lg:col-span-2 space-y-6">
              {/* Graduation Progress */}
              <GraduationProgress
                launchAddress={launchAddress}
                graduationThreshold={graduationThreshold}
              />

              {/* Bonding Curve Chart */}
              <BondingCurveChart
                launchAddress={launchAddress}
                initialPrice={initialPrice}
                priceIncrement={priceIncrement}
                totalSupply={totalSupply}
              />

              {/* Token Info */}
              <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-6">
                <h2 className="text-xl font-bold mb-4">Token Information</h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Contract Address</span>
                    <a
                      href={`https://bscscan.com/address/${token}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-orange-500 hover:text-orange-400 transition-colors font-mono text-sm"
                    >
                      {token.slice(0, 6)}...{token.slice(-4)}
                    </a>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Launch Contract</span>
                    <a
                      href={`https://bscscan.com/address/${launchAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-orange-500 hover:text-orange-400 transition-colors font-mono text-sm"
                    >
                      {launchAddress.slice(0, 6)}...{launchAddress.slice(-4)}
                    </a>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Creator</span>
                    <span className="font-mono text-sm">
                      {creator.slice(0, 6)}...{creator.slice(-4)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Total Supply</span>
                    <span className="font-medium">{formatEther(totalSupply)} {symbol}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Price Increment</span>
                    <span className="font-medium">
                      {formatEther(priceIncrement)} BNB per token
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Creator Fee</span>
                    <span className="font-medium">{Number(creatorFeeBps) / 100}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Platform Fee</span>
                    <span className="font-medium">{Number(platformFeeBps) / 100}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Selling</span>
                    <span
                      className={`font-medium ${enableSell ? 'text-green-400' : 'text-red-400'}`}
                    >
                      {enableSell ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Buy/Sell Forms */}
            <div className="space-y-6">
              <BuyTokenForm launchAddress={launchAddress} tokenSymbol={symbol} />

              {enableSell && (
                <SellTokenForm
                  launchAddress={launchAddress}
                  tokenAddress={token}
                  tokenSymbol={symbol}
                  enableSell={enableSell}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
