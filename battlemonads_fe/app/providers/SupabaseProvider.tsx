'use client'

import { createClient } from '@supabase/supabase-js'
import { createContext, useContext, useEffect, useState } from 'react'
import type { User, Session } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

interface SupabaseContextType {
  supabase: typeof supabase
  session: Session | null
  user: User | null
  loading: boolean
  linkWalletAddress: (walletAddress: string) => Promise<void>
  getUserProfile: (walletAddress: string) => Promise<{ avatar_url?: string; username?: string } | null>
}

const SupabaseContext = createContext<SupabaseContextType>({
  supabase,
  session: null,
  user: null,
  loading: true,
  linkWalletAddress: async () => {},
  getUserProfile: async () => null,
})

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // 지갑 주소를 현재 유저와 연결
  const linkWalletAddress = async (walletAddress: string) => {
    if (!user) return

    try {
      const profileData = {
        wallet_address: walletAddress.toLowerCase(),
        discord_id: user.id,
        username: user.user_metadata?.custom_claims?.global_name || user.user_metadata?.name || user.email,
        avatar_url: user.user_metadata?.avatar_url,
        updated_at: new Date().toISOString()
      }

      // Supabase에 저장
      const { error } = await supabase
        .from('user_profiles')
        .upsert(profileData, {
          onConflict: 'wallet_address'
        })

      if (error) {
        console.error('Error linking wallet address:', error)
        console.error('Error details:', JSON.stringify(error, null, 2))
      } else {
        console.log('Wallet address linked successfully:', walletAddress)
      }
    } catch (error) {
      console.error('Error linking wallet address:', error)
    }
  }

  // 지갑 주소로 유저 프로필 조회
  const getUserProfile = async (walletAddress: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('username, avatar_url')
        .eq('wallet_address', walletAddress.toLowerCase())
        .single()

      if (error || !data) {
        return null
      }

      return {
        username: data.username,
        avatar_url: data.avatar_url
      }
    } catch (error) {
      console.error('Error getting user profile:', error)
      return null
    }
  }

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      setUser(session?.user || null)
      setLoading(false)
    }

    getSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        setUser(session?.user || null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return (
    <SupabaseContext.Provider value={{ 
      supabase, 
      session, 
      user, 
      loading, 
      linkWalletAddress, 
      getUserProfile 
    }}>
      {children}
    </SupabaseContext.Provider>
  )
}

export const useSupabase = () => {
  const context = useContext(SupabaseContext)
  if (!context) {
    throw new Error('useSupabase must be used within a SupabaseProvider')
  }
  return context
}