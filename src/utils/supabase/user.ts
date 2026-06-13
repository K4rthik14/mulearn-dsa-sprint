import { createClient } from '@/utils/supabase/server'

export interface SessionUser {
  id: string
  email: string | null
  name: string
  isAdmin: boolean
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder') || supabaseKey.includes('placeholder')) {
    return null
  }

  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return null
    }

    const { data: dbUser, error: dbError } = await supabase
      .from('users')
      .select('name, email, isAdmin')
      .eq('id', user.id)
      .single()

    return {
      id: user.id,
      email: user.email || null,
      name: dbUser?.name || user.user_metadata?.name || user.user_metadata?.full_name || 'User',
      isAdmin: dbUser?.isAdmin || false
    }
  } catch (error) {
    console.error('Error fetching session user:', error)
    return null
  }
}
