'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    options: {
      data: {
        phone: formData.get('phone') as string,
        address: formData.get('address') as string,
        company_name: formData.get('company_name') as string,
        website: formData.get('website') as string,
        workers: formData.get('workers') as string,
        sector: formData.get('sector') as string,
        job_types: formData.get('job_types') as string,
      }
    }
  }

  const { error } = await supabase.auth.signUp(data)

  if (error) {
    redirect('/register?error=Could not authenticate user')
  }

  revalidatePath('/', 'layout')
  redirect('/')
}
