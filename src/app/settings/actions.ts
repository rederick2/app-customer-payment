'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Unauthorized')

  const displayName = formData.get('displayName') as string
  const phone = formData.get('phone') as string
  const address = formData.get('address') as string
  const proformaSequenceStart = parseInt(formData.get('proformaSequenceStart') as string) || 1

  const { error } = await supabase
    .from('users')
    .update({
      display_name: displayName,
      phone: phone,
      address: address,
      proforma_sequence_start: proformaSequenceStart
    })
    .eq('id', user.id)

  if (error) throw error

  revalidatePath('/settings')
  return { success: true }
}

export async function updatePaymentInfo(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Unauthorized')

  const bankName = formData.get('bankName') as string
  const bankAccount = formData.get('bankAccount') as string

  const { error } = await supabase
    .from('users')
    .update({
      bank_name: bankName,
      bank_account: bankAccount,
    })
    .eq('id', user.id)

  if (error) throw error

  revalidatePath('/settings')
  return { success: true }
}

export async function addTax(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Unauthorized')

  const name = formData.get('name') as string
  const percentage = parseFloat(formData.get('percentage') as string)

  const { error } = await supabase
    .from('taxes')
    .insert({
      name,
      percentage,
      user_id: user.id
    })

  if (error) throw error

  revalidatePath('/settings')
  return { success: true }
}

export async function deleteTax(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('taxes')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) throw error

  revalidatePath('/settings')
  return { success: true }
}
