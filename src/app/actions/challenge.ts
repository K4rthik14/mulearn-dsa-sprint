'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function submitChallenge(formData: FormData) {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Unauthorized' }
  }

  const challengeDayId = formData.get('challengeDayId') as string
  const profileLink = formData.get('profileLink') as string
  const subType = formData.get('subType') as string

  if (!challengeDayId) {
    return { error: 'Challenge day ID is required' }
  }

  if (!profileLink) {
    return { error: 'Please provide a link or submission ID.' }
  }

  // Check for existing submission
  const { data: existingSub } = await supabase
    .from('submissions')
    .select('id, status')
    .eq('userId', user.id)
    .eq('challengeDayId', challengeDayId)
    .maybeSingle()

  let dbError = null

  if (existingSub) {
    // If rejected or pending, allow resubmission
    if (existingSub.status === 'rejected' || existingSub.status === 'pending') {
      const { error } = await supabase
        .from('submissions')
        .update({
          screenshotUrl: subType || 'Link', // Store subType here
          profileLink: profileLink || null,
          status: 'pending',
          rejectionReason: null,
          submittedAt: new Date().toISOString()
        })
        .eq('id', existingSub.id)
      dbError = error
    } else {
      return { error: 'You have already submitted a solution for this day!' }
    }
  } else {
    const { error } = await supabase
      .from('submissions')
      .insert({
        userId: user.id,
        challengeDayId,
        screenshotUrl: subType || 'Link', // Store subType here
        profileLink: profileLink || null,
        status: 'pending'
      })
    dbError = error
  }

  if (dbError) {
    return { error: `Database submission failed: ${dbError.message}` }
  }

  revalidatePath('/')
  revalidatePath('/challenge')
  revalidatePath('/submissions')
  revalidatePath('/profile')
  revalidatePath('/leaderboard')

  return { success: true }
}
