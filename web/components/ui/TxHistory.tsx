'use client'

import { useState, useEffect } from 'react'
import { useWatchContractEvent } from 'wagmi'
import { ExternalLink, Clock } from 'lucide-react'
import { CANVAS_CONTRACT, colorIntToHex } from '@/lib/contract'

interface Transaction {
  id: string
  hash: string
  user: string
  x: number
  y: number
  color: string
  timestamp: number
}

export function TxHistory() {
  const [transactions, setTransactions] = useState<Transaction[]>([])

  // Watch for new PixelDrawn events and add them to history
  useWatchContractEvent({
    ...CANVAS_CONTRACT,
    eventName: 'PixelDrawn',
    onLogs(logs) {
      logs.forEach((log) => {
        const { user, x, y, color } = log.args
        if (user && x !== undefined && y !== undefined && color !== undefined) {
          const newTx: Transaction = {
            id: log.transactionHash || `${Date.now()}-${Math.random()}`,
            hash: log.transactionHash || '',
            user: user,
            x: Number(x),
            y: Number(y),
            color: colorIntToHex(Number(color)),
            timestamp: Date.now()
          }
          
          setTransactions(prev => [newTx, ...prev.slice(0, 19)]) // Keep last 20 transactions
        }
      })
    },
  })

  useEffect(() => {
    // Add a placeholder transaction to show the component works
    const placeholderTx: Transaction = {
      id: 'placeholder',
      hash: '0x0000000000000000000000000000000000000000000000000000000000000000',
      user: '0x0000000000000000000000000000000000000000',
      x: 0,
      y: 0,
      color: '#6c54f8',
      timestamp: Date.now() - 1000 * 60 * 2
    }
    setTransactions([placeholderTx])
  }, [])

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp
    const minutes = Math.floor(diff / (1000 * 60))
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  return (
    <div className="monad-glass rounded-xl border border-white/10">
      <div className="px-6 py-4 border-b border-white/10">
        <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
          <Clock size={16} />
          <span>Recent Transactions</span>
        </h3>
      </div>
      
      <div className="max-h-96 overflow-y-auto">
        {transactions.length === 0 ? (
          <div className="p-6 text-center text-gray-400 text-sm">
            No transactions yet
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {transactions.map((tx) => (
              <div key={tx.id} className="p-4 hover:bg-white/5 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs text-gray-400 font-mono">
                    {formatAddress(tx.user)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatTime(tx.timestamp)}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 mb-2">
                  <div
                    className="w-4 h-4 rounded border border-white/20"
                    style={{ backgroundColor: tx.color }}
                  />
                  <span className="text-sm text-gray-200">
                    Pixel ({tx.x}, {tx.y})
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500 font-mono">
                    {formatAddress(tx.hash)}
                  </div>
                  <a
                    href={`https://testnet.monadexplorer.com/tx/${tx.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-monad-primary hover:text-monad-light transition-colors"
                  >
                    <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}