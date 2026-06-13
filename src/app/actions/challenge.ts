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
  const file = formData.get('screenshot') as File | null

  if (!challengeDayId) {
    return { error: 'Challenge day ID is required' }
  }

  let screenshotUrl: string | null = null

  // If a file is uploaded, upload to Supabase Storage bucket 'submissions'
  if (file && file.size > 0 && file.name !== 'undefined') {
    try {
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const fileExt = file.name.split('.').pop() || 'png'
      const filePath = `${user.id}/${challengeDayId}-${Date.now()}.${fileExt}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('submissions')
        .upload(filePath, buffer, {
          contentType: file.type,
          upsert: true
        })

      if (uploadError) {
        // Fallback: If bucket does not exist, let user know or log it.
        // In real use, admins must create the 'submissions' bucket and make it public.
        return { error: `Storage upload failed: ${uploadError.message}. Make sure the 'submissions' bucket is created and set to public in Supabase.` }
      }

      const { data: urlData } = supabase.storage
        .from('submissions')
        .getPublicUrl(filePath)

      screenshotUrl = urlData.publicUrl
    } catch (err: any) {
      return { error: `Failed to process image: ${err.message}` }
    }
  }

  if (!screenshotUrl && !profileLink) {
    return { error: 'Please upload a screenshot or provide a LeetCode profile link.' }
  }

  // Insert submission
  const { error: dbError } = await supabase
    .from('submissions')
    .insert({
      userId: user.id,
      challengeDayId,
      screenshotUrl,
      profileLink: profileLink || null,
      status: 'approved' // Auto-approve to make progress immediate for users
    })

  if (dbError) {
    if (dbError.code === '23505') { // Unique constraint code
      return { error: 'You have already submitted a solution for this day!' }
    }
    return { error: `Database submission failed: ${dbError.message}` }
  }

  revalidatePath('/dashboard')
  revalidatePath('/profile')
  revalidatePath('/leaderboard')

  return { success: true }
}
