'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

// Helper to check if caller is admin
async function checkAdmin(supabase: any) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { data: dbUser } = await supabase
    .from('users')
    .select('isAdmin')
    .eq('id', user.id)
    .single()

  return !!(dbUser?.isAdmin || user?.app_metadata?.is_admin || user?.user_metadata?.is_admin || user?.app_metadata?.isAdmin || user?.user_metadata?.isAdmin)
}

export async function createChallengeDay(formData: FormData) {
  const supabase = await createClient()
  if (!(await checkAdmin(supabase))) {
    return { error: 'Unauthorized. Admin role required.' }
  }

  const dayNumber = parseInt(formData.get('dayNumber') as string)
  const topic = formData.get('topic') as string
  const description = formData.get('description') as string

  if (isNaN(dayNumber) || !topic || !description) {
    return { error: 'All fields are required and Day Number must be a number' }
  }

  const { error } = await supabase
    .from('challengedays')
    .insert({ dayNumber, topic, description })

  if (error) {
    if (error.code === '23505') {
      return { error: `Day ${dayNumber} already exists!` }
    }
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  revalidatePath('/admin')

  return { success: true }
}

export async function addResource(formData: FormData) {
  const supabase = await createClient()
  if (!(await checkAdmin(supabase))) {
    return { error: 'Unauthorized. Admin role required.' }
  }

  const challengeDayId = formData.get('challengeDayId') as string
  const title = formData.get('title') as string
  const url = formData.get('url') as string

  if (!challengeDayId || !title || !url) {
    return { error: 'All fields are required' }
  }

  const { error } = await supabase
    .from('resources')
    .insert({ challengeDayId, title, url })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  revalidatePath('/admin')

  return { success: true }
}

export async function addProblem(formData: FormData) {
  const supabase = await createClient()
  if (!(await checkAdmin(supabase))) {
    return { error: 'Unauthorized. Admin role required.' }
  }

  const challengeDayId = formData.get('challengeDayId') as string
  const title = formData.get('title') as string
  const difficulty = formData.get('difficulty') as 'Easy' | 'Medium' | 'Hard'
  const url = formData.get('url') as string

  if (!challengeDayId || !title || !difficulty || !url) {
    return { error: 'All fields are required' }
  }

  const { error } = await supabase
    .from('problems')
    .insert({ challengeDayId, title, difficulty, url })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  revalidatePath('/admin')

  return { success: true }
}

export async function updateSubmissionStatus(submissionId: string, status: 'approved' | 'rejected') {
  const supabase = await createClient()
  if (!(await checkAdmin(supabase))) {
    return { error: 'Unauthorized. Admin role required.' }
  }

  const { error } = await supabase
    .from('submissions')
    .update({ status })
    .eq('id', submissionId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin')
  revalidatePath('/leaderboard')
  revalidatePath('/profile')

  return { success: true }
}
