'use client'

import { useState } from 'react'
import { ConnectButton } from '@/components/ConnectButton'
import { TxButton } from '@/components/TxButton'
import { useCreatePresale } from '@/hooks/useFactory'
import { useAccount } from 'wagmi'
import { parseEther, type Address } from 'viem'
import { useRouter } from 'next/navigation'

type StepData = {
  tokenAddress: string
  rate: string
  softCap: string
  hardCap: string
  minContribution: string
  maxContribution: string
  startTime: string
  endTime: string
  liquidityBps: string
  lockDuration: string
}

export default function LaunchPage() {
  const router = useRouter()
  const { isConnected } = useAccount()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<StepData>({
    tokenAddress: '',
    rate: '',
    softCap: '',
    hardCap: '',
    minContribution: '',
    maxContribution: '',
    startTime: '',
    endTime: '',
    liquidityBps: '50',
    lockDuration: '90',
  })

  const { createPresale, isPending, isConfirming, isSuccess } = useCreatePresale()

  const updateField = (field: keyof StepData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = () => {
    try {
      createPresale({
        token: formData.tokenAddress as Address,
        rate: parseEther(formData.rate),
        softCap: parseEther(formData.softCap),
        hardCap: parseEther(formData.hardCap),
        minContribution: parseEther(formData.minContribution),
        maxContribution: parseEther(formData.maxContribution),
        startTime: BigInt(new Date(formData.startTime).getTime() / 1000),
        endTime: BigInt(new Date(formData.endTime).getTime() / 1000),
        liquidityBps: BigInt(formData.liquidityBps) * BigInt(100),
        lockDuration: BigInt(formData.lockDuration) * BigInt(86400),
      })
    } catch (error) {
      console.error('Error creating presale:', error)
    }
  }

  if (isSuccess) {
    setTimeout(() => router.push('/'), 2000)
  }

  if (!isConnected) {
    return (
      <>
        <ConnectButton />
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-4xl font-bold mb-4">Launch Your Presale</h1>
            <p className="text-zinc-400 mb-8">Connect your wallet to get started</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <ConnectButton />
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">
              <span className="bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
                Launch Your Presale
              </span>
            </h1>
            <p className="text-zinc-400">Step {step} of 5</p>
          </div>

          <div className="flex gap-2 mb-8">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className={`flex-1 h-2 rounded-full ${
                  i <= step ? 'bg-gradient-to-r from-orange-500 to-orange-600' : 'bg-zinc-800'
                }`}
              />
            ))}
          </div>

          <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-8">
            {step === 1 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold mb-6">Token Information</h2>
                <div>
                  <label className="block text-sm font-medium mb-2">Token Address</label>
                  <input
                    type="text"
                    value={formData.tokenAddress}
                    onChange={(e) => updateField('tokenAddress', e.target.value)}
                    placeholder="0x..."
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Rate (Tokens per BNB)</label>
                  <input
                    type="number"
                    value={formData.rate}
                    onChange={(e) => updateField('rate', e.target.value)}
                    placeholder="1000"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 transition-colors"
                  />
                  <p className="text-sm text-zinc-500 mt-1">How many tokens per 1 BNB</p>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold mb-6">Caps & Contributions</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Soft Cap (BNB)</label>
                    <input
                      type="number"
                      value={formData.softCap}
                      onChange={(e) => updateField('softCap', e.target.value)}
                      placeholder="10"
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Hard Cap (BNB)</label>
                    <input
                      type="number"
                      value={formData.hardCap}
                      onChange={(e) => updateField('hardCap', e.target.value)}
                      placeholder="100"
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 transition-colors"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Min Contribution (BNB)</label>
                    <input
                      type="number"
                      value={formData.minContribution}
                      onChange={(e) => updateField('minContribution', e.target.value)}
                      placeholder="0.1"
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Max Contribution (BNB)</label>
                    <input
                      type="number"
                      value={formData.maxContribution}
                      onChange={(e) => updateField('maxContribution', e.target.value)}
                      placeholder="10"
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 transition-colors"
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold mb-6">Timeline</h2>
                <div>
                  <label className="block text-sm font-medium mb-2">Start Time</label>
                  <input
                    type="datetime-local"
                    value={formData.startTime}
                    onChange={(e) => updateField('startTime', e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">End Time</label>
                  <input
                    type="datetime-local"
                    value={formData.endTime}
                    onChange={(e) => updateField('endTime', e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 transition-colors"
                  />
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold mb-6">Liquidity Settings</h2>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Liquidity Percentage ({formData.liquidityBps}%)
                  </label>
                  <input
                    type="range"
                    min="30"
                    max="100"
                    value={formData.liquidityBps}
                    onChange={(e) => updateField('liquidityBps', e.target.value)}
                    className="w-full"
                  />
                  <p className="text-sm text-zinc-500 mt-1">
                    Percentage of raised funds to add as liquidity
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Lock Duration (Days)
                  </label>
                  <select
                    value={formData.lockDuration}
                    onChange={(e) => updateField('lockDuration', e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 transition-colors"
                  >
                    <option value="30">30 Days</option>
                    <option value="90">90 Days</option>
                    <option value="180">180 Days</option>
                    <option value="365">1 Year</option>
                  </select>
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold mb-6">Review & Deploy</h2>
                <div className="space-y-3 bg-zinc-900 rounded-lg p-4">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Token</span>
                    <span className="font-mono text-sm">{formData.tokenAddress.slice(0, 10)}...</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Rate</span>
                    <span>{formData.rate} tokens/BNB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Soft Cap</span>
                    <span>{formData.softCap} BNB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Hard Cap</span>
                    <span>{formData.hardCap} BNB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Min/Max Contribution</span>
                    <span>{formData.minContribution} - {formData.maxContribution} BNB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Liquidity</span>
                    <span>{formData.liquidityBps}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Lock Duration</span>
                    <span>{formData.lockDuration} days</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-4 mt-8">
              {step > 1 && (
                <button
                  onClick={() => setStep(step - 1)}
                  className="flex-1 px-6 py-3 bg-zinc-700 hover:bg-zinc-600 rounded-lg font-medium transition-all"
                >
                  Back
                </button>
              )}
              {step < 5 ? (
                <button
                  onClick={() => setStep(step + 1)}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-lg font-medium transition-all"
                >
                  Next
                </button>
              ) : (
                <TxButton
                  onClick={handleSubmit}
                  loading={isPending || isConfirming}
                  success={isSuccess}
                  className="flex-1"
                >
                  Deploy Presale
                </TxButton>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
