import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import { BATTLE_MONADS_ABI, BATTLE_MONADS_ADDRESS, MonsterType } from '../lib/contracts/BattleMonads'

export function useBattleMonads() {
  const { writeContract, data: hash, isPending } = useWriteContract()

  // Read functions
  const useBattle = (battleId: number) => {
    return useReadContract({
      address: BATTLE_MONADS_ADDRESS,
      abi: BATTLE_MONADS_ABI,
      functionName: 'getBattle',
      args: [BigInt(battleId)],
      query: {
        enabled: battleId > 0,
        refetchInterval: 5000 // 5초마다 업데이트
      }
    })
  }

  const useMonster = (monsterId: number) => {
    return useReadContract({
      address: BATTLE_MONADS_ADDRESS,
      abi: BATTLE_MONADS_ABI,
      functionName: 'monsters',
      args: [BigInt(monsterId)],
      query: {
        enabled: monsterId > 0,
        refetchInterval: 3000 // 3초마다 업데이트
      }
    })
  }

  const useBattleComments = (battleId: number) => {
    return useReadContract({
      address: BATTLE_MONADS_ADDRESS,
      abi: BATTLE_MONADS_ABI,
      functionName: 'getBattleComments',
      args: [BigInt(battleId)],
      query: {
        enabled: battleId > 0,
        refetchInterval: 3000 // 3초마다 업데이트
      }
    })
  }

  const useUserBets = (battleId: number, userAddress: string) => {
    return useReadContract({
      address: BATTLE_MONADS_ADDRESS,
      abi: BATTLE_MONADS_ABI,
      functionName: 'getUserBets',
      args: [BigInt(battleId), userAddress as `0x${string}`],
      query: {
        enabled: battleId > 0 && !!userAddress,
        refetchInterval: 5000
      }
    })
  }

  const useCanUserComment = (battleId: number, userAddress: string) => {
    return useReadContract({
      address: BATTLE_MONADS_ADDRESS,
      abi: BATTLE_MONADS_ABI,
      functionName: 'canUserComment',
      args: [BigInt(battleId), userAddress as `0x${string}`],
      query: {
        enabled: battleId > 0 && !!userAddress,
        refetchInterval: 5000
      }
    })
  }

  // Write functions
  const bet = async (battleId: number, side: MonsterType, amount: string) => {
    try {
      const value = parseEther(amount)
      
      return writeContract({
        address: BATTLE_MONADS_ADDRESS,
        abi: BATTLE_MONADS_ABI,
        functionName: 'bet',
        args: [BigInt(battleId), side],
        value
      })
    } catch (error) {
      console.error('Betting error:', error)
      throw error
    }
  }

  const addComment = async (battleId: number, content: string) => {
    try {
      return writeContract({
        address: BATTLE_MONADS_ADDRESS,
        abi: BATTLE_MONADS_ABI,
        functionName: 'addComment',
        args: [BigInt(battleId), content]
      })
    } catch (error) {
      console.error('Comment error:', error)
      throw error
    }
  }

  const claimReward = async (battleId: number) => {
    try {
      return writeContract({
        address: BATTLE_MONADS_ADDRESS,
        abi: BATTLE_MONADS_ABI,
        functionName: 'claimReward',
        args: [BigInt(battleId)]
      })
    } catch (error) {
      console.error('Claim reward error:', error)
      throw error
    }
  }

  const endBattle = async (battleId: number) => {
    try {
      return writeContract({
        address: BATTLE_MONADS_ADDRESS,
        abi: BATTLE_MONADS_ABI,
        functionName: 'endBattle',
        args: [BigInt(battleId)]
      })
    } catch (error) {
      console.error('End battle error:', error)
      throw error
    }
  }

  // Transaction status hook
  const useTransactionStatus = () => {
    return useWaitForTransactionReceipt({
      hash: hash,
    })
  }

  // Helper functions
  const formatMonAmount = (wei: bigint) => {
    return formatEther(wei)
  }

  const parseMonAmount = (amount: string) => {
    return parseEther(amount)
  }

  return {
    // Read hooks
    useBattle,
    useMonster,
    useBattleComments,
    useUserBets,
    useCanUserComment,
    
    // Write functions
    bet,
    addComment,
    claimReward,
    endBattle,
    
    // Transaction status
    useTransactionStatus,
    isPending,
    
    // Helpers
    formatMonAmount,
    parseMonAmount,
    MonsterType
  }
}