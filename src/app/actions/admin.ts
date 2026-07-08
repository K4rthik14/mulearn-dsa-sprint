'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { isUserAdmin } from '@/utils/supabase/user'

// Helper to check if caller is admin
async function checkAdmin(supabase: any) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { data: dbUser } = await supabase
    .from('users')
    .select('isAdmin')
    .eq('id', user.id)
    .single()

  const mergedUser = {
    ...user,
    ...(dbUser || {})
  }
  const isAdmin = isUserAdmin(mergedUser)

  console.log('[Server Action Admin Check Log]:', {
    userId: user.id,
    email: user.email,
    rawDbUser: dbUser,
    rawAuthUserAppMetadata: user.app_metadata,
    rawAuthUserUserMetadata: user.user_metadata,
    adminNormalized: isAdmin,
    reason: isAdmin ? 'Action permitted' : 'Action rejected - user is not an admin'
  })

  return isAdmin
}

export async function createChallengeDay(formData: FormData) {
  const supabase = await createClient()
  if (!(await checkAdmin(supabase))) {
    return { error: 'Unauthorized. Admin role required.' }
  }

  const sprintId = formData.get('sprintId') as string
  const dayNumber = parseInt(formData.get('dayNumber') as string)
  const topic = formData.get('topic') as string
  const description = formData.get('description') as string
  const difficulty = formData.get('difficulty') as string || 'Easy'
  const unlockDayVal = formData.get('unlockDay') as string
  const unlockDay = unlockDayVal ? parseInt(unlockDayVal) : null

  if (!sprintId || isNaN(dayNumber) || !topic || !description) {
    return { error: 'All fields are required (including Sprint) and Day Number must be a number' }
  }

  const { error } = await supabase
    .from('challengedays')
    .insert({ 
      sprintId,
      dayNumber, 
      topic, 
      description,
      difficulty,
      unlockDay
    })

  if (error) {
    if (error.code === '23505') {
      return { error: `Day ${dayNumber} already exists in this sprint!` }
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
  const sprintId = formData.get('sprintId') as string
  const dayNumber = parseInt(formData.get('dayNumber') as string)
  const topic = formData.get('topic') as string
  const description = formData.get('description') as string
  const difficulty = formData.get('difficulty') as string || 'Easy'
  const unlockDayVal = formData.get('unlockDay') as string
  const unlockDay = unlockDayVal ? parseInt(unlockDayVal) : null

  if (!id || !sprintId || isNaN(dayNumber) || !topic || !description) {
    return { error: 'All fields are required and Day Number must be a number' }
  }

  const { error } = await supabase
    .from('challengedays')
    .update({ 
      sprintId,
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

export async function updateSubmissionStatus(
  submissionId: string, 
  status: 'approved' | 'rejected', 
  rejectionReason?: string
) {
  const supabase = await createClient()
  if (!(await checkAdmin(supabase))) {
    return { error: 'Unauthorized. Admin role required.' }
  }

  // Get submission to find the userId
  const { data: subData, error: fetchErr } = await supabase
    .from('submissions')
    .select('userId, challengeDayId')
    .eq('id', submissionId)
    .single()

  if (fetchErr || !subData) {
    return { error: fetchErr?.message || 'Submission not found' }
  }

  const userId = subData.userId

  // Update status
  const updateData: any = { 
    status,
    rejectionReason: status === 'rejected' ? (rejectionReason || 'No reason specified') : null
  }

  const { error: updateErr } = await supabase
    .from('submissions')
    .update(updateData)
    .eq('id', submissionId)

  if (updateErr) {
    return { error: updateErr.message }
  }

  // Recalculate User Stats for Leaderboard
  // 1. Fetch all approved submissions for the user
  const { data: userSubs } = await supabase
    .from('submissions')
    .select('challengeDayId, submittedAt, challengedays(dayNumber)')
    .eq('userId', userId)
    .eq('status', 'approved')

  const approvedSubs = userSubs || []

  // 2. Fetch all problems to calculate points
  let totalScore = 0
  const completedDayIds = approvedSubs.map((s: any) => s.challengeDayId)
  
  if (completedDayIds.length > 0) {
    for (const dayId of completedDayIds) {
      const { data: probs } = await supabase
        .from('problems')
        .select('points')
        .eq('challengeDayId', dayId)

      const dayPoints = probs && probs.length > 0 
        ? probs.reduce((sum: number, p: any) => sum + (p.points || 0), 0)
        : 10 // baseline
      
      totalScore += dayPoints
    }
  }

  // 3. Calculate streak and longest streak
  const completedDayNumbers = approvedSubs
    .map((s: any) => s.challengedays?.dayNumber || 0)
    .filter(Boolean)
  
  completedDayNumbers.sort((a: number, b: number) => a - b)

  let currentStreak = 0
  let longestStreakVal = 0

  if (completedDayNumbers.length > 0) {
    currentStreak = 1
    let lastDay = completedDayNumbers[completedDayNumbers.length - 1]
    for (let i = completedDayNumbers.length - 2; i >= 0; i--) {
      if (completedDayNumbers[i] === lastDay - 1) {
        currentStreak++
        lastDay = completedDayNumbers[i]
      } else if (completedDayNumbers[i] === lastDay) {
        continue
      } else {
        break
      }
    }

    let currentRun = 0
    let prevDay = -999
    for (const day of completedDayNumbers) {
      if (day === prevDay + 1) {
        currentRun++
      } else if (day === prevDay) {
        // skip duplicate
      } else {
        currentRun = 1
      }
      prevDay = day
      if (currentRun > longestStreakVal) {
        longestStreakVal = currentRun
      }
    }
  }

  // 4. Update or Insert Leaderboard Entry
  const latestSubDate = approvedSubs.length > 0
    ? approvedSubs.sort((a: any, b: any) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())[0].submittedAt
    : null

  const { error: leadErr } = await supabase
    .from('leaderboard')
    .upsert({
      userId,
      score: totalScore,
      streak: currentStreak,
      longestStreak: longestStreakVal,
      lastSubmittedAt: latestSubDate
    })

  if (leadErr) {
    console.error('Failed to update leaderboard entry:', leadErr.message)
  }

  revalidatePath('/admin')
  revalidatePath('/dashboard')
  revalidatePath('/leaderboard')
  revalidatePath('/profile')

  return { success: true }
}

export async function banUser(userId: string, isBanned: boolean) {
  const supabase = await createClient()
  if (!(await checkAdmin(supabase))) {
    return { error: 'Unauthorized. Admin role required.' }
  }

  const { error } = await supabase
    .from('users')
    .update({ isBanned })
    .eq('id', userId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin')
  revalidatePath('/leaderboard')
  revalidatePath('/profile')
  revalidatePath('/dashboard')

  return { success: true }
}

export async function resetStreak(userId: string) {
  const supabase = await createClient()
  if (!(await checkAdmin(supabase))) {
    return { error: 'Unauthorized. Admin role required.' }
  }

  const { error } = await supabase
    .from('leaderboard')
    .update({ streak: 0, longestStreak: 0 })
    .eq('userId', userId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin')
  revalidatePath('/leaderboard')
  revalidatePath('/profile')
  revalidatePath('/dashboard')

  return { success: true }
}

export async function giveBonusPoints(userId: string, bonusPoints: number) {
  const supabase = await createClient()
  if (!(await checkAdmin(supabase))) {
    return { error: 'Unauthorized. Admin role required.' }
  }

  if (isNaN(bonusPoints) || bonusPoints === 0) {
    return { error: 'Invalid points value' }
  }

  const { data: lead } = await supabase
    .from('leaderboard')
    .select('score, streak, longestStreak')
    .eq('userId', userId)
    .maybeSingle()

  const currentScore = lead?.score || 0
  const newScore = currentScore + bonusPoints

  const { error } = await supabase
    .from('leaderboard')
    .upsert({
      userId,
      score: newScore,
      streak: lead?.streak || 0,
      longestStreak: lead?.longestStreak || 0
    })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin')
  revalidatePath('/leaderboard')
  revalidatePath('/profile')
  revalidatePath('/dashboard')

  return { success: true }
}

export async function createSprint(formData: FormData) {
  const supabase = await createClient()
  if (!(await checkAdmin(supabase))) {
    return { error: 'Unauthorized. Admin role required.' }
  }

  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const slug = formData.get('slug') as string
  const durationDaysStr = formData.get('durationDays') as string

  if (!name || !description || !slug || !durationDaysStr) {
    return { error: 'All fields are required' }
  }

  const durationDays = parseInt(durationDaysStr, 10)
  if (isNaN(durationDays) || durationDays <= 0) {
    return { error: 'Duration days must be a positive number' }
  }

  const { error } = await supabase
    .from('sprints')
    .insert({
      name,
      description,
      slug,
      durationDays
    })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin')
  revalidatePath('/tracks')
  revalidatePath('/')

  return { success: true }
}

