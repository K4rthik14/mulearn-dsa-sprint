'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function enrollInSprint(sprintId: string) {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Unauthorized' }
  }

  if (!sprintId) {
    return { error: 'Sprint ID is required' }
  }

  const { error } = await supabase
    .from('user_sprints')
    .insert({
      userId: user.id,
      sprintId: sprintId
    })

  if (error) {
    // Check if they are already enrolled
    if (error.code === '23505') {
      return { error: 'You are already enrolled in this sprint!' }
    }
    return { error: `Enrollment failed: ${error.message}` }
  }

  revalidatePath('/dashboard')
  revalidatePath('/profile')

  return { success: true }
}

export async function leaveSprint(sprintId: string) {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Unauthorized' }
  }

  if (!sprintId) {
    return { error: 'Sprint ID is required' }
  }

  const { error } = await supabase
    .from('user_sprints')
    .delete()
    .eq('userId', user.id)
    .eq('sprintId', sprintId)

  if (error) {
    return { error: `Failed to leave sprint: ${error.message}` }
  }

  revalidatePath('/dashboard')
  revalidatePath('/profile')

  return { success: true }
}
