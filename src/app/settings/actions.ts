'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { parseSafeFloat } from '@/lib/utils'

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Unauthorized')

  const displayName = formData.get('displayName') as string
  const email = formData.get('email') as string
  const phone = formData.get('phone') as string
  const address = formData.get('address') as string
  const businessLicense = formData.get('businessLicense') as string
  const proformaSequenceStart = parseInt(formData.get('proformaSequenceStart') as string) || 1
  const termsConditions = formData.get('termsConditions') as string
  const pdfFontSize = parseInt(formData.get('pdfFontSize') as string) || 10
  const logoFile = formData.get('logoFile') as File | null
  const removeLogo = formData.get('removeLogo') === 'true'

  let logoUrl = undefined

  if (removeLogo) {
    logoUrl = null
  }

  if (logoFile && logoFile.size > 0) {
    const fileExt = logoFile.name.split('.').pop()
    const fileName = `${user.id}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `logos/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('company-logos')
      .upload(filePath, logoFile, {
        cacheControl: '3600',
        upsert: true
      })

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage
      .from('company-logos')
      .getPublicUrl(filePath)

    logoUrl = publicUrl
  }

  const updateData: any = {
    display_name: displayName,
    email: email,
    phone: phone,
    address: address,
    business_license: businessLicense,
    proforma_sequence_start: proformaSequenceStart,
    terms_conditions: termsConditions,
    pdf_font_size: pdfFontSize
  }

  if (logoUrl !== undefined) {
    updateData.logo_url = logoUrl
  }

  const { error } = await supabase
    .from('users')
    .update(updateData)
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
  const percentage = parseSafeFloat(formData.get('percentage') as string)

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

export async function updateTax(id: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Unauthorized')

  const name = formData.get('name') as string
  const percentage = parseSafeFloat(formData.get('percentage') as string)

  const { error } = await supabase
    .from('taxes')
    .update({
      name,
      percentage
    })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) throw error

  revalidatePath('/settings')
  return { success: true }
}
