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
  const difficulty = formData.get('difficulty') as string || 'Easy'
  const unlockDayVal = formData.get('unlockDay') as string
  const unlockDay = unlockDayVal ? parseInt(unlockDayVal) : null

  if (isNaN(dayNumber) || !topic || !description) {
    return { error: 'All fields are required and Day Number must be a number' }
  }

  const { error } = await supabase
    .from('challengedays')
    .insert({ 
      dayNumber, 
      topic, 
      description,
      difficulty,
      unlockDay
    })

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

export async function updateChallengeDay(formData: FormData) {
  const supabase = await createClient()
  if (!(await checkAdmin(supabase))) {
    return { error: 'Unauthorized. Admin role required.' }
  }

  const id = formData.get('id') as string
  const dayNumber = parseInt(formData.get('dayNumber') as string)
  const topic = formData.get('topic') as string
  const description = formData.get('description') as string
  const difficulty = formData.get('difficulty') as string || 'Easy'
  const unlockDayVal = formData.get('unlockDay') as string
  const unlockDay = unlockDayVal ? parseInt(unlockDayVal) : null

  if (!id || isNaN(dayNumber) || !topic || !description) {
    return { error: 'All fields are required and Day Number must be a number' }
  }

  const { error } = await supabase
    .from('challengedays')
    .update({ 
      dayNumber, 
      topic, 
      description,
      difficulty,
      unlockDay
    })
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  revalidatePath('/admin')

  return { success: true }
}

export async function deleteChallengeDay(id: string) {
  const supabase = await createClient()
  if (!(await checkAdmin(supabase))) {
    return { error: 'Unauthorized. Admin role required.' }
  }

  if (!id) {
    return { error: 'ID is required' }
  }

  const { error } = await supabase
    .from('challengedays')
    .delete()
    .eq('id', id)

  if (error) {
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
  const type = formData.get('type') as string || 'Article'

  if (!challengeDayId || !title || !url) {
    return { error: 'All fields are required' }
  }

  const { error } = await supabase
    .from('resources')
    .insert({ challengeDayId, title, url, type })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  revalidatePath('/admin')

  return { success: true }
}

export async function updateResource(formData: FormData) {
  const supabase = await createClient()
  if (!(await checkAdmin(supabase))) {
    return { error: 'Unauthorized. Admin role required.' }
  }

  const id = formData.get('id') as string
  const challengeDayId = formData.get('challengeDayId') as string
  const title = formData.get('title') as string
  const url = formData.get('url') as string
  const type = formData.get('type') as string || 'Article'

  if (!id || !challengeDayId || !title || !url) {
    return { error: 'All fields are required' }
  }

  const { error } = await supabase
    .from('resources')
    .update({ challengeDayId, title, url, type })
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  revalidatePath('/admin')

  return { success: true }
}

export async function deleteResource(id: string) {
  const supabase = await createClient()
  if (!(await checkAdmin(supabase))) {
    return { error: 'Unauthorized. Admin role required.' }
  }

  if (!id) {
    return { error: 'ID is required' }
  }

  const { error } = await supabase
    .from('resources')
    .delete()
    .eq('id', id)

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
  const platform = (formData.get('platform') as string) || 'LeetCode'
  const difficulty = formData.get('difficulty') as 'Easy' | 'Medium' | 'Hard'
  const points = parseInt(formData.get('points') as string || '10', 10)
  const url = formData.get('url') as string

  if (!challengeDayId || !title || !difficulty || !url) {
    return { error: 'All fields are required' }
  }

  // Get max order index for this day
  const { data: existing } = await supabase
    .from('problems')
    .select('orderIndex')
    .eq('challengeDayId', challengeDayId)
    .order('orderIndex', { ascending: false })
    .limit(1)

  const nextIndex = existing && existing.length > 0 ? (existing[0].orderIndex + 1) : 0

  const { error } = await supabase
    .from('problems')
    .insert({ challengeDayId, title, platform, difficulty, points, orderIndex: nextIndex, url })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  revalidatePath('/admin')

  return { success: true }
}

export async function updateProblem(formData: FormData) {
  const supabase = await createClient()
  if (!(await checkAdmin(supabase))) {
    return { error: 'Unauthorized. Admin role required.' }
  }

  const id = formData.get('id') as string
  const challengeDayId = formData.get('challengeDayId') as string
  const title = formData.get('title') as string
  const platform = (formData.get('platform') as string) || 'LeetCode'
  const difficulty = formData.get('difficulty') as 'Easy' | 'Medium' | 'Hard'
  const points = parseInt(formData.get('points') as string || '10', 10)
  const url = formData.get('url') as string
  const orderIndexVal = formData.get('orderIndex')

  if (!id || !challengeDayId || !title || !difficulty || !url) {
    return { error: 'All fields are required' }
  }

  const updatePayload: any = { challengeDayId, title, platform, difficulty, points, url }
  if (orderIndexVal !== null) {
    updatePayload.orderIndex = parseInt(orderIndexVal as string, 10)
  }

  const { error } = await supabase
    .from('problems')
    .update(updatePayload)
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  revalidatePath('/admin')

  return { success: true }
}

export async function deleteProblem(id: string) {
  const supabase = await createClient()
  if (!(await checkAdmin(supabase))) {
    return { error: 'Unauthorized. Admin role required.' }
  }

  if (!id) {
    return { error: 'ID is required' }
  }

  const { error } = await supabase
    .from('problems')
    .delete()
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  revalidatePath('/admin')

  return { success: true }
}

export async function reorderProblems(problemIds: string[]) {
  const supabase = await createClient()
  if (!(await checkAdmin(supabase))) {
    return { error: 'Unauthorized. Admin role required.' }
  }

  if (!problemIds || problemIds.length === 0) {
    return { error: 'No problems specified for reordering' }
  }

  for (let i = 0; i < problemIds.length; i++) {
    const { error } = await supabase
      .from('problems')
      .update({ orderIndex: i })
      .eq('id', problemIds[i])
    
    if (error) {
      return { error: error.message }
    }
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
