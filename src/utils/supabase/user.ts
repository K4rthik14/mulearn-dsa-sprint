import { createClient } from '@/utils/supabase/server'

export interface SessionUser {
  id: string
  email: string | null
  name: string
  isAdmin: boolean
}

export function isUserAdmin(user: any): boolean {
  if (!user) return false
  const val = !!(
    user.isAdmin || 
    user.isadmin || 
    user.is_admin || 
    user.app_metadata?.is_admin || 
    user.user_metadata?.is_admin || 
    user.app_metadata?.isAdmin || 
    user.user_metadata?.isAdmin
  )
  return val
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

    console.log("SESSION USER:", JSON.stringify(user, null, 2))
    console.log("DB USER:", JSON.stringify(dbUser, null, 2))

    const mergedUser = {
      ...user,
      ...(dbUser || {})
    }
    const adminNormalized = isUserAdmin(mergedUser)

    console.log('[getSessionUser Auth Flow Log]:', {
      userId: user.id,
      email: user.email,
      rawDbUser: dbUser,
      rawAuthUserAppMetadata: user.app_metadata,
      rawAuthUserUserMetadata: user.user_metadata,
      adminNormalized,
      reason: adminNormalized ? 'Authorized as admin' : 'Not marked as admin in db or metadata'
    })

    return {
      id: user.id,
      email: user.email || null,
      name: dbUser?.name || user.user_metadata?.name || user.user_metadata?.full_name || 'User',
      isAdmin: adminNormalized
    }
  } catch (error) {
    console.error('Error fetching session user:', error)
    return null
  }
}
